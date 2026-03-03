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

### CI checks

Run all checks used in CI (type checking, linting, formatting):

```cmd
npm run ci:check
```

```cmd
npx expo prebuild --clean
npx expo run:android
```
