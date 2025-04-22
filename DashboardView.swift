import SwiftUI
import Charts

struct DashboardView: View {
    @EnvironmentObject var healthStore: HealthStore
    @EnvironmentObject var pointsManager: PointsManager
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    PointsSummaryCard(points: pointsManager.totalPoints)
                    
                    ActivitySummaryCard(steps: healthStore.steps,
                                        activeEnergy: healthStore.activeEnergy,
                                        exerciseMinutes: healthStore.exerciseMinutes)
                    
                    WeeklyProgressChart(data: healthStore.weeklyActivityData)
                    
                    AchievementsPreview(achievements: pointsManager.recentAchievements)
                }
                .padding()
            }
            .navigationTitle("ЗдоровьеПлюс")
            .onAppear {
                healthStore.fetchTodayData()
                healthStore.fetchWeeklyData()
            }
        }
    }
}

struct PointsSummaryCard: View {
    let points: Int
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("Ваши баллы")
                .font(.headline)
            
            HStack {
                Text("\(points)")
                    .font(.system(size: 36, weight: .bold))
                
                Spacer()
                
                Image(systemName: "star.fill")
                    .font(.system(size: 30))
                    .foregroundColor(.yellow)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct ActivitySummaryCard: View {
    let steps: Int
    let activeEnergy: Double
    let exerciseMinutes: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Сегодня")
                .font(.headline)
            
            HStack(spacing: 20) {
                ActivityMetric(value: "\(steps)", label: "Шаги", icon: "shoe")
                ActivityMetric(value: "\(Int(activeEnergy)) ккал", label: "Активность", icon: "flame")
                ActivityMetric(value: "\(exerciseMinutes) мин", label: "Упражнения", icon: "heart")
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct ActivityMetric: View {
    let value: String
    let label: String
    let icon: String
    
    var body: some View {
        VStack {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(.blue)
            
            Text(value)
                .font(.system(size: 18, weight: .semibold))
            
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct WeeklyProgressChart: View {
    let data: [(date: Date, steps: Int, activeEnergy: Double)]
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("Недельная активность")
                .font(.headline)
                .padding(.bottom, 10)
            
            Chart {
                ForEach(data, id: \.date) { item in
                    BarMark(
                        x: .value("День", item.date, unit: .day),
                        y: .value("Шаги", item.steps)
                    )
                    .foregroundStyle(Color.blue.gradient)
                }
            }
            .frame(height: 200)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct AchievementsPreview: View {
    let achievements: [Achievement]
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("Последние достижения")
                .font(.headline)
            
            if achievements.isEmpty {
                Text("Пока нет достижений")
                    .foregroundColor(.secondary)
                    .padding(.top, 5)
            } else {
                ForEach(achievements) { achievement in
                    HStack {
                        Image(systemName: achievement.icon)
                            .font(.title2)
                            .foregroundColor(.orange)
                        
                        VStack(alignment: .leading) {
                            Text(achievement.title)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            
                            Text(achievement.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        Text("+\(achievement.points)")
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                    .padding(.vertical, 5)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}