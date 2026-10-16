package com.redilah.financetracker.assistant;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ValueAnimator;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.WindowManager;
import android.view.animation.DecelerateInterpolator;
import android.widget.ImageView;

import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.redilah.financetracker.R;

/**
 * Cassiel Floating Bubble Service
 * Menampilkan logo CF murni (tanpa background box) melayang di atas aplikasi lain
 * via WindowManager (TYPE_APPLICATION_OVERLAY).
 *
 * Fitur:
 * - Pure CF logo tanpa background kaku
 * - Smooth touch & drag ke posisi mana saja
 * - Auto-snap halus ke tepi kiri atau kanan saat dilepas
 * - Auto-fade ke opacity 55% saat idle agar tidak mengganggu pandangan
 * - 1-tap meluncurkan CassielAssistActivity (bottom sheet catat cepat)
 */
public class CassielFloatingBubbleService extends Service {

    private static final String TAG = "CassielFloatingBubble";
    private static final String PREFS_NAME = "CassielFloatingBubblePrefs";
    private static final String KEY_POS_X = "bubble_x";
    private static final String KEY_POS_Y = "bubble_y";
    private static final float IDLE_ALPHA = 0.55f;
    private static final long IDLE_FADE_DELAY_MS = 3000L;

    public static volatile boolean isServiceRunning = false;

    private WindowManager windowManager;
    private View floatingView;
    private WindowManager.LayoutParams params;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable idleFadeRunnable;

    private int initialX;
    private int initialY;
    private float initialTouchX;
    private float initialTouchY;
    private boolean isDragging = false;
    private int touchSlop;

