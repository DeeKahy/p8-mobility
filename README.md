# p8-mobility

### Prerequisites

Please have Node installed

### Before starting. (One time on each System)

```cmd
npm install
```

### For starting app

```cmd
npm start
```

Run on specific platforms:

```cmd
npm run android
npm run ios
npm run web
```

### Check for lint issues:

```cmd
npm run lint
```

Automatically fix lint issues where possible:

```cmd
npm run lint:fix
```

### For formatting

Format all files using Prettier:

```cmd
npm run format
```

Check formatting without modifying files:

```cmd
npm run format:check
```

### Type checking

Run TypeScript type checks without emitting build files:

```cmd
npm run type-check
```

### Running Tests
```cmd
npm run test
```

### CI checks

Run all checks used in CI (type checking, linting, formatting):

```cmd
npm run ci:check
```

```cmd
npx expo prebuild --clean
npx expo run:android
```

## For test run.

### Prerequisites

Please install :  https://maestro.dev/

Sign up to it, using either google or github.

### For nunning test
Connect phone

```cmd
npm install
npm start 
```
Start on either android or ios, and navigate the app to main page.

Then navigate in the maestro application to the folder of the test: C:\p8-mobility\.maestro

There should then be play icon, on the files.

Smoke-test.yaml runs all the test files, for better debbuging on what fails, run the individual file that fails.


## Alternative use and install: Using Nix (Recommended)

This project includes a Nix flake for reproducible development environments. If you have Nix installed, you can use it instead of manually installing Node.js and other dependencies.

### Setup with Nix

1. **Install Nix** (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
   ```

2. **Enable flakes** (if not enabled):
   ```bash
   echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
   ```

3. **Enter the development environment**:
   ```bash
   nix develop
   ```
   
   Or for automatic activation, install direnv:
   ```bash
   # Install direnv
   nix profile install nixpkgs#direnv
   
   # Allow the .envrc file
   direnv allow
   ```

### Available Nix Development Shells

- **Default shell** (`nix develop`): Full development environment with web, iOS, and Android support
- **Android-focused** (`nix develop .#android`): Optimized for Android development with emulator support
- **Web-only** (`nix develop .#web`): Lightweight environment for web development only

### Benefits of Using Nix

- ✅ Reproducible development environment across all machines
- ✅ Automatic installation of all required tools (Node.js, Expo, TypeScript, etc.)
- ✅ Android SDK and emulator setup (Linux/macOS)
- ✅ iOS development tools (macOS only)
- ✅ No version conflicts or "works on my machine" issues