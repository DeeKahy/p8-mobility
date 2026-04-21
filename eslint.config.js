const nativeConfig = require("eslint-config-universe/flat/native");

module.exports = [
  ...nativeConfig,
  {
    rules: {
      "linebreak-style": ["error", "unix"],
      // Treat all warnings as errors so the Actions Script never passes if there are any warnings
      // Add project-specific rule overrides that we decide on monday here. TODO:
    },
  },
  {
    ignores: ["node_modules/", ".expo/", "dist/", "build/", "web/"],
  },
];