    @Override
    public void onCreate() {
        super.onCreate();
        isServiceRunning = true;
        touchSlop = ViewConfiguration.get(this).getScaledTouchSlop();

        if (!canDrawOverlays()) {
            Log.w(TAG, "SYSTEM_ALERT_WINDOW permission not granted. Stopping service.");
            stopSelf();
            return;
        }

        initFloatingBubble();
    }

    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(this);
        }
        return true;
    }

    private void initFloatingBubble() {
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        if (windowManager == null) {
            stopSelf();
            return;
        }

        LayoutInflater inflater = LayoutInflater.from(this);
        floatingView = inflater.inflate(R.layout.floating_bubble_layout, null);

        ImageView cfIcon = floatingView.findViewById(R.id.bubble_cf_icon);
        // Beri warna Warm Amber / Emas khas Cassiel pada lambang CF agar kontras tajam di atas tema terang maupun gelap
        if (cfIcon != null) {
            cfIcon.setColorFilter(Color.parseColor("#F59E0B"));
        }

        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;

        // Pulihkan posisi terakhir dari SharedPreferences
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        Point screenSize = getScreenDimensions();
        int savedX = prefs.getInt(KEY_POS_X, -1);
        int savedY = prefs.getInt(KEY_POS_Y, screenSize.y / 3);

        params.x = (savedX >= 0) ? savedX : (screenSize.x - dpToPx(58));
        params.y = Math.max(dpToPx(60), Math.min(savedY, screenSize.y - dpToPx(120)));

        setupTouchListener();

        try {
            windowManager.addView(floatingView, params);
            scheduleIdleFade();
        } catch (Exception e) {
            Log.e(TAG, "Gagal menambahkan view melayang ke WindowManager: " + e.getMessage(), e);
            stopSelf();
        }
    }

    private void setupTouchListener() {
        if (floatingView == null) return;

        floatingView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        cancelIdleFade();
                        v.setAlpha(1.0f);
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        isDragging = false;
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        float diffX = event.getRawX() - initialTouchX;
                        float diffY = event.getRawY() - initialTouchY;

                        if (!isDragging && Math.hypot(diffX, diffY) > touchSlop) {
                            isDragging = true;
                        }

                        if (isDragging) {
                            Point screenSize = getScreenDimensions();
                            int newX = initialX + (int) diffX;
                            int newY = initialY + (int) diffY;

                            // Batasi pergerakan vertikal agar tidak keluar layar
                            params.x = newX;
                            params.y = Math.max(dpToPx(40), Math.min(newY, screenSize.y - dpToPx(100)));

                            try {
                                windowManager.updateViewLayout(floatingView, params);
                            } catch (Exception ignored) {}
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                        if (!isDragging) {
                            // Klik terdeteksi: jalankan micro-scale animasi lalu buka CassielAssistActivity
                            v.animate().scaleX(0.82f).scaleY(0.82f).setDuration(70).withEndAction(() -> {
                                v.animate().scaleX(1.0f).scaleY(1.0f).setDuration(90).start();
                                openAssistantSheet();
                            }).start();
                        } else {
                            // Drag selesai: snap halus ke tepi terdekat
                            snapToNearestEdge();
                        }
                        return true;
                }
                return false;
            }
        });
    }

    private void openAssistantSheet() {
        try {
            Intent intent = new Intent(this, CassielAssistActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Gagal meluncurkan CassielAssistActivity dari floating bubble: " + e.getMessage(), e);
        }
    }

    private void snapToNearestEdge() {
        if (floatingView == null || windowManager == null) return;

        Point screenSize = getScreenDimensions();
        int viewWidth = floatingView.getWidth() > 0 ? floatingView.getWidth() : dpToPx(54);
        int middleX = screenSize.x / 2;
        int currentCenterX = params.x + (viewWidth / 2);

        int targetX = (currentCenterX < middleX) ? 0 : (screenSize.x - viewWidth);

        ValueAnimator animator = ValueAnimator.ofInt(params.x, targetX);
        animator.setDuration(220);
        animator.setInterpolator(new DecelerateInterpolator());
        animator.addUpdateListener(animation -> {
            params.x = (Integer) animation.getAnimatedValue();
            try {
                if (floatingView != null && floatingView.isAttachedToWindow()) {
                    windowManager.updateViewLayout(floatingView, params);
                }
            } catch (Exception ignored) {}
        });
        animator.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                saveBubblePosition(params.x, params.y);
                scheduleIdleFade();
            }
        });
        animator.start();
    }

    private void scheduleIdleFade() {
        cancelIdleFade();
        idleFadeRunnable = () -> {
            if (floatingView != null && floatingView.isAttachedToWindow()) {
                floatingView.animate()
                        .alpha(IDLE_ALPHA)
                        .setDuration(400)
                        .start();
            }
        };
        mainHandler.postDelayed(idleFadeRunnable, IDLE_FADE_DELAY_MS);
    }

    private void cancelIdleFade() {
        if (idleFadeRunnable != null) {
            mainHandler.removeCallbacks(idleFadeRunnable);
            idleFadeRunnable = null;
        }
    }

    private void saveBubblePosition(int x, int y) {
        SharedPreferences.Editor editor = getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit();
        editor.putInt(KEY_POS_X, x);
        editor.putInt(KEY_POS_Y, y);
        editor.apply();
    }

    private Point getScreenDimensions() {
        Point size = new Point();
        if (windowManager == null) return size;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            android.view.WindowMetrics metrics = windowManager.getCurrentWindowMetrics();
            android.graphics.Rect bounds = metrics.getBounds();
            size.x = bounds.width();
            size.y = bounds.height();
        } else {
            DisplayMetrics displayMetrics = new DisplayMetrics();
            windowManager.getDefaultDisplay().getMetrics(displayMetrics);
            size.x = displayMetrics.widthPixels;
            size.y = displayMetrics.heightPixels;
        }
        return size;
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!canDrawOverlays()) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (floatingView == null) {
            initFloatingBubble();
        } else {
            floatingView.setAlpha(1.0f);
            scheduleIdleFade();
        }
        return START_STICKY;
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (floatingView != null && floatingView.isAttachedToWindow()) {
            snapToNearestEdge();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isServiceRunning = false;
        cancelIdleFade();
        if (windowManager != null && floatingView != null) {
            try {
                if (floatingView.isAttachedToWindow()) {
                    windowManager.removeView(floatingView);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error removing floatingView: " + e.getMessage());
            }
        }
        floatingView = null;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
