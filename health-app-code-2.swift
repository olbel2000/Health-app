// PointsManager.swift
import Foundation

class PointsManager: ObservableObject {
    @Published var totalPoints: Int = 0
    @Published var pointsHistory: [PointsTransaction] = []
    @Published var achievements: [Achievement] = []
    @Published var manualActivities: [ManualActivity] = []
    
    var recentAchievements: [Achievement] {
        return Array(achievements.prefix(3))
    }
    
    init() {
        // Загружаем демо-данные
        loadDemoData()
    }
    
    // MARK: - Расчет баллов
    
    func calculateStepsPoints(steps: Int) -> Int {
        // Базовые баллы: 1 балл за каждые 1000 шагов
        let basePoints = steps / 1000
        
        // Бонусные баллы за достижение определенных порогов
        var bonusPoints = 0
        if steps >= 10000 {
            bonusPoints += 5  // Бонус за 10000+ шагов
        } else if steps >= 5000 {
            bonusPoints += 2  // Бонус за 5000+ шагов
        }
        
        return basePoints + bonusPoints
    }
    
    func calculateEnergyPoints(calories: Double) -> Int {
        // 1 балл за каждые 100 активных калорий
        let basePoints = Int(calories / 100)
        
        // Бонусные баллы за достижение определенных порогов
        var bonusPoints = 0
        if calories >= 500 {
            bonusPoints += 5  // Бонус за 500+ калорий
        } else if calories >= 300 {
            bonusPoints += 2  // Бонус за 300+ калорий
        }
        
        return basePoints + bonusPoints
    }
    
    func calculateExercisePoints(minutes: Int) -> Int {
        // 2 балла за каждые 10 минут упражнений
        let basePoints = (minutes / 10) * 2
        
        // Бонусные баллы за достижение определенных порогов
        var bonusPoints = 0
        if minutes >= 60 {
            bonusPoints += 10  // Бонус за 60+ минут
        } else if minutes >= 30 {
            bonusPoints += 5   // Бонус за 30+ минут
        }
        
        return basePoints + bonusPoints
    }
    
    // MARK: - Управление активностями
    
    func addManualActivity(type: ActivityType, amount: Double, duration: Int) {
        // Расчет баллов на основе типа активности и продолжительности
        let points = calculateActivityPoints(type: type, amount: amount, duration: duration)
        
        // Создание новой активности
        let activity = ManualActivity(
            type: type,
            amount: amount,
            duration: duration,
            date: Date(),
            points: points
        )
        
        // Добавление активности в список
        manualActivities.append(activity)
        
        // Добавление транзакции баллов
        addPointsTransaction(title: "Активность: \(type.name)", points: points, icon: type.icon)
        
        // Проверка достижений
        checkAchievementsForActivity(type: type, amount: amount, duration: duration)
    }
    
    private func calculateActivityPoints(type: ActivityType, amount: Double, duration: Int) -> Int {
        var points = 0
        
        switch type {
        case .walking:
            points = Int(amount * 10)  // 10 баллов за километр
        case .running:
            points = Int(amount * 15)  // 15 баллов за километр
        case .cycling:
            points = Int(amount * 8)   // 8 баллов за километр
        case .swimming:
            points = Int(amount / 100) // 1 балл за 100 метров
        case .yoga, .meditation:
            points = duration / 5      // 1 балл за 5 минут
        case .gym:
            points = duration / 3      // 1 балл за 3 минуты
        case .waterIntake:
            points = Int(amount / 250) // 1 балл за 250 мл
        case .sleep:
            points = duration / 30     // 1 балл за 30 минут сна
        }
        
        // Бонус за продолжительность
        if duration >= 60 {
            points += 5  // Бонус за активность 60+ минут
        } else if duration >= 30 {
            points += 2  // Бонус за активность 30+ минут
        }
        
        return points
    }
    
    // MARK: - Управление баллами
    
    func addPointsTransaction(title: String, points: Int, icon: String) {
        let transaction = PointsTransaction(
            title: title,
            points: points,
            date: Date(),
            icon: icon
        )
        
        pointsHistory.append(transaction)
        totalPoints += points
    }
    
    // MARK: - Достижения
    
