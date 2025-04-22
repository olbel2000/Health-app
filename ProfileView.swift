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