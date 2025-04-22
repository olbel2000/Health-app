// HealthPlusApp.swift
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

// ContentView.swift
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

// DashboardView.swift
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

// ActivityView.swift
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

// PointsView.swift
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

// ProfileView.swift
import SwiftUI

struct ProfileView: View {
    @State private var username = "Пользователь"
    @State private var showEditProfile = false
    @State private var selectedDevice: ConnectedDevice?
    @State private var showDeviceDetails = false
    
    let connectedDevices: [ConnectedDevice] = [
        ConnectedDevice(id: UUID(), name: "Apple Watch", type: .appleWatch),
        ConnectedDevice(id: UUID(), name: "Xiaomi Mi Band", type: .fitnessBand)
    ]
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)
                        
                        VStack(alignment: .leading) {
                            Text(username)
                                .font(.headline)
                            
                            Text("Активный пользователь")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .padding(.leading, 10)
                    }
                    .padding(.vertical, 10)
                }
                
                Section(header: Text("Устройства")) {
                    ForEach(connectedDevices) { device in
                        Button(action: {
                            selectedDevice = device
                            showDeviceDetails = true
                        }) {
                            HStack {
                                Image(systemName: device.type.icon)
                                    .frame(width: 30)
                                    .foregroundColor(.blue)
                                
                                Text(device.name)
                                
                                Spacer()
                                
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                            }
                        }
                    }
                    
                    Button(action: {}) {
                        Label("Подключить устройство", systemImage: "plus")
                    }
                }
                
                Section(header: Text("Настройки")) {
                    NavigationLink(destination: SettingsView()) {
                        Label("Настройки приложения", systemImage: "gear")
                    }
                    
                    Button(action: {}) {
                        Label("Синхронизировать с Apple Health", systemImage: "heart.fill")
                    }
                    
                    Button(action: {}) {
                        Label("Очистить данные", systemImage: "trash")
                            .foregroundColor(.red)
                    }
                }
                
                Section {
                    Button(action: {}) {
                        Text("Выйти")
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
            }
            .navigationTitle("Профиль")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showEditProfile = true
                    }) {
                        Text("Изменить")
                    }
                }
            }
            .sheet(isPresented: $showEditProfile) {
                EditProfileView(username: $username, isPresented: $showEditProfile)
            }
            .sheet(isPresented: $showDeviceDetails, onDismiss: {
                selectedDevice = nil
            }) {
                if let device = selectedDevice {
                    DeviceDetailsView(device: device, isPresented: $showDeviceDetails)
                }
            }
        }
    }
}

struct EditProfileView: View {
    @Binding var username: String
    @Binding var isPresented: Bool
    @State private var editingUsername: String = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Информация профиля")) {
                    TextField("Имя пользователя", text: $editingUsername)
                }
                
                Section {
                    Button("Сохранить") {
                        username = editingUsername
                        isPresented = false
                    }
                }
            }
            .navigationTitle("Редактировать профиль")
            .navigationBarItems(trailing: Button("Отмена") {
                isPresented = false
            })
            .onAppear {
                editingUsername = username
            }
        }
    }
}

