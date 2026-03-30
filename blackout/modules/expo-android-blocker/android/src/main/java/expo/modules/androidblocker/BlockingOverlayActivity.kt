package expo.modules.androidblocker

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import java.lang.ref.WeakReference

class BlockingOverlayActivity : Activity() {

  companion object {
    private var currentInstance: WeakReference<BlockingOverlayActivity>? = null

    fun finishIfRunning() {
      currentInstance?.get()?.let {
        if (!it.isFinishing) it.finishAndRemoveTask()
      }
      currentInstance = null
    }

    fun isShowing(): Boolean = currentInstance?.get() != null
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    currentInstance = WeakReference(this)
    setContentView(R.layout.activity_blocking_overlay)

    findViewById<android.widget.TextView>(R.id.returnButton)?.setOnClickListener {
      returnToBlackout()
    }
  }

  override fun onBackPressed() {
    returnToBlackout()
  }

  private fun returnToBlackout() {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    if (launchIntent != null) {
      launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      startActivity(launchIntent)
    }
    finishAndRemoveTask()
  }

  override fun onDestroy() {
    if (currentInstance?.get() === this) {
      currentInstance = null
    }
    super.onDestroy()
  }
}
