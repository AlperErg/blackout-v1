# usePartyTracker Hook - AI Reference

## Overview
BLE mesh networking hook for real-time party attendance tracking. Phones communicate peer-to-peer via Bluetooth Low Energy.

## Installation

```bash
npm install react-native-ble-plx base-64 react-native-permissions
npm install react-native-ble-advertise  # Android advertising
```

### iOS Info.plist
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Bluetooth for party attendance tracking</string>
<key>UIBackgroundModes</key>
<array>
  <string>bluetooth-central</string>
  <string>bluetooth-peripheral</string>
</array>
```

### Android Manifest
```xml
<!-- Android 12+ -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>

<!-- Android 11 and below -->
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
```

## Usage

```javascript
import usePartyTracker from './hooks/usePartyTracker';

const tracker = usePartyTracker(expectedPartySize);
tracker.initialize(name, role);  // role: 'guest' | 'host'
```

## API

### Hook Signature
```typescript
usePartyTracker(expectedPartySize?: number) => TrackerObject
```

### Returned Object
```typescript
{
  // Identity
  myDeviceId: string,
  myName: string,
  myRole: 'guest' | 'host',
  
  // Status
  isInitialized: boolean,
  isAtParty: boolean,        // (connections >= MIN) && (newMember < 4min)
  isScanning: boolean,
  
  // Connections
  connectedDevices: Device[],
  connectionCount: number,
  
  // Attendees
  attendees: Attendee[],     // Current attendees
  hosts: Attendee[],         // role === 'host'
  guests: Attendee[],        // role === 'guest'
  leftParty: LeftAttendee[], // Haven't been seen in 4 min
  totalAttendeesCount: number,
  
  // Metrics
  timeSinceNewMember: number,  // ms since last NEW device ID
  knownMembersCount: number,   // Total unique IDs ever seen
  
  // Actions
  initialize: (name: string, role?: 'guest' | 'host') => void,
  startTracking: () => void,
  stopTracking: () => void,
  
  // Config
  config: ConfigObject
}
```

### Types
```typescript
type Attendee = {
  deviceId: string,
  name: string,
  role: 'guest' | 'host',
  lastSeen: number,  // timestamp
  isMe: boolean
}

type LeftAttendee = Attendee & {
  leftAt: number  // timestamp
}
```

## Core Logic

### Party Detection (Two Conditions)
```javascript
isAtParty = (connections >= MIN_CONNECTIONS) && (timeSinceNewMember < TIMEOUT)
```

**Condition 1: Connection Count**
- Must have >= MIN_CONNECTIONS_FOR_PARTY
- Scales: `Math.max(2, Math.min(8, partySize * 0.08))`
- Examples: 5 people → 2 connections, 100 people → 8 connections

**Condition 2: Network Growth**  
- Must have seen NEW member within NEW_MEMBER_TIMEOUT
- Small parties (≤10): 2 min, Medium (11-30): 3 min, Large (31+): 4 min
- Detects if network is static (left) vs dynamic (at party)

### Configuration (Dynamic)

| Party Size | Min Connections | New Member Timeout |
|------------|----------------|-------------------|
| 5          | 2              | 2 minutes         |
| 10         | 2              | 2 minutes         |
| 30         | 2              | 3 minutes         |
| 100        | 8              | 4 minutes         |
| 200+       | 8              | 4 minutes         |

### Static Config
```javascript
SERVICE_UUID: "0000ABCD-0000-1000-8000-00805F9B34FB"
ATTENDEE_DATA_CHARACTERISTIC_UUID: "0000ABCE-0000-1000-8000-00805F9B34FB"
PRESENCE_PING_CHARACTERISTIC_UUID: "0000ABCF-0000-1000-8000-00805F9B34FB"
PRESENCE_TIMEOUT: 4 * 60 * 1000        // 4 minutes until "left"
PING_INTERVAL: 30 * 1000               // Broadcast every 30 seconds
DEPARTURE_CHECK_INTERVAL: 60 * 1000    // Check departures every 1 minute
```

## Data Flow

### Initialization
1. `initialize(name, role)` called
2. Auto-triggers `startTracking()`
3. Starts scanning for devices
4. Starts broadcasting presence (every 30s)
5. Starts checking for departures (every 60s)

### Broadcasting (Every 30s)
```javascript
// Message 1: Presence
{
  type: 'presence',
  deviceId: myDeviceId,
  name: myName,
  role: myRole,
  timestamp: Date.now()
}

// Message 2: Full attendee list (mesh propagation)
{
  type: 'attendee_list',
  attendees: [{deviceId, name, role, lastSeen}, ...],
  timestamp: Date.now()
}
```

### Receiving Messages
```javascript
if (type === 'presence'):
  updateAttendee(single person)
  if (deviceId is new):
    lastNewMemberTime = now
    
if (type === 'attendee_list'):
  for each attendee:
    if (newer or unknown):
      updateAttendee(attendee)
```

### Departure Detection (Every 60s)
```javascript
for each attendee (except self):
  if (now - lastSeen > 4 minutes):
    remove from attendees
    add to leftParty
```

## Mesh Propagation Example

```
Phone A connects to Phone B
A: [A]        B: [B]