struct DeviceDetailsView: View {
    let device: ConnectedDevice
    @Binding var isPresented: Bool
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    HStack {
                        Image(systemName: device.type.icon)
                            .font(.system(size: 40))
                            .foregroundColor(.blue)
                            .frame(width: 60)
                        
                        VStack(alignment: .leading) {
                            Text(device.name)
                                .font(.headline)
                            
                            Text("Подключено")
                                .font(.subheadline)
                                .foregroundColor(.green)
                        }
                    }
                    .padding(.vertical, 10)
                }
                
                Section(header: Text("Информация")) {
                    HStack {
                        Text("Тип")
                        Spacer()
                        Text(device.type.description)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Статус")
                        Spacer()
                        Text("Синхронизировано")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Последняя синхронизация")
                        Spacer()
                        Text("Сегодня, 14:30")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section(header: Text("Действия")) {
                    Button(action: {}) {
                        Label("Синхронизировать сейчас", systemImage: "arrow.clockwise")
                    }
                    
                    Button(action: {}) {
                        Label("Отключить устройство", systemImage: "xmark.circle")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Детали устройства")
            .navigationBarItems(trailing: Button("Закрыть") {
                isPresented = false
            })
        }
    }
}

struct SettingsView: View {
    @State private var notificationsEnabled = true
    @State private var syncHealthkit = true
    @State private var darkModeEnabled = false
    
    var body: some View {
        List {
            Section(header: Text("Общие")) {
                Toggle("Уведомления", isOn: $notificationsEnabled)
                Toggle("Синхронизация с HealthKit", isOn: $syncHealthkit)
                Toggle("Темный режим", isOn: $darkModeEnabled)
            }
            
            Section(header: Text("Баллы и достижения")) {
                NavigationLink(destination: Text("Настройки расчета баллов")) {
                    Text("Настройки расчета баллов")
                }
                
                NavigationLink(destination: Text("Настройка целей")) {
                    Text("Настройка целей")
                }
            }
            
            Section(header: Text("О приложении")) {
                HStack {
                    Text("Версия")
                    Spacer()
                    Text("1.0.0")
                        .foregroundColor(.secondary)
                }
                
                NavigationLink(destination: Text("Политика конфиденциальности")) {
                    Text("Политика конфиденциальности")
                }
                
                NavigationLink(destination: Text("Условия использования")) {
                    Text("Условия использования")
                }
            }
        }
        .navigationTitle("Настройки")
    }
}

// Models.swift
import Foundation
import SwiftUI

// MARK: - Activity Types
enum ActivityType: String, CaseIterable, Identifiable {
    case walking
    case running
    case cycling
    case swimming
    case yoga
    case gym
    case meditation
    case waterIntake
    case sleep
    
    var id: String { self.rawValue }
    
    var name: String {
        switch self {
        case .walking: return "Ходьба"
        case .running: return "Бег"
        case .cycling: return "Велосипед"
        case .swimming: return "Плавание"
        case .yoga: return "Йога"
        case .gym: return "Тренажерный зал"
        case .meditation: return "Медитация"
        case .waterIntake: return "Питье воды"
        case .sleep: return "Сон"
        }
    }
    
    var icon: String {
        switch self {
        case .walking: return "figure.walk"
        case .running: return "figure.run"
        case .cycling: return "bicycle"
        case .swimming: return "figure.pool.swim"
        case .yoga: return "figure.mind.and.body"
        case .gym: return "dumbbell"
        case .meditation: return "brain"
        case .waterIntake: return "drop"
        case .sleep: return "bed.double"
        }
    }
    
    var unit: String {
        switch self {
        case .walking, .running, .cycling: return "км"
        case .swimming: return "м"
        case .yoga, .gym, .meditation, .sleep: return "мин"
        case .waterIntake: return "мл"
        }
    }
    
    var requiresAmount: Bool {
        switch self {
        case .walking, .running, .cycling, .swimming, .waterIntake:
            return true
        case .yoga, .gym, .meditation, .sleep:
            return false
        }
    }
}

// MARK: - Manual Activity
struct ManualActivity: Identifiable {
    let id = UUID()
    let type: ActivityType
    let amount: Double
    let duration: Int
    let date: Date
    let points: Int
    
    var formattedValue: String {
        if type.requiresAmount {
            return "\(amount) \(type.unit) за \(duration) мин"
        } else {
            return "\(duration) \(type.unit)"
        }
    }
}

// MARK: - Points Transaction
struct PointsTransaction: Identifiable {
    let id = UUID()
    let title: String
    let points: Int
    let date: Date
    let icon: String
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    var formattedPoints: String {
        return points >= 0 ? "+\(points)" : "\(points)"
    }
    
    var pointsColor: Color {
        return points >= 0 ? .green : .red
    }
}

// MARK: - Achievement
struct Achievement: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let points: Int
    let date: Date
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Connected Device
struct ConnectedDevice: Identifiable {
    let id: UUID
    let name: String
    let type: DeviceType
    
    enum DeviceType {
        case appleWatch
        case fitnessBand
        case smartScale
        case other
        
        var icon: String {
            switch self {
            case .appleWatch: return "applewatch"
            case .fitnessBand: return "waveform.path.ecg"
            case .smartScale: return "scalemass"
            case .other: return "devicephone.wireless"
            }
        }
        
        var description: String {
            switch self {
            case .appleWatch: return "Apple Watch"
            case .fitnessBand: return "Фитнес-браслет"
            case .smartScale: return "Умные весы"
            case .other: return "Другое устройство"
            }
        }
    }
}

// HealthStore.swift
import Foundation
import HealthKit

class HealthStore: ObservableObject {
    private let healthStore = HKHealthStore()
    
    @Published var steps: Int = 0
    @Published var activeEnergy: Double = 0
    @Published var exerciseMinutes: Int = 0
    @Published var weeklyActivityData: [(date: Date, steps: Int, activeEnergy: Double)] = []
    
    private let stepsType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
    private let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
    private let exerciseTimeType = HKQuantityType.quantityType(forIdentifier: .appleExerciseTime)!
    
    func requestAuthorization() {
        let typesToRead: Set<HKObjectType> = [
            stepsType,
            activeEnergyType,
            exerciseTimeType
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            if success {
                DispatchQueue.main.async {
                    self.fetchTodayData()
                    self.fetchWeeklyData()
                }
            } else if let error = error {
                print("HealthKit authorization failed with error: \(error.localizedDescription)")
            }
        }
    }
    
    func fetchTodayData() {
        fetchTodaySteps()
        fetchTodayActiveEnergy()
        fetchTodayExerciseMinutes()
    }
    
    private func fetchTodaySteps() {
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        let query = HKStatisticsQuery(
            quantityType: stepsType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            guard let result = result, let sum = result.sumQuantity() else {
                if let error = error {
                    print("Error fetching steps: \(error.localizedDescription)")
                }
                return
            }
            
            let steps = Int(sum.doubleValue(for: HKUnit.count()))
            
            DispatchQueue.main.async {
                self.steps = steps
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchTodayActiveEnergy() {
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        let query = HKStatisticsQuery(
            quantityType: activeEnergyType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            guard let result = result, let sum = result.sumQuantity() else {
                if let error = error {
                    print("Error fetching active energy: \(error.localizedDescription)")
                }
                return
            }
            
            let calories = sum.doubleValue(for: HKUnit.kilocalorie())
            
            DispatchQueue.main.async {
                self.activeEnergy = calories
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchTodayExerciseMinutes() {
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        let query = HKStatisticsQuery(
            quantityType: exerciseTimeType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            guard let result = result, let sum = result.sumQuantity() else {
                if let error = error {
                    print("Error fetching exercise minutes: \(error.localizedDescription)")
                }
                return
            }
            
            let minutes = Int(sum.doubleValue(for: HKUnit.minute()))
            
            DispatchQueue.main.async {
                self.exerciseMinutes = minutes
            }
        }
        
        healthStore.execute(query)
    }
    
    func fetchWeeklyData() {
        let calendar = Calendar.current
        let now = Date()
        let endDate = calendar.startOfDay(for: now)
        guard let startDate = calendar.date(byAdding: .day, value: -6, to: endDate) else { return }
        
        var weekData: [(date: Date, steps: Int, activeEnergy: Double)] = []
        
        for i in 0..<7 {
            guard let date = calendar.date(byAdding: .day, value: i, to: startDate) else { continue }
            weekData.append((date: date, steps: 0, activeEnergy: 0))
        }
        
        fetchWeeklySteps(startDate: startDate, endDate: now) { stepsData in
            for (index, dayData) in weekData.enumerated() {
                if let steps = stepsData[dayData.date] {
                    weekData[index].steps = steps
                }
            }
            
            self.fetchWeeklyActiveEnergy(startDate: startDate, endDate: now) { energyData in
                for (index, dayData) in weekData.enumerated() {
                    if let energy = energyData[dayData.date] {
                        weekData[index].activeEnergy = energy
                    }
                }
                
                DispatchQueue.main.async {
                    self.weeklyActivityData = weekData
                }
            }
        }
    }
    
    private func fetchWeeklySteps(startDate: Date, endDate: Date, completion: @escaping ([Date: Int]) -> Void) {
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        let query = HKStatisticsCollectionQuery(
            quantityType: stepsType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum,
            anchorDate: startDate,
            intervalComponents: DateComponents(day: 1)
        )
        
        query.initialResultsHandler = { _, results, error in
            var stepsData: [Date: Int] = [:]
            
            guard let results = results else {
                if let error = error {
                    print("Error fetching weekly steps: \(error.localizedDescription)")
                }
                completion(stepsData)
                return
            }
            
            let calendar = Calendar.current
            
            results.enumerateStatistics(from: startDate, to: endDate) { statistics, _ in
                let startDate = statistics.startDate
                let dayStart = calendar.startOfDay(for: startDate)
                
                if let quantity = statistics.sumQuantity() {
                    let steps = Int(quantity.doubleValue(for: HKUnit.count()))
                    stepsData[dayStart] = steps
                } else {
                    stepsData[dayStart] = 0
                }
            }
            
            completion(stepsData)
        }
        
        healthStore.execute(query)
    }
    
    private func fetchWeeklyActiveEnergy(startDate: Date, endDate: Date, completion: @escaping ([Date: Double]) -> Void) {
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        let query = HKStatisticsCollectionQuery(
            quantityType: activeEnergyType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum,
            anchorDate: startDate,
            intervalComponents: DateComponents(day: 1)
        )
        
        query.initialResultsHandler = { _, results, error in
            var energyData: [Date: Double] = [:]
            
            guard let results = results else {
                if let error = error {
                    print("Error fetching weekly active energy: \(error.localizedDescription)")
                }
                completion(energyData)
                return
            }
            
            let calendar = Calendar.current
            
            results.enumerateStatistics(from: startDate, to: endDate) { statistics, _ in
                let startDate = statistics.startDate
                let dayStart = calendar.startOfDay(for: startDate)
                
                if let quantity = statistics.sumQuantity() {
                    let energy = quantity.doubleValue(for: HKUnit.kilocalorie())
                    energyData[dayStart] = energy
                } else {
                    energyData[dayStart] = 0
                }
            }
            
            completion(energyData)
        }
        
        healthStore.execute(query)
    }
}