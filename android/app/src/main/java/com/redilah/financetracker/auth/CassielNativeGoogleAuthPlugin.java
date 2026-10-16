package com.redilah.financetracker.auth;

import android.content.Intent;
import android.util.Log;
import androidx.activity.result.ActivityResult;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;

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
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

@CapacitorPlugin(name = "CassielNativeGoogleAuth")
public class CassielNativeGoogleAuthPlugin extends Plugin {

    private static final String TAG = "CassielGoogleAuth";
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
        if (serverClientId == null || serverClientId.trim().isEmpty()) {
            serverClientId = DEFAULT_SERVER_CLIENT_ID;
        }
        final String finalServerClientId = serverClientId.trim();

        // Coba gunakan Android Credential Manager (Modern Bottom Sheet Google One Tap seperti Grammarly)
        try {
            CredentialManager credentialManager = CredentialManager.create(getActivity());

            GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(finalServerClientId)
                    .setAutoSelectEnabled(true)
                    .build();

            GetCredentialRequest request = new GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build();

            credentialManager.getCredentialAsync(
                    getActivity(),
                    request,
                    null,
                    ContextCompat.getMainExecutor(getActivity()),
                    new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                        @Override
                        public void onResult(@NonNull GetCredentialResponse response) {
                            try {
                                Credential credential = response.getCredential();
                                if (credential instanceof CustomCredential &&
                                        credential.getType().equals(GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL)) {
                                    GoogleIdTokenCredential googleIdTokenCredential =
                                            GoogleIdTokenCredential.createFrom(credential.getData());

                                    JSObject ret = new JSObject();
                                    ret.put("idToken", googleIdTokenCredential.getIdToken());
                                    ret.put("email", googleIdTokenCredential.getId());
                                    ret.put("displayName", googleIdTokenCredential.getDisplayName());
                                    ret.put("photoUrl", googleIdTokenCredential.getProfilePictureUri() != null
                                            ? googleIdTokenCredential.getProfilePictureUri().toString() : "");
                                    ret.put("id", googleIdTokenCredential.getId());
                                    ret.put("familyName", googleIdTokenCredential.getFamilyName());
                                    ret.put("givenName", googleIdTokenCredential.getGivenName());
                                    call.resolve(ret);
                                } else {
                                    Log.w(TAG, "Tipe kredensial tidak sesuai: " + credential.getType() + ", fallback ke legacy...");
                                    fallbackToLegacyGoogleSignIn(call, finalServerClientId);
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "Error memproses kredensial Google: " + e.getMessage(), e);
                                fallbackToLegacyGoogleSignIn(call, finalServerClientId);
                            }
                        }

                        @Override
                        public void onError(@NonNull GetCredentialException e) {
                            Log.w(TAG, "CredentialManager error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
                            if (e instanceof GetCredentialCancellationException) {
                                call.reject("Proses masuk dengan Google dibatalkan.", "CANCELLED");
                            } else {
                                // Fallback ke legacy GoogleSignInClient untuk perangkat yang belum mendukung penuh Credential Manager
                                fallbackToLegacyGoogleSignIn(call, finalServerClientId);
                            }
                        }
                    }
            );
        } catch (Exception e) {
            Log.e(TAG, "CredentialManager gagal diinisialisasi, fallback ke legacy: " + e.getMessage(), e);
            fallbackToLegacyGoogleSignIn(call, finalServerClientId);
        }
    }

    private void fallbackToLegacyGoogleSignIn(PluginCall call, String serverClientId) {
        if (getActivity() == null) {
            call.reject("Activity context is null");
            return;
        }

        try {
            this.googleSignInClient = getClient(serverClientId);
            // Sign out previous silent session so user gets account chooser
            this.googleSignInClient.signOut().addOnCompleteListener(getActivity(), task -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(call, signInIntent, "handleGoogleSignInResult");
            });
        } catch (Exception e) {
            call.reject("Gagal memulai Google Sign-In: " + e.getMessage());
        }
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

        try {
            CredentialManager credentialManager = CredentialManager.create(getActivity());
            credentialManager.clearCredentialStateAsync(
                    new ClearCredentialStateRequest(),
                    null,
                    ContextCompat.getMainExecutor(getActivity()),
                    new CredentialManagerCallback<Void, ClearCredentialException>() {
                        @Override
                        public void onResult(Void result) {
                            signOutLegacy(call);
                        }

                        @Override
                        public void onError(@NonNull ClearCredentialException e) {
                            signOutLegacy(call);
                        }
                    }
            );
        } catch (Exception e) {
            signOutLegacy(call);
        }
    }

    private void signOutLegacy(PluginCall call) {
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
