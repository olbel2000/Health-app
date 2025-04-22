import SwiftUI

struct ActivityView: View {
    @EnvironmentObject var healthStore: HealthStore
    @EnvironmentObject var pointsManager: PointsManager
    @State private var showingActivitySheet = false
    @State private var selectedActivity: ActivityType?
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Автоматически отслеживаемые")) {
                    ActivityRow(
                        icon: "figure.walk",
                        title: "Шаги",
                        value: "\(healthStore.steps)",
                        points: pointsManager.calculateStepsPoints(steps: healthStore.steps)
                    )
                    
                    ActivityRow(
                        icon: "flame",
                        title: "Активные калории",
                        value: "\(Int(healthStore.activeEnergy)) ккал",
                        points: pointsManager.calculateEnergyPoints(calories: healthStore.activeEnergy)
                    )
                    
                    ActivityRow(
                        icon: "heart",
                        title: "Минуты упражнений",
                        value: "\(healthStore.exerciseMinutes) мин",
                        points: pointsManager.calculateExercisePoints(minutes: healthStore.exerciseMinutes)
                    )
                }
                
                Section(header: Text("Добавленные вручную")) {
                    ForEach(pointsManager.manualActivities) { activity in
                        ActivityRow(
                            icon: activity.type.icon,
                            title: activity.type.name,
                            value: activity.formattedValue,
                            points: activity.points
                        )
                    }
                }
            }
            .navigationTitle("Активности")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingActivitySheet = true
                    }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingActivitySheet) {
                ActivitySelectionView(isPresented: $showingActivitySheet)
            }
        }
    }
}

struct ActivityRow: View {
    let icon: String
    let title: String
    let value: String
    let points: Int
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .frame(width: 35)
                .foregroundColor(.blue)
            
            VStack(alignment: .leading) {
                Text(title)
                    .font(.headline)
                
                Text(value)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("+\(points)")
                .font(.headline)
                .foregroundColor(.green)
        }
        .padding(.vertical, 5)
    }
}

struct ActivitySelectionView: View {
    @EnvironmentObject var pointsManager: PointsManager
    @Binding var isPresented: Bool
    @State private var selectedActivity: ActivityType = .walking
    @State private var amount: String = ""
    @State private var duration: String = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Тип активности")) {
                    Picker("Активность", selection: $selectedActivity) {
                        ForEach(ActivityType.allCases) { activity in
                            Text(activity.name).tag(activity)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section(header: Text("Детали")) {
                    if selectedActivity.requiresAmount {
                        TextField("Количество", text: $amount)
                            .keyboardType(.decimalPad)
                    }
                    
                    TextField("Продолжительность (мин)", text: $duration)
                        .keyboardType(.numberPad)
                }
                
                Section {
                    Button("Добавить") {
                        addActivity()
                    }
                    .disabled(duration.isEmpty || (selectedActivity.requiresAmount && amount.isEmpty))
                }
            }
            .navigationTitle("Добавить активность")
            .navigationBarItems(trailing: Button("Отмена") {
                isPresented = false
            })
        }
    }
    
    private func addActivity() {
        let durationValue = Int(duration) ?? 0
        let amountValue = Double(amount) ?? 0
        
        pointsManager.addManualActivity(
            type: selectedActivity,
            amount: amountValue,
            duration: durationValue
        )
        
        isPresented = false
    }
}