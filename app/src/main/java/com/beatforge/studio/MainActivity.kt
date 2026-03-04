package com.beatforge.studio

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Environment
import android.util.Base64
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import java.io.File
import java.io.FileOutputStream

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Immersive full-screen mode
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

        webView = findViewById(R.id.webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            databaseEnabled = true
            setSupportMultipleWindows(false)
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        webView.addJavascriptInterface(ExportInterface(), "AndroidExport")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
            }
        }

        webView.loadUrl("file:///android_asset/index.html")
    }

    inner class ExportInterface {
        @JavascriptInterface
        fun saveFile(base64Data: String, fileName: String, mimeType: String): Boolean {
            return try {
                val decodedData = Base64.decode(base64Data, Base64.DEFAULT)
                val musicDir = Environment.getExternalStoragePublicDirectory(
                    Environment.DIRECTORY_MUSIC
                )
                val beatforgeDir = File(musicDir, "BeatForge")
                if (!beatforgeDir.exists()) beatforgeDir.mkdirs()

                val file = File(beatforgeDir, fileName)
                FileOutputStream(file).use { it.write(decodedData) }

                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Saved to Music/BeatForge/$fileName",
                        Toast.LENGTH_LONG
                    ).show()
                }
                true
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Export failed: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
                false
            }
        }

        @JavascriptInterface
        fun shareFile(base64Data: String, fileName: String, mimeType: String): Boolean {
            return try {
                val decodedData = Base64.decode(base64Data, Base64.DEFAULT)
                val exportDir = File(cacheDir, "exports")
                if (!exportDir.exists()) exportDir.mkdirs()

                val file = File(exportDir, fileName)
                FileOutputStream(file).use { it.write(decodedData) }

                val uri = FileProvider.getUriForFile(
                    this@MainActivity,
                    "${packageName}.fileprovider",
                    file
                )

                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = mimeType
                    putExtra(Intent.EXTRA_STREAM, uri)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                startActivity(Intent.createChooser(shareIntent, "Share your masterpiece"))
                true
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Share failed: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
                false
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }
}
