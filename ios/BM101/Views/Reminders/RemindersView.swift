import SwiftUI

struct RemindersView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var store = ReminderStore.shared
    @StateObject private var notificationManager = NotificationManager.shared
    @State private var showingAdd = false
    @State private var editingReminder: Reminder?

    var body: some View {
        List {
            if !notificationManager.authorizationGranted {
                Section {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Notifications aren't enabled")
                                .font(.subheadline.weight(.medium))
                            Text("Reminders won't alert you until you turn this on.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Button("Enable") {
                            Task { await notificationManager.requestAuthorization() }
                        }
                    }
                }
            }

            if store.reminders.isEmpty {
                Section {
                    Text("No reminders yet. Add one for feeds, meds, pumping — anything on a schedule.")
                        .foregroundStyle(.secondary)
                }
            } else {
                Section("Reminders") {
                    ForEach(store.reminders) { reminder in
                        Button {
                            editingReminder = reminder
                        } label: {
                            ReminderRow(reminder: reminder)
                        }
                        .buttonStyle(.plain)
                        .swipeActions {
                            Button("Delete", role: .destructive) {
                                store.remove(reminder.id)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Reminders")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showingAdd = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingAdd) {
            ReminderEditView(babyId: appState.currentBabyId) { store.add($0) }
        }
        .sheet(item: $editingReminder) { reminder in
            ReminderEditView(reminder: reminder, babyId: reminder.babyId) { store.update($0) }
        }
    }
}

private struct ReminderRow: View {
    let reminder: Reminder

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(reminder.title)
                    .foregroundStyle(reminder.isEnabled ? .primary : .secondary)
                Text(reminder.schedule.summary)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Toggle("", isOn: Binding(
                get: { reminder.isEnabled },
                set: { ReminderStore.shared.setEnabled(reminder.id, isEnabled: $0) }
            ))
            .labelsHidden()
        }
    }
}

private struct ReminderEditView: View {
    @Environment(\.dismiss) private var dismiss
    var reminder: Reminder?
    let babyId: String?
    var onSave: (Reminder) -> Void

    private enum Frequency: String, CaseIterable, Identifiable {
        case oneTime = "Once"
        case daily = "Daily"
        case interval = "Repeating"
        var id: String { rawValue }
    }

    @State private var title: String
    @State private var notes: String
    @State private var frequency: Frequency
    @State private var oneTimeDate: Date
    @State private var dailyTime: Date
    @State private var intervalHours: Double

    init(reminder: Reminder? = nil, babyId: String?, onSave: @escaping (Reminder) -> Void) {
        self.reminder = reminder
        self.babyId = babyId
        self.onSave = onSave

        _title = State(initialValue: reminder?.title ?? "")
        _notes = State(initialValue: reminder?.notes ?? "")

        switch reminder?.schedule {
        case .daily(let hour, let minute):
            _frequency = State(initialValue: .daily)
            var comps = DateComponents()
            comps.hour = hour
            comps.minute = minute
            _dailyTime = State(initialValue: Calendar.current.date(from: comps) ?? Date())
            _oneTimeDate = State(initialValue: Date().addingTimeInterval(3600))
            _intervalHours = State(initialValue: 3)
        case .interval(let seconds):
            _frequency = State(initialValue: .interval)
            _intervalHours = State(initialValue: max(1, seconds / 3600))
            _dailyTime = State(initialValue: Date())
            _oneTimeDate = State(initialValue: Date().addingTimeInterval(3600))
        case .oneTime(let date):
            _frequency = State(initialValue: .oneTime)
            _oneTimeDate = State(initialValue: date)
            _dailyTime = State(initialValue: Date())
            _intervalHours = State(initialValue: 3)
        case nil:
            _frequency = State(initialValue: .daily)
            _dailyTime = State(initialValue: Date())
            _oneTimeDate = State(initialValue: Date().addingTimeInterval(3600))
            _intervalHours = State(initialValue: 3)
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Title (e.g. \"Give vitamin D\")", text: $title)
                    TextField("Notes (optional)", text: $notes)
                }

                Section("Frequency") {
                    Picker("Frequency", selection: $frequency) {
                        ForEach(Frequency.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    switch frequency {
                    case .oneTime:
                        DatePicker("Fires at", selection: $oneTimeDate, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                    case .daily:
                        DatePicker("Time", selection: $dailyTime, displayedComponents: .hourAndMinute)
                    case .interval:
                        Stepper(value: $intervalHours, in: 1...24, step: 0.5) {
                            Text("Every \(intervalHours.formatted(.number.precision(.fractionLength(0...1)))) hour(s)")
                        }
                    }
                }
            }
            .navigationTitle(reminder == nil ? "New Reminder" : "Edit Reminder")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func save() {
        let schedule: Reminder.Schedule
        switch frequency {
        case .oneTime:
            schedule = .oneTime(oneTimeDate)
        case .daily:
            let comps = Calendar.current.dateComponents([.hour, .minute], from: dailyTime)
            schedule = .daily(hour: comps.hour ?? 9, minute: comps.minute ?? 0)
        case .interval:
            schedule = .interval(intervalHours * 3600)
        }

        var updated = reminder ?? Reminder(title: title, schedule: schedule, babyId: babyId)
        updated.title = title
        updated.notes = notes
        updated.schedule = schedule
        onSave(updated)
        dismiss()
    }
}

#Preview {
    NavigationStack { RemindersView() }
        .environmentObject(AppState())
}