They exchange info
A: [A, B]     B: [A, B]

B connects to Phone C (A can't see C)
A: [A, B]     B: [A, B, C]     C: [C, B]

B tells A about C (mesh propagation)
A: [A, B, C]  B: [A, B, C]     C: [C, B, A]
```

Result: All 3 know about each other with only 2 connections.

## Key Functions

### `updateAttendee(attendeeData)`
- Checks if deviceId is new → updates `lastNewMemberTime`
- Adds to `knownDeviceIds` Set
- Updates attendees Map with fresh timestamp

### `checkForDepartures()`
- Loops through attendees
- If `lastSeen > 4 minutes ago` → move to leftParty

### `broadcastPresence()` & `broadcastAttendeeList()`
- Encodes data to base64 JSON
- Sends to all connected devices via BLE characteristics

### `startScanning()`
- Scans for devices advertising SERVICE_UUID
- Auto-connects when found

### `connectToDevice(device)`
- Connects, discovers services/characteristics
- Subscribes to incoming messages
- Sets up disconnect handler
- Adds to connectedDevices array

## Examples

### Basic Usage
```javascript
const tracker = usePartyTracker(50);
tracker.initialize('Alice', 'guest');

// Check status
console.log(tracker.isAtParty);  // true/false
console.log(tracker.hosts);      // [{name: 'Bob', ...}]
console.log(tracker.guests);     // [{name: 'Alice', ...}]
```

### Find Person
```javascript
const alice = tracker.attendees.find(a => a.name === 'Alice');
const secondsAgo = Math.floor((Date.now() - alice.lastSeen) / 1000);
```

### Override Config
```javascript
const tracker = usePartyTracker(50);
tracker.config.MIN_CONNECTIONS_FOR_PARTY = 3;
tracker.config.NEW_MEMBER_TIMEOUT = 5 * 60 * 1000;
```

## Critical Limitations

⚠️ **PERIPHERAL MODE NOT IMPLEMENTED**
- Hook only does central mode (scanning/connecting)
- Missing: Advertising (peripheral mode) - devices won't be discoverable
- Need: Native iOS CBPeripheralManager OR react-native-ble-advertise (Android)

Other:
- No encryption (cleartext broadcast)
- No authentication (anyone can spoof)
- iOS: 8-10 connection limit
- Android: 4-7 connection limit (varies)
- Background BLE severely limited (especially iOS)

## Troubleshooting

**isAtParty stays false:**
- Check: `connectionCount >= config.MIN_CONNECTIONS_FOR_PARTY`
- Check: `timeSinceNewMember < config.NEW_MEMBER_TIMEOUT`
- Solution: Lower thresholds or implement peripheral advertising

**Everyone marked "left" after 4 min:**
- Cause: Stable small group, no new members
- Solution: Increase NEW_MEMBER_TIMEOUT or set to `Infinity`

**High battery drain:**
- Reduce PING_INTERVAL: `tracker.config.PING_INTERVAL = 60000`

## Performance

**Battery:** 10-15% per hour active use
**Memory:** ~40 KB for 100 people
**Network:** 2-20 KB every 30s per device
**Max recommended:** 200 people (500+ causes congestion)

## State Variables (Internal)

```javascript
manager: BleManager                    // BLE instance
myDeviceId: string                     // Generated UUID
myName: string                         // User input
myRole: 'guest' | 'host'              // User input
isInitialized: boolean                 // Started?
connectedDevices: Device[]             // Active BLE connections
isScanning: boolean                    // Currently scanning?
isAtParty: boolean                     // At party?
attendees: Map<deviceId, Attendee>     // Current attendees
leftParty: LeftAttendee[]              // Departed attendees
lastNewMemberTime: number              // Timestamp of last NEW device
knownDeviceIds: Set<string>            // All device IDs ever seen
pingIntervalRef: Ref                   // 30s broadcast interval
presenceCheckIntervalRef: Ref          // 60s departure check interval
```

## Message Format

All messages are base64-encoded JSON sent via BLE characteristics.

**Presence Ping:**
```json
{
  "type": "presence",
  "deviceId": "device-abc123",
  "name": "Alice",
  "role": "guest",
  "timestamp": 1234567890
}
```

**Attendee List:**
```json
{
  "type": "attendee_list",
  "attendees": [
    {"deviceId": "device-abc123", "name": "Alice", "role": "guest", "lastSeen": 1234567890},
    {"deviceId": "device-def456", "name": "Bob", "role": "host", "lastSeen": 1234567891}
  ],
  "timestamp": 1234567892
}
```

## Dependencies Summary

**Required:**
- react-native-ble-plx (central mode)
- base-64 (encoding)
- react-native-permissions (runtime permissions)

**For Advertising (Critical Missing Piece):**
- iOS: Native Swift CBPeripheralManager module
- Android: react-native-ble-advertise

**Permissions:**
- iOS: NSBluetoothAlwaysUsageDescription
- Android 12+: BLUETOOTH_SCAN, BLUETOOTH_CONNECT, BLUETOOTH_ADVERTISE, ACCESS_FINE_LOCATION
- Android <12: BLUETOOTH, BLUETOOTH_ADMIN, ACCESS_FINE_LOCATION
