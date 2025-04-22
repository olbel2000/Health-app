import SwiftUI

struct PointsView: View {
    @EnvironmentObject var pointsManager: PointsManager
    
    var body: some View {
        NavigationView {
            VStack {
                PointsHeaderView(points: pointsManager.totalPoints)
                
                List {
                    Section(header: Text("История баллов")) {
                        ForEach(pointsManager.pointsHistory) { transaction in
                            PointsTransactionRow(transaction: transaction)
                        }
                    }
                    
                    Section(header: Text("Достижения")) {
                        ForEach(pointsManager.achievements) { achievement in
                            AchievementRow(achievement: achievement)
                        }
                    }
                }
            }
            .navigationTitle("Баллы")
        }
    }
}

struct PointsHeaderView: View {
    let points: Int
    
    var body: some View {
        VStack(spacing: 15) {
            Text("Всего баллов")
                .font(.headline)
            
            Text("\(points)")
                .font(.system(size: 48, weight: .bold))
                .foregroundColor(.blue)
            
            Text("Продолжайте вести здоровый образ жизни!")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
    }
}

struct PointsTransactionRow: View {
    let transaction: PointsTransaction
    
    var body: some View {
        HStack {
            Image(systemName: transaction.icon)
                .font(.title2)
                .frame(width: 35)
                .foregroundColor(.blue)
            
            VStack(alignment: .leading) {
                Text(transaction.title)
                    .font(.headline)
                
                Text(transaction.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(transaction.formattedPoints)
                .font(.headline)
                .foregroundColor(transaction.pointsColor)
        }
        .padding(.vertical, 5)
    }
}

struct AchievementRow: View {
    let achievement: Achievement
    
    var body: some View {
        HStack {
            Image(systemName: achievement.icon)
                .font(.title2)
                .frame(width: 35)
                .foregroundColor(.orange)
            
            VStack(alignment: .leading) {
                Text(achievement.title)
                    .font(.headline)
                
                Text(achievement.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("+\(achievement.points)")
                .font(.headline)
                .foregroundColor(.green)
        }
        .padding(.vertical, 5)
    }
}