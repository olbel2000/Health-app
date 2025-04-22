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