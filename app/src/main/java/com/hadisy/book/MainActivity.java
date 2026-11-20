package com.hadisy.book;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.InputStream;

public class MainActivity extends Activity {
    WebView w;
    static final String HOST = "appassets.androidplatform.net";

    class Bridge {
        @JavascriptInterface public void exit() { runOnUiThread(() -> finish()); }
        @JavascriptInterface public String version() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
        }
        @JavascriptInterface public void copy(String t) {
            ClipboardManager c = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            c.setPrimaryClip(ClipData.newPlainText("text", t));
        }
    }

    static String mime(String f) {
        if (f.endsWith(".html")) return "text/html";
        if (f.endsWith(".js")) return "text/javascript";
        if (f.endsWith(".wasm")) return "application/wasm";
        if (f.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        w = new WebView(this);
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        w.addJavascriptInterface(new Bridge(), "Android");
        w.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String p = u.getPath();
                if (!HOST.equals(u.getHost()) || p == null || !p.startsWith("/assets/")) return null;
                String f = p.substring(8);
                try {
                    InputStream in = getAssets().open(f);
                    String m = mime(f);
                    return new WebResourceResponse(m, m.startsWith("text") ? "utf-8" : null, in);
                } catch (Exception e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, new ByteArrayInputStream(new byte[0]));
                }
            }
        });
        setContentView(w);
        w.loadUrl("https://" + HOST + "/assets/index.html");
    }

    @Override public void onBackPressed() {
        String u = w.getUrl();
        if (u == null || u.endsWith("index.html")) finish();
        else w.evaluateJavascript("history.back()", null);
    }
}
