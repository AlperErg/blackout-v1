"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBreakTimers = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const COLLECTION = "breakTimers";
/**
 * Runs every minute. Finds break timers that have expired and sends
 * a silent push to re-enable shielding on the user's device.
 */
exports.processBreakTimers = (0, scheduler_1.onSchedule)("every 1 minutes", async () => {
    const db = (0, firestore_1.getFirestore)();
    const now = firestore_1.Timestamp.now();
    const snap = await db
        .collection(COLLECTION)
        .where("reenableAt", "<=", now)
        .get();
    if (snap.empty)
        return;
    const pushMessages = [];
    const deleteOps = [];
    for (const doc of snap.docs) {
        const data = doc.data();
        const token = data.pushToken;
        if (typeof token === "string" && token.startsWith("ExponentPushToken")) {
            pushMessages.push({
                to: token,
                data: { type: "break-relock" },
                priority: "high",
                _contentAvailable: true,
            });
        }
        deleteOps.push(doc.ref.delete());
    }
    if (pushMessages.length > 0) {
        await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(pushMessages),
        });
    }
    await Promise.all(deleteOps);
});
//# sourceMappingURL=index.js.map