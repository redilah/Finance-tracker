package com.redilah.financetracker.assistant;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CassielFloatingBubble")
public class CassielFloatingBubblePlugin extends Plugin {

    private static final String TAG = "CassielFloatingBubble";

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            granted = Settings.canDrawOverlays(getContext());
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(getContext())) {
                    Intent intent = new Intent(
                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:" + getContext().getPackageName())
                    );
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                }
            }
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Gagal membuka halaman pengaturan overlay: " + e.getMessage(), e);
            call.reject("Gagal membuka pengaturan: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startBubble(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
                call.reject("Izin Tampilkan di atas aplikasi lain belum diberikan.");
                return;
            }

            Intent intent = new Intent(getContext(), CassielFloatingBubbleService.class);
            getContext().startService(intent);

            JSObject ret = new JSObject();
            ret.put("started", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Gagal memulai CassielFloatingBubbleService: " + e.getMessage(), e);
            call.reject("Gagal memulai tombol melayang: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopBubble(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), CassielFloatingBubbleService.class);
            getContext().stopService(intent);

            JSObject ret = new JSObject();
            ret.put("stopped", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Gagal menghentikan CassielFloatingBubbleService: " + e.getMessage(), e);
            call.reject("Gagal menghentikan tombol melayang: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isBubbleRunning(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("running", CassielFloatingBubbleService.isServiceRunning);
        call.resolve(ret);
    }
}
