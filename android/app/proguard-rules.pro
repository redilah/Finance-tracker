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