    private func checkAchievementsForActivity(type: ActivityType, amount: Double, duration: Int) {
        // Проверка достижений на основе типа активности
        switch type {
        case .walking:
            if amount >= 5 {
                addAchievement(title: "Длительная прогулка", description: "Прошли 5+ км за одну прогулку", icon: "figure.walk", points: 10)
            }
        case .running:
            if amount >= 3 {
                addAchievement(title: "Бегун", description: "Пробежали 3+ км за одну тренировку", icon: "figure.run", points: 15)
            }
        case .cycling:
            if amount >= 10 {
                addAchievement(title: "Велосипедист", description: "Проехали 10+ км на велосипеде", icon: "bicycle", points: 20)
            }
        case .swimming:
            if amount >= 500 {
                addAchievement(title: "Пловец", description: "Проплыли 500+ метров", icon: "figure.pool.swim", points: 15)
            }
        case .yoga:
            if duration >= 30 {
                addAchievement(title: "Йог", description: "30+ минут йоги", icon: "figure.mind.and.body", points: 10)
            }
        case .gym:
            if duration >= 60 {
                addAchievement(title: "Силач", description: "60+ минут в тренажерном зале", icon: "dumbbell", points: 15)
            }
        case .meditation:
            if duration >= 15 {
                addAchievement(title: "Медитирующий", description: "15+ минут медитации", icon: "brain", points: 10)
            }
        case .waterIntake:
            if amount >= 2000 {
                addAchievement(title: "Гидратация", description: "Выпили 2+ литра воды", icon: "drop", points: 10)
            }
        case .sleep:
            if duration >= 480 {
                addAchievement(title: "Здоровый сон", description: "Спали 8+ часов", icon: "bed.double", points: 10)
            }
        }
        
        // Проверка достижений на основе продолжительности
        if duration >= 120 {
            addAchievement(title: "Марафонец", description: "2+ часа активности", icon: "clock", points: 20)
        }
    }
    
    private func addAchievement(title: String, description: String, icon: String, points: Int) {
        // Проверяем, не получено ли уже это достижение
        if !achievements.contains(where: { $0.title == title }) {
            let achievement = Achievement(
                title: title,
                description: description,
                icon: icon,
                points: points,
                date: Date()
            )
            
            achievements.append(achievement)
            addPointsTransaction(title: "Достижение: \(title)", points: points, icon: icon)
        }
    }
    
    // MARK: - Демо-данные
    
    private func loadDemoData() {
        // Добавляем несколько демо-транзакций
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
        let twoDaysAgo = Calendar.current.date(byAdding: .day, value: -2, to: Date()) ?? Date()
        
        // Транзакции
        pointsHistory = [
            PointsTransaction(title: "Ежедневный бонус", points: 5, date: Date(), icon: "star"),
            PointsTransaction(title: "10000 шагов", points: 15, date: yesterday, icon: "figure.walk"),
            PointsTransaction(title: "Тренировка в зале", points: 20, date: twoDaysAgo, icon: "dumbbell")
        ]
        
        // Активности
        manualActivities = [
            ManualActivity(type: .gym, amount: 0, duration: 60, date: yesterday, points: 20),
            ManualActivity(type: .waterIntake, amount: 1500, duration: 0, date: Date(), points: 6)
        ]
        
        // Достижения
        achievements = [
            Achievement(title: "Первые шаги", description: "Начало пути к здоровому образу жизни", icon: "flag", points: 10, date: twoDaysAgo),
            Achievement(title: "Регулярность", description: "3 дня активности подряд", icon: "calendar", points: 15, date: yesterday)
        ]
        
        // Обновляем общее количество баллов
        updateTotalPoints()
    }
    
    private func updateTotalPoints() {
        totalPoints = pointsHistory.reduce(0) { $0 + $1.points }
    }
}

// Info.plist (добавить в проект)
/*
<key>NSHealthShareUsageDescription</key>
<string>Приложение запрашивает доступ к данным о вашей активности, чтобы начислять баллы за полезные для здоровья действия</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Приложение запрашивает доступ к данным о вашей активности, чтобы начислять баллы за полезные для здоровья действия</string>
*/