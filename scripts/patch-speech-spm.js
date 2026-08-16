import fs from 'fs';
import path from 'path';

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
            targets: ["SpeechRecognitionPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")
    ],
    targets: [
        .target(
            name: "SpeechRecognitionPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm")
            ],
            path: "ios/Plugin"
        )
    ]
);
`;

  fs.writeFileSync(packageSwiftPath, packageSwiftContent, 'utf8');
  console.log('Successfully created Package.swift for @capacitor-community/speech-recognition');
}
