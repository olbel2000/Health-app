import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Дашборд", systemImage: "house")
                }
                .tag(0)
            
            ActivityView()
                .tabItem {
                    Label("Активности", systemImage: "figure.walk")
                }
                .tag(1)
            
            PointsView()
                .tabItem {
                    Label("Баллы", systemImage: "star")
                }
                .tag(2)
            
            ProfileView()
                .tabItem {
                    Label("Профиль", systemImage: "person")
                }
                .tag(3)
        }
    }
}