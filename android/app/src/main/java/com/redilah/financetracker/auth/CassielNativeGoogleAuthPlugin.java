package com.redilah.financetracker.auth;

import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "CassielNativeGoogleAuth")
public class CassielNativeGoogleAuthPlugin extends Plugin {

    private static final String DEFAULT_SERVER_CLIENT_ID = "799596292912-lglcj9rg074qkao5r0ftd22d2lc7a1ai.apps.googleusercontent.com";
    private GoogleSignInClient googleSignInClient;

    private GoogleSignInClient getClient(String serverClientId) {
        String clientId = (serverClientId != null && !serverClientId.trim().isEmpty())
                ? serverClientId.trim()
                : DEFAULT_SERVER_CLIENT_ID;

        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(clientId)
                .requestEmail()
                .requestProfile()
                .build();

        return GoogleSignIn.getClient(getActivity(), gso);
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Activity context is null");
            return;
        }

        String serverClientId = call.getString("serverClientId", DEFAULT_SERVER_CLIENT_ID);
        this.googleSignInClient = getClient(serverClientId);

        // Sign out previous silent session so user always gets the native account chooser
        this.googleSignInClient.signOut().addOnCompleteListener(getActivity(), task -> {
            Intent signInIntent = googleSignInClient.getSignInIntent();
            startActivityForResult(call, signInIntent, "handleGoogleSignInResult");
        });
    }

    @ActivityCallback
    private void handleGoogleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        try {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
            GoogleSignInAccount account = task.getResult(ApiException.class);

            if (account != null) {
                JSObject ret = new JSObject();
                ret.put("idToken", account.getIdToken());
                ret.put("email", account.getEmail());
                ret.put("displayName", account.getDisplayName());
                ret.put("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : "");
                ret.put("id", account.getId());
                ret.put("serverAuthCode", account.getServerAuthCode());
                call.resolve(ret);
            } else {
                call.reject("Gagal memperoleh kredensial akun Google.");
            }
        } catch (ApiException e) {
            int statusCode = e.getStatusCode();
            // 12501 = SIGN_IN_CANCELLED, 16 = CANCELLED
            if (statusCode == 12501 || statusCode == 16) {
                call.reject("Proses masuk dengan Google dibatalkan.", "CANCELLED");
            } else {
                call.reject("Gagal masuk dengan Google (Kode status: " + statusCode + "). Pastikan koneksi dan layanan Google Play aktif.", String.valueOf(statusCode));
            }
        } catch (Exception e) {
            call.reject("Terjadi kesalahan saat masuk dengan Google: " + e.getMessage());
        }
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        if (getActivity() == null) {
            call.resolve();
            return;
        }
        if (googleSignInClient == null) {
            googleSignInClient = getClient(DEFAULT_SERVER_CLIENT_ID);
        }
        googleSignInClient.signOut().addOnCompleteListener(getActivity(), task -> {
            call.resolve();
        });
    }
}
