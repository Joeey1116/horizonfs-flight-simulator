# HorizonFS: Mobile Flight Simulator

A mobile flight simulator for iOS and Android, built with Expo + React Native.
Free with a Pro upgrade. v1 scaffold — the core is here and flyable; the
polish, store products, and portal setup come next.

> **Identity — FINAL (Joey, Nov 15, 2026):** "HorizonFS: Mobile Flight
> Simulator" (HorizonFS one word, colon format like the other apps).
> - app.json `name`: **"HorizonFS: Mobile Flight Simulator"**
> - bundle ID / package: **`com.beatrackfaminc.horizonfs`**
> - clip: **`com.beatrackfaminc.horizonfs.HorizonFS`** ("HorizonFS App Clip")
> - scheme: `horizonfs`, slug: `horizonfs-flight-simulator`
> - EAS projectId is all zeros until the EAS project is linked (`eas init`)
> - Xcode product name (Expo sanitizes the title): `HorizonFSMobileFlightSimulator`
>
> The local folder is still `~/workspace/flight-sim-app`; the GitHub repo
> should be named for HorizonFS when it is created.

## What is built (v1 scaffold)

- **Catalog** — `src/data/aircraft.json` (27 aircraft, real specs: Cessna 172,
  PA-28, SR22, Bonanza G36, TBM 930, King Air 350, ATR 72, Q400, E170, E190,
  CRJ900, A319, A320, A321neo, 737-700, 737-800, 737 MAX 8, 757-200, 767-300ER,
  777-200ER, 777-300ER, 787-9, A330-300, A350-900, 747-400, A380, Concorde;
  8 free, 19 Pro) and `src/data/airports.json` (140 real airports from
  OurAirports open data, 72 featured hubs, each with up to 2 longest open
  runways — ident, length, heading, surface). JFK verified: 13R 14,511 ft.
- **Flight engine** — `src/engine/flight.ts`: pure TypeScript, no deps.
  Thrust vs drag, lift ∝ speed², stall (flaps lower stall speed), takeoff
  at Vr + pitch, turn rate from bank, gear-up / hard landing = crash, gear
  warning on final, overspeed, steady wind. HUD: airspeed, altitude,
  heading, vertical speed, ground speed, phase.
- **3D scene** — `components/FlightScene.tsx` (@react-three/fiber + three.js):
  procedural day sky, terrain grid, runway with markings at the selected
  airport, 26 seeded clouds, low-poly aircraft built from primitives in
  the livery color, chase camera. Sim loop inside the Canvas; HUD pushed
  ~7 Hz.
- **Screens** (expo-router, NativeTabs like Snugbug/Rewards) — Home (quick
  flight C172 @ KJFK 13R, featured airports, free aircraft), Aircraft
  (search + category filters + free/Pro badges), Airports (search + major
  hubs toggle), Pro (store IAPs when they exist, placeholder plans until
  then), Flight (touch controls: virtual joystick, throttle slider, flaps,
  gear, brakes, pause; HUD; end-of-flight summary), aircraft/airport detail
  screens, Settings (Pro status, restore, flight log, export), Privacy
  policy.
- **Pro / IAP** — `src/lib/purchases.ts` mirrors Motivation's
  react-native-iap v17 event-based pattern. Product IDs are PLACEHOLDERS
  (`HORIZONFS_PRO_MONTHLY`, `HORIZONFS_PRO_YEARLY`, `HORIZONFS_PRO_LIFETIME`);
  Joey must create the real products in App Store Connect / Play Console.
  `src/lib/pro.ts` holds the local Pro flag (AsyncStorage) + last setup.
  The Pro tab has a clearly-labelled **testing-only Pro preview toggle** —
  remove it before release. Implementation note: the native hook lives in
  `src/lib/purchases-native.ts` (SKUs in `src/lib/iap-skus.ts`) because
  react-native-iap throws when evaluated on web — the web-safe wrapper in
  `purchases.ts` lazy-requires the native module only on iOS/Android, and
  returns a no-op on web. Do NOT "fix" this with a `.web.ts` shim (Metro
  does not reliably resolve those for Expo web).
- **Web preview** — `npm run web` renders all tabs + the 3D flight screen
  (verified in a Playwright iPhone emulation). One web-only quirk is
  handled in `components/Screen.tsx`: NativeTabs renders its bar at the
  top of the viewport on web, so content gets 72px top clearance there;
  native layout is untouched.
- **Flight log** — `src/lib/logbook.ts`: every completed flight saves a
  record on-device as plain JSON, shaped for import into the companion
  Flight Journal pilot-logbook app (date, aircraft, departure, minutes,
  landings, max altitude, distance, outcome). Settings shows the log + export.
- **App Clip** — `plugins/with-app-clip.js` + `plugins/app-clip/` (pure
  SwiftUI clip: today's flight card + Get the Full App overlay, no React
  Native — a RN clip cannot fit Apple's 15 MB limit). The App Store ID is
  a TBD placeholder; the ASC record does not exist yet.
- **CI** — `.github/workflows/` (ios-build, android-build, release) copied
  from the proven Snugbug workflows, including the auto-bump build-number
  script (`.github/scripts/bump-build-number.py`, +1 iOS + Android in sync)
  and `android-signing.py`. Manual trigger only; Joey runs them.

## Stack (same family versions as Snugbug/Hugbug)

expo ~57.0.26 · expo-router ~57.0.24 · react-native-screens ~4.26.0 ·
react 19.2.3 · react-native 0.86.3 · three ^0.187.0 · @react-three/fiber ^9 ·
expo-gl · react-native-iap ^17.0.1 · TypeScript ~6.0.3 (strict).

Privacy: **Expo built-in `expo.ios.privacyManifests`** in app.json (per Expo
docs) — NOT the custom with-privacy-manifest plugin. The app collects
nothing; the manifest declares UserDefaults (AsyncStorage) only.

## Run it

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run web         # Expo web preview
npm run ios         # needs a Mac + the App ID / profiles in the portal
npm run android
```

## Still missing before a first device build

1. **GitHub repo** — does not exist yet. Create the public repo, then push
   with a NEW per-repo deploy keypair (one key per repo, like the other
   five apps). Do NOT reuse another app's key.
2. **Real IAP products** — create `HORIZONFS_PRO_*` products in App Store
   Connect / Play Console (or rename the SKUs) and remove the testing-only
   Pro preview toggle from `app/(tabs)/pro.tsx`.
3. **App Clip portal setup** — clip App ID + "HorizonFS App Clip"
   profile, the App Store ID in `plugins/app-clip/ContentView.swift`, and
   adding the clip ID to the `appclips` section of the AASA file on
   beatrackfam.info.
4. **Store assets** — the generated icon/splash are generic placeholders
   (paper-plane glyph, no wordmark). App Store screenshots + page header
   still to be built (header must fit the middle 50% W × 30% H safe zone —
   the store zooms the 16:9 header ~1.7×).
5. **Device testing** — every tab/button on a real device before release
   (family rule). Landscape orientation is a v1.1 item: the app is portrait
   for v1, like the other apps.

## Design

Clean aviation feel, dark sky theme (`#050914` background, sky-blue
`#38BDF8` accents, gold `#FDE68A` for Pro). No music references anywhere.
