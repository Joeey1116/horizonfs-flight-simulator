import StoreKit
import SwiftUI

// MARK: - App Store ID
// App Store Connect record for HorizonFS: Apple ID 6835243270
// (created Nov 15, 2026; build 1002 uploaded the same night).
private let appStoreID = "6835243270"

// MARK: - View

struct ContentView: View {
  /// The URL that launched this clip, if any (App Clip Code / link).
  let invocationURL: URL?

  @State private var showAppStoreOverlay = false

  var body: some View {
    ZStack {
      Color(red: 0.02, green: 0.04, blue: 0.08).ignoresSafeArea()
      ScrollView {
        VStack(spacing: 28) {
          header
          flightCard
          actionsSection
          footer
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 32)
      }
    }
    .preferredColorScheme(.dark)
    .appStoreOverlay(isPresented: $showAppStoreOverlay) {
      // Full HorizonFS app in the App Store.
      SKOverlay.AppConfiguration(appIdentifier: appStoreID, position: .bottom)
    }
  }

  // MARK: Sections

  private var header: some View {
    VStack(spacing: 8) {
      Text("APP CLIP")
        .font(.caption.weight(.bold))
        .tracking(2)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Color.white.opacity(0.15))
        .clipShape(Capsule())
      Text("✈️")
        .font(.system(size: 48))
      Text("HorizonFS")
        .font(.system(size: 30, weight: .black))
        .foregroundColor(.white)
        .multilineTextAlignment(.center)
      Text("Mobile Flight Simulator")
        .font(.headline)
        .foregroundColor(.white.opacity(0.75))
        .multilineTextAlignment(.center)
    }
  }

  private var flightCard: some View {
    VStack(spacing: 6) {
      Text("TODAY'S FLIGHT")
        .font(.caption.weight(.semibold))
        .tracking(1)
        .foregroundColor(.white.opacity(0.6))
      Text("Cessna 172 Skyhawk")
        .font(.system(size: 20, weight: .bold))
        .foregroundColor(.white)
      Text("New York JFK · Runway 13R")
        .font(.subheadline)
        .foregroundColor(.white.opacity(0.75))
      Text("Free to fly — no account, no ads.")
        .font(.caption)
        .foregroundColor(.white.opacity(0.55))
    }
    .frame(maxWidth: .infinity)
    .padding(18)
    .background(Color.white.opacity(0.08))
    .clipShape(RoundedRectangle(cornerRadius: 16))
  }

  private var actionsSection: some View {
    VStack(spacing: 12) {
      Button {
        showAppStoreOverlay = true
      } label: {
        Text("Get the full app — free")
          .font(.headline)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 14)
          .background(Color.white)
          .foregroundColor(.black)
          .clipShape(RoundedRectangle(cornerRadius: 12))
      }
      Link(destination: URL(string: "horizonfs://")!) {
        Text("Already have the app? Open it")
          .font(.subheadline.weight(.semibold))
          .foregroundColor(.white.opacity(0.7))
      }
    }
  }

  private var footer: some View {
    Text("HorizonFS · 27 aircraft, 140 airports, real flight physics. Free with a Pro upgrade.")
      .font(.caption)
      .foregroundColor(.white.opacity(0.45))
      .multilineTextAlignment(.center)
      .frame(maxWidth: .infinity)
  }
}
