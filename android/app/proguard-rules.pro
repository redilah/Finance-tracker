# Keep Capacitor core, bridge, and plugin classes
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
    public *;
}
-keep class * extends com.getcapacitor.PluginMethod { *; }

# Keep Speech Recognition Community Plugin
-keep class com.getcapacitor.community.speechrecognition.** { *; }
-keepclassmembers class com.getcapacitor.community.speechrecognition.** { *; }

# Keep Local Notifications Plugin
-keep class com.capacitorjs.plugins.localnotifications.** { *; }
-keepclassmembers class com.capacitorjs.plugins.localnotifications.** { *; }

# Keep App Plugin
-keep class com.capacitorjs.plugins.app.** { *; }
-keepclassmembers class com.capacitorjs.plugins.app.** { *; }

# Keep AppWidget Providers and Widget Bridge Plugin
-keep class com.redilah.financetracker.widget.** { *; }
-keepclassmembers class com.redilah.financetracker.widget.** { *; }

# Keep Notification Tracker Plugin and Listener Service
-keep class com.redilah.financetracker.NotificationTrackerPlugin { *; }
-keepclassmembers class com.redilah.financetracker.NotificationTrackerPlugin { *; }
-keep class com.redilah.financetracker.AutoExpenseListenerService { *; }
-keepclassmembers class com.redilah.financetracker.AutoExpenseListenerService { *; }

# Keep Kotlin stdlib & Coroutines
-keep class kotlin.** { *; }
-keep interface kotlin.** { *; }
-keep class kotlinx.coroutines.** { *; }
-keep interface kotlinx.coroutines.** { *; }
-keep class kotlin.coroutines.** { *; }
-keep interface kotlin.coroutines.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**
