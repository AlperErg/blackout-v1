package expo.modules.androidblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper

class BlockingService : Service() {

  companion object {
    const val ACTION_START = "expo.modules.androidblocker.START"
    const val ACTION_STOP = "expo.modules.androidblocker.STOP"
    private const val CHANNEL_ID = "blackout_blocking"
    private const val NOTIFICATION_ID = 9001
    private const val POLL_INTERVAL_MS = 800L

    @Volatile
    var isRunning = false
      private set
  }

  private val handler = Handler(Looper.getMainLooper())
  private var usageStatsManager: UsageStatsManager? = null
  private var ownPackageName: String = ""
  private var overlayShowing = false

  private val pollRunnable = object : Runnable {
    override fun run() {
      if (!isRunning) return
      // If user closed the overlay (e.g. "Return to Blackout"), allow showing again next time
      if (overlayShowing && !BlockingOverlayActivity.isShowing()) {
        overlayShowing = false
      }
      val foregroundPackage = getCurrentForegroundPackage()
      if (foregroundPackage != null &&
          foregroundPackage != ownPackageName &&
          foregroundPackage != "com.android.systemui" &&
          foregroundPackage != "com.android.launcher" &&
          !foregroundPackage.startsWith("com.android.launcher") &&
          !foregroundPackage.startsWith("com.google.android.apps.nexuslauncher") &&
          foregroundPackage != "com.sec.android.app.launcher" &&
          foregroundPackage != "com.huawei.android.launcher"
      ) {
        showOverlay()
      }
      // Do not auto-dismiss when our package is in foreground: the overlay activity
      // is in our package, so that would cause show → dismiss → show loop.
      // Overlay is only dismissed when user taps "Return to Blackout" or stopBlocking().
      handler.postDelayed(this, POLL_INTERVAL_MS)
    }
  }

  override fun onCreate() {
    super.onCreate()
    ownPackageName = packageName
    usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START -> {
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        isRunning = true
        overlayShowing = false
        handler.post(pollRunnable)
      }
      ACTION_STOP -> {
        stopSelf()
      }
    }
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    isRunning = false
    handler.removeCallbacks(pollRunnable)
    dismissOverlay()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun getCurrentForegroundPackage(): String? {
    val usm = usageStatsManager ?: return null
    val now = System.currentTimeMillis()
    val events = usm.queryEvents(now - 5000, now)
    var lastPackage: String? = null
    val event = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
        lastPackage = event.packageName
      }
    }
    return lastPackage
  }

  private fun showOverlay() {
    if (overlayShowing) return
    overlayShowing = true
    val intent = Intent(this, BlockingOverlayActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    startActivity(intent)
  }

  private fun dismissOverlay() {
    if (!overlayShowing) return
    overlayShowing = false
    BlockingOverlayActivity.finishIfRunning()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Blackout Session",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Shows while Blackout is blocking apps"
      }
      val nm = getSystemService(NotificationManager::class.java)
      nm?.createNotificationChannel(channel)
    }
  }

  private fun buildNotification(): Notification {
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }
    return builder
      .setContentTitle("Blackout is active")
      .setContentText("Apps are blocked during your session")
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setOngoing(true)
      .build()
  }
}
