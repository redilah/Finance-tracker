import fs from 'fs';
import path from 'path';

// 1. Create pure Swift Package.swift for speech recognition plugin
const pluginDir = path.resolve('node_modules/@capacitor-community/speech-recognition');
const packageSwiftPath = path.join(pluginDir, 'Package.swift');

if (fs.existsSync(pluginDir)) {
  const packageSwiftContent = `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorCommunitySpeechRecognition",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorCommunitySpeechRecognition",
            targets: ["CapacitorCommunitySpeechRecognition"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.5.0")
    ],
    targets: [
        .target(
            name: "CapacitorCommunitySpeechRecognition",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm")
            ],
            path: "ios/Plugin",
            exclude: ["Plugin.m", "Plugin.h", "Info.plist"]
        )
    ]
);
`;

  fs.writeFileSync(packageSwiftPath, packageSwiftContent, 'utf8');
  console.log('Successfully created Package.swift for @capacitor-community/speech-recognition with pure Swift target');
}

// 2. Fix backslashes in CapApp-SPM/Package.swift
const appPackageSwift = path.resolve('ios/App/CapApp-SPM/Package.swift');
if (fs.existsSync(appPackageSwift)) {
  let content = fs.readFileSync(appPackageSwift, 'utf8');
  content = content.replace(/\\\\/g, '/').replace(/\\/g, '/');
  fs.writeFileSync(appPackageSwift, content, 'utf8');
  console.log('Successfully normalized paths in CapApp-SPM/Package.swift');
}
