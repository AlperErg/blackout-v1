// usePartyTracker.js
import { useState, useEffect, useRef } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { encode as base64encode, decode as base64decode } from 'base-64';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SERVICE_UUID: "0000ABCD-0000-1000-8000-00805F9B34FB",
  ATTENDEE_DATA_CHARACTERISTIC_UUID: "0000ABCE-0000-1000-8000-00805F9B34FB",
  PRESENCE_PING_CHARACTERISTIC_UUID: "0000ABCF-0000-1000-8000-00805F9B34FB",

  PRESENCE_TIMEOUT: 4 * 60 * 1000,
  PING_INTERVAL: 30 * 1000,
  DEPARTURE_CHECK_INTERVAL: 60 * 1000,
};

const generateDeviceId = () =>
  `device-${Math.random().toString(36).substr(2, 9)}`;

const generateAnnouncementId = (deviceId) =>
  `${deviceId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ============================================================================
// MAIN HOOK
// ============================================================================

const usePartyTracker = (expectedPartySize = 100, partyId) => {
  if (!partyId) {
    throw new Error('usePartyTracker requires a partyId');
  }

  const MIN_CONNECTIONS_FOR_PARTY = Math.max(
    2,
    Math.min(8, Math.floor(expectedPartySize * 0.08))
  );

  const NEW_MEMBER_TIMEOUT =
    expectedPartySize <= 10
      ? 2 * 60 * 1000
      : expectedPartySize <= 30
      ? 3 * 60 * 1000
      : 4 * 60 * 1000;

  const [manager] = useState(() => new BleManager());

  const config = {
    ...CONFIG,
    PARTY_ID: partyId,
    MIN_CONNECTIONS_FOR_PARTY,
    NEW_MEMBER_TIMEOUT,
  };

  // Identity
  const [myDeviceId] = useState(generateDeviceId());
  const [myName, setMyName] = useState('');
  const [myRole, setMyRole] = useState('guest');
  const [isInitialized, setIsInitialized] = useState(false);

  // Connections
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  // Attendees
  const [attendees, setAttendees] = useState(new Map());
  const [leftParty, setLeftParty] = useState([]);
  const [lastNewMemberTime, setLastNewMemberTime] = useState(Date.now());
  const [knownDeviceIds] = useState(new Set());

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [seenAnnouncementIds] = useState(new Set());

  // Party status
  const [isAtParty, setIsAtParty] = useState(false);

  const pingIntervalRef = useRef(null);
  const presenceCheckIntervalRef = useRef(null);

  // ============================================================================
  // ATTENDEE MANAGEMENT
  // ============================================================================

  const updateAttendee = (attendeeData) => {
    const isNewMember = !knownDeviceIds.has(attendeeData.deviceId);

    if (isNewMember && !attendeeData.isMe) {
      knownDeviceIds.add(attendeeData.deviceId);
      setLastNewMemberTime(Date.now());
    }

    setAttendees(prev => {
      const updated = new Map(prev);
      updated.set(attendeeData.deviceId, {
        ...attendeeData,
        lastSeen: Date.now(),
      });
      return updated;
    });
  };

  const checkForDepartures = () => {
    const now = Date.now();

    attendees.forEach((attendee, deviceId) => {
      if (attendee.isMe) return;

      if (now - attendee.lastSeen > config.PRESENCE_TIMEOUT) {
        setAttendees(prev => {
          const updated = new Map(prev);
          updated.delete(deviceId);
          return updated;
        });

        setLeftParty(prev => [
          ...prev,
          { ...attendee, leftAt: Date.now() },
        ]);
      }
    });
  };

  // ============================================================================
  // PARTY STATUS
  // ============================================================================

  useEffect(() => {
    const hasEnoughConnections =
      connectedDevices.length >= config.MIN_CONNECTIONS_FOR_PARTY;
    const recentlyGrowing =
      Date.now() - lastNewMemberTime < config.NEW_MEMBER_TIMEOUT;

    const atParty = hasEnoughConnections && recentlyGrowing;
    setIsAtParty(atParty);

    if (atParty && isInitialized) {
      updateAttendee({
        deviceId: myDeviceId,
        name: myName,
        role: myRole,
        isMe: true,
      });
    }
  }, [connectedDevices.length, lastNewMemberTime, isInitialized]);

  // ============================================================================
  // BROADCASTING
  // ============================================================================

  const broadcastRaw = async (payload, characteristic) => {
    const encoded = base64encode(JSON.stringify(payload));

    for (const device of connectedDevices) {
      try {
        await device.writeCharacteristicWithResponseForService(
          config.SERVICE_UUID,
          characteristic,
          encoded
        );
      } catch {}
    }
  };

  const broadcastPresence = async () => {
    if (!isInitialized) return;

    await broadcastRaw(
      {
        type: 'presence',
        partyId: config.PARTY_ID,
        deviceId: myDeviceId,
        name: myName,
        role: myRole,
        timestamp: Date.now(),
      },
      config.PRESENCE_PING_CHARACTERISTIC_UUID
    );
  };

  const broadcastAttendeeList = async () => {
    await broadcastRaw(
      {
        type: 'attendee_list',
        partyId: config.PARTY_ID,
        attendees: Array.from(attendees.values()),
        timestamp: Date.now(),
      },
      config.ATTENDEE_DATA_CHARACTERISTIC_UUID
    );
  };

  // ============================================================================
  // HOST ANNOUNCEMENTS
  // ============================================================================

  const sendAnnouncement = async (message) => {
    if (myRole !== 'host') return;

    const announcement = {
      type: 'announcement',
      partyId: config.PARTY_ID,
      announcementId: generateAnnouncementId(myDeviceId),
      hostDeviceId: myDeviceId,
      message,
      timestamp: Date.now(),
    };

    seenAnnouncementIds.add(announcement.announcementId);
    setAnnouncements(prev => [announcement, ...prev]);

    await broadcastRaw(
      announcement,
      config.ATTENDEE_DATA_CHARACTERISTIC_UUID
    );
  };

  // ============================================================================
  // RECEIVING
  // ============================================================================

  const handleIncomingMessage = (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    if (data.partyId !== config.PARTY_ID) return;

    if (data.type === 'presence') {
      updateAttendee({ ...data, isMe: false });
    }

    if (data.type === 'attendee_list') {
      data.attendees.forEach(a => updateAttendee(a));
    }

    if (data.type === 'announcement') {
      if (seenAnnouncementIds.has(data.announcementId)) return;

      const host = attendees.get(data.hostDeviceId);
      if (!host || host.role !== 'host') return;

      seenAnnouncementIds.add(data.announcementId);
      setAnnouncements(prev => [data, ...prev]);

      broadcastRaw(data, config.ATTENDEE_DATA_CHARACTERISTIC_UUID);
    }
  };

  // ============================================================================
  // BLE CONNECTIONS
  // ============================================================================

  const connectToDevice = async (device) => {
    if (connectedDevices.find(d => d.id === device.id)) return;

    const connected = await device.connect();
    const ready = await connected.discoverAllServicesAndCharacteristics();

    ready.monitorCharacteristicForService(
      config.SERVICE_UUID,
      config.PRESENCE_PING_CHARACTERISTIC_UUID,
      (_, c) => c?.value && handleIncomingMessage(base64decode(c.value))
    );

    ready.monitorCharacteristicForService(
      config.SERVICE_UUID,
      config.ATTENDEE_DATA_CHARACTERISTIC_UUID,
      (_, c) => c?.value && handleIncomingMessage(base64decode(c.value))
    );

    setConnectedDevices(prev => [...prev, ready]);
  };

  const startScanning = () => {
    setIsScanning(true);
    manager.startDeviceScan([config.SERVICE_UUID], null, (_, device) => {
      if (device) connectToDevice(device);
    });
  };

  const stopScanning = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  const initialize = (name, role = 'guest') => {
    setMyName(name);
    setMyRole(role);
    setIsInitialized(true);
  };

  useEffect(() => {
    if (!isInitialized) return;

    startScanning();

    pingIntervalRef.current = setInterval(() => {
      broadcastPresence();
      broadcastAttendeeList();
    }, config.PING_INTERVAL);

    presenceCheckIntervalRef.current = setInterval(
      checkForDepartures,
      config.DEPARTURE_CHECK_INTERVAL
    );
  }, [isInitialized]);

  useEffect(() => {
    return () => {
      stopScanning();
      clearInterval(pingIntervalRef.current);
      clearInterval(presenceCheckIntervalRef.current);
      manager.destroy();
    };
  }, []);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    myDeviceId,
    myName,
    myRole,
    isAtParty,
    isScanning,

    attendees: Array.from(attendees.values()),
    announcements,
    leftParty,

    initialize,
    sendAnnouncement,

    config,
  };
};

export default usePartyTracker;
