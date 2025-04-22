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