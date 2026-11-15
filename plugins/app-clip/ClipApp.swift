import SwiftUI

/// Entry point for the flight simulator App Clip
/// (com.beatrackfaminc.horizonfs.HorizonFS).
///
/// The clip is a deliberately tiny, dependency-free SwiftUI app — it does NOT
/// embed React Native. A React Native clip cannot fit Apple's 15 MB App Clip
/// limit (Motivation's RN clip was 40 MB and got ITMS-90865, Nov 10 2026).
/// This version shows one featured flight and hands the user off to the
/// full app (App Store overlay / deep link), nothing more.
///
/// The clip is generated into ios/HorizonFSMobileFlightSimulatorClip by the
/// `plugins/with-app-clip` config plugin on every `expo prebuild`; edit the
/// templates under `plugins/app-clip/`, never the generated copy.
@main
struct HorizonFSMobileFlightSimulatorClipApp: App {
  @State private var invocationURL: URL?

  var body: some Scene {
    WindowGroup {
      ContentView(invocationURL: invocationURL)
        // App Clip invocation: the URL from the App Clip Code / NFC tag /
        // link that launched the clip (configured as an App Clip experience
        // in App Store Connect).
        .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
          if let url = activity.webpageURL {
            invocationURL = url
          }
        }
        .onOpenURL { url in
          invocationURL = url
        }
    }
  }
}
