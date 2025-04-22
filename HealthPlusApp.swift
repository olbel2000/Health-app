import SwiftUI
import HealthKit

@main
struct HealthPlusApp: App {
    @StateObject private var healthStore = HealthStore()
    @StateObject private var pointsManager = PointsManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(healthStore)
                .environmentObject(pointsManager)
                .onAppear {
                    healthStore.requestAuthorization()
                }
        }
    }
}