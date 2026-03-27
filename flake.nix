{
  description = "P8 Mobility - React Native/Expo Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Node.js LTS version compatible with React Native
        nodejs = pkgs.nodejs_20;
        
        # Android SDK and tools (optional, for android development)
        androidComposition = pkgs.androidenv.composeAndroidPackages {
          cmdLineToolsVersion = "8.0";
          toolsVersion = "26.1.1";
          platformToolsVersion = "34.0.1";
          buildToolsVersions = [ "33.0.0" "34.0.0" ];
          includeEmulator = true;
          emulatorVersion = "33.1.4";
          platformVersions = [ "28" "29" "30" "31" "32" "33" "34" ];
          includeSources = false;
          includeSystemImages = true;
          systemImageTypes = [ "google_apis_playstore" ];
          abiVersions = [ "armeabi-v7a" "arm64-v8a" "x86" "x86_64" ];
          cmakeVersions = [ "3.10.2" ];
          includeNDK = true;
          ndkVersions = ["25.1.8937393"];
        };

        # iOS development tools (macOS only)
        iosTools = pkgs.lib.optionals pkgs.stdenv.isDarwin [
          pkgs.cocoapods
          pkgs.ruby
        ];

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core development tools
            nodejs
            nodePackages.npm
            nodePackages.yarn
            
            # TypeScript support
            nodePackages.typescript
            
            # E2E Testing
            maestro
            
            # Git for version control
            git
            
            # Watchman for file watching (recommended for React Native)
            watchman
            
            # Development utilities
            curl
            wget
            jq
            
            # Platform-specific tools
          ] ++ iosTools ++ pkgs.lib.optionals (!pkgs.stdenv.isDarwin) [
            # Android development (Linux/others)
            androidComposition.androidsdk
          ];

          # Environment variables
          shellHook = ''
            export EXPO_NO_TELEMETRY=1
            export DISABLE_OPENCOLLECTIVE=1
            export NPM_CONFIG_UPDATE_NOTIFIER=false
            
            # Android development setup (non-macOS)
            ${pkgs.lib.optionalString (!pkgs.stdenv.isDarwin) ''
              export ANDROID_SDK_ROOT="${androidComposition.androidsdk}/libexec/android-sdk"
              export ANDROID_HOME="$ANDROID_SDK_ROOT"
              export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"
            ''}
            
            # iOS development setup (macOS only)
            ${pkgs.lib.optionalString pkgs.stdenv.isDarwin ''
              # Ensure Xcode command line tools are available
              export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
              
              # Prioritize Xcode's toolchain over Nix's for iOS builds
              export PATH="/Applications/Xcode.app/Contents/Developer/usr/bin:/usr/bin:$PATH"
              
              # Disable Nix's clang wrappers for iOS builds using active Xcode toolchain
              if command -v xcrun >/dev/null 2>&1; then
                export CC="$(xcrun -f clang 2>/dev/null || true)"
                export CXX="$(xcrun -f clang++ 2>/dev/null || true)"
              fi
              
              # Verify Xcode is properly configured
              if ! command -v xcodebuild >/dev/null 2>&1; then
                echo "⚠️  Xcode command line tools not found. Please install Xcode and run:"
                echo "    sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
              fi
              
              # Verify CocoaPods is available
              if ! command -v pod >/dev/null 2>&1; then
                echo "⚠️  CocoaPods not found in PATH"
              fi
            ''}
            
            echo "🚀 P8 Mobility Development Environment"
            echo "📱 Expo SDK 54 | React Native 0.81.5"
            echo ""
            echo "Available commands:"
            echo "  npm start          - Start Expo development server"
            echo "  npm run android    - Run on Android"
            echo "  npm run ios        - Run on iOS (macOS only)"
            echo "  npm run web        - Run on web"
            echo "  npm test           - Run tests"
            echo "  npm run lint       - Run ESLint"
            echo "  npm run test:e2e   - Run E2E tests with Maestro"
            echo "  npx expo --help    - Expo CLI commands"
            echo ""
            echo "📦 Tools provided by npm packages (install with 'npm install'):"
            echo "  • Expo CLI (@expo/cli)"
            echo "  • ESLint, Prettier, Jest"
            echo ""
            echo "🧪 E2E Testing:"
            which maestro >/dev/null && echo "  ✅ Maestro CLI: $(maestro --version 2>/dev/null || echo 'available')" || echo "  ❌ Maestro CLI not found"
            echo ""
            
            # Check if node_modules exists, if not suggest installing
            if [ ! -d "node_modules" ]; then
              echo "📦 Run 'npm install' to install dependencies"
              echo ""
            fi
          '';

          # Additional environment variables for development
          LANG = "en_US.UTF-8";
          LC_ALL = "en_US.UTF-8";
          
          # Node.js heap size for large projects
          NODE_OPTIONS = "--max-old-space-size=8192";
        };

        # Development shell with Android emulator support
        devShells.android = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            nodePackages.npm
            watchman
            # E2E Testing
            maestro
            androidComposition.androidsdk
            jdk11
          ];

          shellHook = ''
            export ANDROID_SDK_ROOT="${androidComposition.androidsdk}/libexec/android-sdk"
            export ANDROID_HOME="$ANDROID_SDK_ROOT"
            export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"
            export JAVA_HOME="${pkgs.jdk11}"
            
            echo "🤖 Android Development Environment Ready"
            echo "Run 'emulator -list-avds' to see available emulators"
          '';
        };

        # Development shell with iOS optimization (macOS)
        devShells.ios = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core tools only - let Xcode provide the rest
            nodejs
            nodePackages.npm
            nodePackages.yarn
            git
            watchman
            # E2E Testing
            maestro
            # CocoaPods for iOS dependency management
            cocoapods
            ruby
          ];

          shellHook = ''
            export EXPO_NO_TELEMETRY=1
            export DISABLE_OPENCOLLECTIVE=1
            export NPM_CONFIG_UPDATE_NOTIFIER=false
            
            # Prioritize Xcode toolchain completely
            export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
            export PATH="/Applications/Xcode.app/Contents/Developer/usr/bin:/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin:/usr/bin:/bin:$PATH"
            
            # Force use of Xcode's clang
            unset CC
            unset CXX
            unset LD
            
            echo "🍎 iOS Development Environment"
            echo "📱 Optimized for Xcode builds"
            echo ""
            echo "Toolchain verification:"
            which clang 2>/dev/null && echo "✅ Using: $(which clang)" || echo "❌ clang not found"
            which xcodebuild 2>/dev/null && echo "✅ Xcode: $(xcodebuild -version | head -1)" || echo "❌ Xcode not found"
            which pod 2>/dev/null && echo "✅ CocoaPods: v$(pod --version)" || echo "❌ CocoaPods not found"
            which maestro 2>/dev/null && echo "✅ Maestro: $(maestro --version 2>/dev/null || echo 'available')" || echo "❌ Maestro not found"
            echo ""
          '';
        };

        # Lightweight development shell without mobile development tools
        devShells.web = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            nodePackages.npm
            nodePackages.typescript
            # E2E Testing
            maestro
            git
          ];

          shellHook = ''
            export EXPO_NO_TELEMETRY=1
            echo "🌐 Web Development Environment"
            echo "Run 'npm run web' to start web development"
            echo "Use 'npx expo --help' for Expo CLI commands"
            echo "Run 'npm run test:e2e' for E2E testing with Maestro"
            echo "📦 Install npm packages with 'npm install' for full tooling"
          '';
        };
      });
}