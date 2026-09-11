package com.redilah.financetracker.billing;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "CassielNativeBilling")
public class CassielNativeBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "CassielNativeBilling";

    // Known subscription product IDs
    private static final List<String> KNOWN_SUBSCRIPTIONS = Arrays.asList(
            "justice_cassiel_monthly",
            "justice_cassiel_six_months",
            "justice_cassiel_yearly",
            "cassiel_pro_monthly",
            "cassiel_pro_six_months",
            "cassiel_pro_yearly"
    );

    private BillingClient billingClient;
    private final Map<String, ProductDetails> cachedProductDetails = new HashMap<>();
    private PluginCall activePurchaseCall;

    @Override
    public void load() {
        super.load();
        initBillingClient();
    }

    private synchronized void initBillingClient() {
        if (billingClient != null) {
            return;
        }

        try {
            PendingPurchasesParams pendingPurchasesParams = PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .build();

            billingClient = BillingClient.newBuilder(getContext())
                    .setListener(this)
                    .enablePendingPurchases(pendingPurchasesParams)
                    .build();

            connectBillingClient(null);
        } catch (Exception e) {
            Log.e(TAG, "Error creating BillingClient: " + e.getMessage(), e);
        }
    }

    private void connectBillingClient(Runnable onReady) {
        if (billingClient == null) {
            return;
        }

        if (billingClient.isReady()) {
            if (onReady != null) {
                onReady.run();
            }
            return;
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "BillingClient connected successfully.");
                    preloadProductDetails();
                    if (onReady != null) {
                        onReady.run();
                    }
                } else {
                    Log.w(TAG, "BillingClient setup failed: " + billingResult.getDebugMessage() + " (Code: " + billingResult.getResponseCode() + ")");
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "BillingClient disconnected. Will reconnect on next request.");
            }
        });
    }

    private void preloadProductDetails() {
        if (billingClient == null || !billingClient.isReady()) {
            return;
        }

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        for (String id : KNOWN_SUBSCRIPTIONS) {
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(id)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
            );
        }

        QueryProductDetailsParams queryParams = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(queryParams, (billingResult, list) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                cachedProductDetails.clear();
                for (ProductDetails details : list) {
                    cachedProductDetails.put(details.getProductId(), details);
                }
                Log.d(TAG, "Preloaded " + cachedProductDetails.size() + " subscription products.");
            } else {
                Log.w(TAG, "Failed to preload products: " + billingResult.getDebugMessage());
            }
        });
    }

    @PluginMethod
    public void querySubscriptionProducts(PluginCall call) {
        ensureConnected(call, () -> {
            List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
            for (String id : KNOWN_SUBSCRIPTIONS) {
                productList.add(
                        QueryProductDetailsParams.Product.newBuilder()
                                .setProductId(id)
                                .setProductType(BillingClient.ProductType.SUBS)
                                .build()
                );
            }

            QueryProductDetailsParams queryParams = QueryProductDetailsParams.newBuilder()
                    .setProductList(productList)
                    .build();

            billingClient.queryProductDetailsAsync(queryParams, (billingResult, list) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    JSArray productsArray = new JSArray();
                    cachedProductDetails.clear();

                    for (ProductDetails details : list) {
                        cachedProductDetails.put(details.getProductId(), details);

                        JSObject obj = new JSObject();
                        obj.put("productId", details.getProductId());
                        obj.put("title", details.getTitle());
                        obj.put("name", details.getName());
                        obj.put("description", details.getDescription());

                        List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                        if (offers != null && !offers.isEmpty()) {
                            ProductDetails.SubscriptionOfferDetails defaultOffer = offers.get(0);
                            obj.put("offerToken", defaultOffer.getOfferToken());
                            List<ProductDetails.PricingPhase> phases = defaultOffer.getPricingPhases().getPricingPhaseList();
                            if (phases != null && !phases.isEmpty()) {
                                ProductDetails.PricingPhase phase = phases.get(0);
                                obj.put("formattedPrice", phase.getFormattedPrice());
                                obj.put("priceAmountMicros", phase.getPriceAmountMicros());
                                obj.put("priceCurrencyCode", phase.getPriceCurrencyCode());
                                obj.put("billingPeriod", phase.getBillingPeriod());
                            }
                        }
                        productsArray.put(obj);
                    }

                    JSObject ret = new JSObject();
                    ret.put("products", productsArray);
                    call.resolve(ret);
                } else {
                    call.reject("Google Play error querying products: " + billingResult.getDebugMessage(), String.valueOf(billingResult.getResponseCode()));
                }
            });
        });
    }

    @PluginMethod
    public void checkActivePurchases(PluginCall call) {
        ensureConnected(call, () -> {
            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build();

            billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    boolean isPro = false;
                    JSArray activePurchases = new JSArray();

                    for (Purchase p : purchases) {
                        if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            isPro = true;
                            JSObject pObj = new JSObject();
                            pObj.put("orderId", p.getOrderId());
                            pObj.put("purchaseToken", p.getPurchaseToken());
                            pObj.put("purchaseTime", p.getPurchaseTime());
                            pObj.put("isAcknowledged", p.isAcknowledged());
                            pObj.put("products", new JSArray(p.getProducts()));
                            activePurchases.put(pObj);

                            // Auto acknowledge if needed
                            if (!p.isAcknowledged()) {
                                acknowledgePurchase(p.getPurchaseToken());
                            }
                        }
                    }

                    JSObject ret = new JSObject();
                    ret.put("isPro", isPro);
                    ret.put("purchases", activePurchases);
                    call.resolve(ret);
                } else {
                    call.reject("Google Play error checking purchases: " + billingResult.getDebugMessage(), String.valueOf(billingResult.getResponseCode()));
                }
            });
        });
    }

    @PluginMethod
    public void launchPurchaseFlow(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null || productId.trim().isEmpty()) {
            call.reject("Product ID is required");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available to launch billing flow");
            return;
        }

        ensureConnected(call, () -> {
            ProductDetails details = cachedProductDetails.get(productId);
            if (details == null) {
                // Try query specific product
                List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
                productList.add(
                        QueryProductDetailsParams.Product.newBuilder()
                                .setProductId(productId)
                                .setProductType(BillingClient.ProductType.SUBS)
                                .build()
                );

                QueryProductDetailsParams queryParams = QueryProductDetailsParams.newBuilder()
                        .setProductList(productList)
                        .build();

                billingClient.queryProductDetailsAsync(queryParams, (billingResult, list) -> {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && !list.isEmpty()) {
                        ProductDetails foundDetails = list.get(0);
                        cachedProductDetails.put(productId, foundDetails);
                        startBillingFlow(activity, foundDetails, call);
                    } else {
                        call.reject("Produk langganan (" + productId + ") belum aktif atau tidak ditemukan di Google Play Store.", String.valueOf(billingResult.getResponseCode()));
                    }
                });
            } else {
                startBillingFlow(activity, details, call);
            }
        });
    }

    private void startBillingFlow(Activity activity, ProductDetails details, PluginCall call) {
        List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) {
            call.reject("Tidak ada penawaran aktif untuk paket " + details.getProductId());
            return;
        }

        String offerToken = offers.get(0).getOfferToken();
        List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
        productDetailsParamsList.add(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(details)
                        .setOfferToken(offerToken)
                        .build()
        );

        BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

        this.activePurchaseCall = call;

        BillingResult result = billingClient.launchBillingFlow(activity, billingFlowParams);
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            this.activePurchaseCall = null;
            call.reject("Gagal membuka Google Play: " + result.getDebugMessage(), String.valueOf(result.getResponseCode()));
        }
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
        PluginCall call = this.activePurchaseCall;

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase p : purchases) {
                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    if (!p.isAcknowledged()) {
                        acknowledgePurchase(p.getPurchaseToken());
                    }

                    if (call != null) {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        JSObject pObj = new JSObject();
                        pObj.put("orderId", p.getOrderId());
                        pObj.put("purchaseToken", p.getPurchaseToken());
                        pObj.put("purchaseTime", p.getPurchaseTime());
                        pObj.put("products", new JSArray(p.getProducts()));
                        ret.put("purchase", pObj);
                        this.activePurchaseCall = null;
                        call.resolve(ret);
                        return;
                    }
                }
            }

            if (call != null) {
                this.activePurchaseCall = null;
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            if (call != null) {
                this.activePurchaseCall = null;
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("userCancelled", true);
                call.resolve(ret);
            }
        } else {
            if (call != null) {
                this.activePurchaseCall = null;
                call.reject("Transaksi Google Play gagal: " + billingResult.getDebugMessage(), String.valueOf(billingResult.getResponseCode()));
            }
        }
    }

    private void acknowledgePurchase(String purchaseToken) {
        if (billingClient == null || !billingClient.isReady()) {
            return;
        }

        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchaseToken)
                .build();

        billingClient.acknowledgePurchase(params, billingResult -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                Log.d(TAG, "Purchase acknowledged successfully.");
            } else {
                Log.w(TAG, "Failed to acknowledge purchase: " + billingResult.getDebugMessage());
            }
        });
    }

    private void ensureConnected(PluginCall call, Runnable action) {
        if (billingClient == null) {
            initBillingClient();
        }

        if (billingClient != null && billingClient.isReady()) {
            action.run();
        } else {
            connectBillingClient(() -> {
                if (billingClient != null && billingClient.isReady()) {
                    action.run();
                } else if (call != null) {
                    call.reject("Gagal terhubung ke Google Play Store.");
                }
            });
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (billingClient != null && billingClient.isReady()) {
            billingClient.endConnection();
            billingClient = null;
        }
    }
}
