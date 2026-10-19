package com.redilah.financetracker.motion;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * CassielMotionPlugin
 *
 * Jembatan Sensor Perangkat Keras Asli (Hardware Accelerometer) Android ke WebView.
 * Di Android WebView (Chromium), event DOM 'devicemotion' sering diblokir atau bernilai null.
 * Plugin ini membaca langsung dari Android SensorManager hardware secara real-time
 * dengan filter lolos-tinggi (high-pass filter) untuk memisahkan percepatan gerak tangan dari gravitasi bumi.
 */
@CapacitorPlugin(name = "CassielMotion")
public class CassielMotionPlugin extends Plugin implements SensorEventListener {

    private static final String TAG = "CassielMotionPlugin";

    private SensorManager sensorManager;
    private Sensor accelerometer;
    private Sensor linearAccelerometer;
    private boolean isListening = false;
    private boolean hasLinear = false;

    // Komponen gravitasi untuk isolasi high-pass jika linear accelerometer tidak tersedia
    private float gravityX = 0f;
    private float gravityY = 0f;
    private float gravityZ = 0f;
    private boolean gravityInitialized = false;

    // Alpha low-pass filter untuk gravitasi (0.85 = respons dinamis cepat)
    private static final float ALPHA = 0.85f;
    
    // Throttling mikro untuk efisiensi WebView bridge (~60 Hz / 16ms)
    private long lastEmitTimestamp = 0;
    private static final long MIN_EMIT_INTERVAL_MS = 16;

    @Override
    public void load() {
        super.load();
        try {
            sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
            if (sensorManager != null) {
                // Utamakan LINEAR_ACCELERATION (sudah terbebas dari gravitasi secara native dari Fused Sensor hardware)
                linearAccelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION);
                accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
                hasLinear = (linearAccelerometer != null);
                Log.d(TAG, "CassielMotionPlugin loaded. Native Linear Sensor: " + hasLinear);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing SensorManager: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (sensorManager == null) {
            call.reject("SensorManager is not available on this device.");
            return;
        }

        if (!isListening) {
            boolean registered = false;
            if (hasLinear) {
                registered = sensorManager.registerListener(this, linearAccelerometer, SensorManager.SENSOR_DELAY_GAME);
            }
            if (!registered && accelerometer != null) {
                registered = sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
            }

            if (registered) {
                isListening = true;
                gravityInitialized = false;
                Log.d(TAG, "Sensor listener registered successfully (SENSOR_DELAY_GAME).");
                call.resolve();
            } else {
                call.reject("Failed to register accelerometer sensor listener.");
            }
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        if (sensorManager != null && isListening) {
            sensorManager.unregisterListener(this);
            isListening = false;
            Log.d(TAG, "Sensor listener stopped.");
        }
        if (call != null) {
            call.resolve();
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        long now = System.currentTimeMillis();
        if (now - lastEmitTimestamp < MIN_EMIT_INTERVAL_MS) {
            return;
        }
        lastEmitTimestamp = now;

        float ax = 0f;
        float ay = 0f;
        float az = 0f;

        if (event.sensor.getType() == Sensor.TYPE_LINEAR_ACCELERATION) {
            // Sudah terbebas gravitasi bumi murni
            ax = event.values[0];
            ay = event.values[1];
            az = event.values[2];
        } else if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            // Isolasi gravitasi dengan High-Pass Filter: a_clean = a - gravity
            float rawX = event.values[0];
            float rawY = event.values[1];
            float rawZ = event.values[2];

            if (!gravityInitialized) {
                gravityX = rawX;
                gravityY = rawY;
                gravityZ = rawZ;
                gravityInitialized = true;
            } else {
                gravityX = ALPHA * gravityX + (1 - ALPHA) * rawX;
                gravityY = ALPHA * gravityY + (1 - ALPHA) * rawY;
                gravityZ = ALPHA * gravityZ + (1 - ALPHA) * rawZ;
            }

            ax = rawX - gravityX;
            ay = rawY - gravityY;
            az = rawZ - gravityZ;
        }

        // Kirim event data langsung ke WebView JavaScript
        JSObject data = new JSObject();
        data.put("x", ax);
        data.put("y", ay);
        data.put("z", az);
        notifyListeners("motion", data, false);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // No-op
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (sensorManager != null && isListening) {
            sensorManager.unregisterListener(this);
            isListening = false;
        }
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        // Otomatis aktifkan kembali jika listener terdaftar
        if (sensorManager != null && !isListening && (accelerometer != null || linearAccelerometer != null)) {
            Sensor s = hasLinear ? linearAccelerometer : accelerometer;
            if (s != null) {
                sensorManager.registerListener(this, s, SensorManager.SENSOR_DELAY_GAME);
                isListening = true;
            }
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
            isListening = false;
        }
    }
}
