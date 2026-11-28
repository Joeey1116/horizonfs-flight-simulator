// Metro config — Expo defaults, plus a macOS-only resolver shim for the
// react-native-macos target (see macos/ and .github/workflows/macos-build.yml).
// Mirrors the Flight Journal pilot's metro.config.js.
//
// WHY THIS FILE EXISTS: until now the project had no metro.config.js and
// Expo used its built-in defaults. This file calls getDefaultConfig(),
// which IS those defaults (SDK 57's default resolver platforms already
// include 'macos', so .macos.ts/.macos.tsx variants resolve with no
// further config). The only addition is a resolveRequest wrapper that
// activates EXCLUSIVELY for platform === 'macos' bundles:
//
//   - 'react-native' (and its subpaths) resolve to 'react-native-macos',
//     the standard react-native-macos metro mapping. react-native-macos
//     is a fork of RN 0.83 while the app runs RN 0.86 on ios/android —
//     see the version-mismatch note in the macOS workflow header.
//   - 'react-native-iap' resolves to a local inert stub: StoreKit IAP
//     has no react-native-macos build. src/lib/purchases.ts already
//     treats a disconnected store as its normal "unavailable" path, so
//     the Pro screen on Mac behaves like the phone app before store
//     products exist — Pro is never granted through the stub.
//
// The 3D flight view needs no stub entry here: components/
// FlightScene.macos.tsx replaces the expo-gl / react-three-fiber scene
// with a placeholder for the macos platform, so expo-gl, three and
// @react-three/fiber never enter the Mac bundle's module graph at all.
//
// iOS / Android / web bundles pass through to Expo's resolver untouched.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const MACOS_MODULE_STUBS = {
  'react-native-iap': path.resolve(__dirname, 'src/macos-stubs/react-native-iap.ts'),
};

const upstreamResolveRequest =
  typeof config.resolver.resolveRequest === 'function'
    ? config.resolver.resolveRequest
    : null;

const resolveDefault = (context, moduleName, platform) =>
  upstreamResolveRequest
    ? upstreamResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);

const RNSCREENS_MACOS_STUB = path.resolve(
  __dirname,
  'src/macos-stubs/rnscreens-tabs.tsx',
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'macos') {
    if (moduleName === 'react-native') {
      return context.resolveRequest(context, 'react-native-macos', platform);
    }
    if (moduleName.startsWith('react-native/')) {
      return context.resolveRequest(
        context,
        `react-native-macos/${moduleName.slice('react-native/'.length)}`,
        platform,
      );
    }
    if (Object.prototype.hasOwnProperty.call(MACOS_MODULE_STUBS, moduleName)) {
      return { type: 'sourceFile', filePath: MACOS_MODULE_STUBS[moduleName] };
    }
    try {
      return resolveDefault(context, moduleName, platform);
    } catch (e) {
      // react-native-screens ships a tail of native components
      // (native-tabs host/screen, the experimental "gamma" stack
      // header, …) for ios/android/web only — no .macos or .native
      // file exists, so resolution can NEVER succeed for them on
      // macOS. They are all native view components the macOS build
      // never renders (the macOS layout is a sidebar + <Slot />), so
      // an inert component stub is the correct resolution.
      if (context.originModulePath.includes('react-native-screens/')) {
        return { type: 'sourceFile', filePath: RNSCREENS_MACOS_STUB };
      }
      throw e;
    }
  }
  return resolveDefault(context, moduleName, platform);
};

module.exports = config;
