package com.redilah.financetracker.assistant;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;
import android.util.Log;

/**
 * Cassiel Quick Settings Tile Service
 * Menambahkan tombol "Cassiel Assist" di Quick Settings / Control Center tirai notifikasi Android.
 * Memungkinkan user memunculkan pop-up pencatatan asisten finansial dengan 1x tap dari mana saja
 * tanpa perlu menekan tombol power fisik.
 */
public class CassielTileService extends TileService {

    private static final String TAG = "CassielTileService";

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setState(Tile.STATE_INACTIVE);
            tile.setLabel("Cassiel Assist");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                tile.setSubtitle("Catat Cepat");
            }
            tile.updateTile();
        }
    }

    @Override
    public void onClick() {
        super.onClick();
        try {
            Intent intent = new Intent(this, CassielAssistActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    0,
                    intent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                );
                startActivityAndCollapse(pendingIntent);
            } else {
                startActivityAndCollapse(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch CassielAssistActivity from Quick Tile", e);
        }
    }
}
