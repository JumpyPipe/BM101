import SwiftUI

@MainActor
final class AssistantViewModel: ObservableObject {
    @Published var turns: [ChatTurn] = []
    @Published var input = ""
    @Published var isSending = false
    @Published var errorMessage: String?

    func send(babyId: String) {
        let message = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty, !isSending else { return }

        input = ""
        errorMessage = nil
        turns.append(ChatTurn(role: .user, content: message))
        isSending = true

        Task {
            do {
                let reply = try await APIClient.shared.sendChatMessage(babyId: babyId, message: message)
                turns.append(ChatTurn(role: .assistant, content: reply))
            } catch {
                errorMessage = error.localizedDescription
            }
            isSending = false
        }
    }
}

struct AssistantView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel = AssistantViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 10) {
                            if viewModel.turns.isEmpty {
                                Text("Ask about feeding schedules, sleep patterns, or anything else — the assistant can see this baby's recent logs.")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                                    .padding()
                            }
                            ForEach(viewModel.turns) { turn in
                                bubble(for: turn).id(turn.id)
                            }
                            if viewModel.isSending {
                                ProgressView().padding(.leading)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: viewModel.turns) { turns in
                        if let last = turns.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }

                if let error = viewModel.errorMessage {
                    ErrorBanner(message: error).padding(.horizontal)
                }

                HStack {
                    TextField("Ask a question…", text: $viewModel.input, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(1...4)
                    Button {
                        if let babyId = appState.currentBaby?.id { viewModel.send(babyId: babyId) }
                    } label: {
                        Image(systemName: "arrow.up.circle.fill").font(.title2)
                    }
                    .disabled(viewModel.input.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding()
            }
            .navigationTitle("Assistant")
        }
    }

    private func bubble(for turn: ChatTurn) -> some View {
        HStack {
            if turn.role == .assistant { Spacer(minLength: 40) }
            Text(turn.content)
                .font(.subheadline)
                .padding(10)
                .background(turn.role == .user ? Color.pink : Color(.secondarySystemGroupedBackground))
                .foregroundStyle(turn.role == .user ? .white : .primary)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            if turn.role == .user { Spacer(minLength: 40) }
        }
        .frame(maxWidth: .infinity, alignment: turn.role == .user ? .trailing : .leading)
    }
}

#Preview {
    AssistantView().environmentObject(AppState())
}
