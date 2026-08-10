# Developer Guidelines for Cassiel (Finance Tracker)

## 1. Proactive Tool & Command Execution
* **Rule**: Never instruct or delegate tasks to the user if you have the tools and capabilities to perform them yourself. 
* **Action**: If you see a compilation error, configuration issue, or resource problem, proactively write scripts, fix code, or run terminal commands to resolve it directly. Present the results/resolutions to the user instead of listing instructions for them to run.

## 2. Android Release APK Build & Publishing Runbook
Follow these steps to prepare a new release or update:

### A. Pre-Build Validations
1. **Icon and Resource Formats**: AAPT is strict. Ensure no JPEGs are renamed to `.png` (check file magic bytes if needed). Status/notification icons must be in `drawable-*` directories, not `mipmap-*`.
2. **Version Code Increment**: For every update, increment the `versionCode` (integer) and update the `versionName` string inside `android/app/build.gradle`.

### B. Build and Automatic Signing
1. **Keystore Configuration**: Ensure `signingConfigs.release` is configured in `android/app/build.gradle` and references `release.keystore`.
2. **Build Command**: Navigate to the `android/` directory and run `./gradlew assembleRelease`.
3. **Verify Signature**: Run `apksigner verify --print-certs <apk-path>` to confirm it is signed with the release key (`CN=Redilah`) rather than the debug key.

### C. Store Asset Constraints
1. **Privacy Policy**: Keep `PRIVACY.md` updated to accurately disclose Firebase telemetry or online permissions to comply with store review policies.
2. **Feature Graphic**: Must be exactly `1024x500 px` JPEG or 24-bit PNG (no alpha).
3. **Screenshots**: Must be JPEG or 24-bit PNG (no alpha), minimum dimension of 320px, and the maximum dimension must not exceed 2x the minimum dimension (Ratio: `Max / Min <= 2`). Use a script to crop/resize if necessary.
