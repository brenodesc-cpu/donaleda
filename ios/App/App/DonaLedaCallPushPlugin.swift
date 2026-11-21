import AVFoundation
import CallKit
import Capacitor
import Foundation
import PushKit

/// Coordena PushKit (VoIP) + CallKit nativo do iOS para acordar o iPhone
/// com a tela nativa de ligação mesmo com o app fechado ou bloqueado.
final class DonaLedaVoipCoordinator: NSObject, PKPushRegistryDelegate, CXProviderDelegate {
    static let shared = DonaLedaVoipCoordinator()

    private var registry: PKPushRegistry?
    private let provider: CXProvider
    private let callController = CXCallController()
    private var activeCalls: [UUID: String] = [:]

    private(set) var lastVoipToken: String?
    private var pendingAction: (acao: String, chamadaId: String)?
    weak var activePlugin: DonaLedaCallPushPlugin?

    private static let keyAparelhoToken = "donaleda_aparelho_token"
    private static let keyServerUrl = "donaleda_server_url"
    private static let defaultServerUrl = "https://donaleda.vercel.app"

    func saveCredentials(aparelhoToken: String?, serverUrl: String?) {
        let defaults = UserDefaults.standard
        if let token = aparelhoToken?.trimmingCharacters(in: .whitespacesAndNewlines), !token.isEmpty {
            defaults.set(token, forKey: Self.keyAparelhoToken)
        }
        if let url = serverUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
           url.hasPrefix("https://") || url.hasPrefix("http://") {
            defaults.set(url.trimmingCharacters(in: CharacterSet(charactersIn: "/")), forKey: Self.keyServerUrl)
        }
    }

    func sendCallResponseInBackground(acao: String, chamadaId: String) {
        let defaults = UserDefaults.standard
        guard let token = defaults.string(forKey: Self.keyAparelhoToken), !token.isEmpty else { return }
        let baseUrl = defaults.string(forKey: Self.keyServerUrl) ?? Self.defaultServerUrl
        guard let url = URL(string: "\(baseUrl)/api/chamada") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 8
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(token, forHTTPHeaderField: "x-aparelho-token")
        let body: [String: String] = ["acao": acao, "chamadaId": chamadaId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        URLSession.shared.dataTask(with: request).resume()
    }

    private override init() {
        let config = CXProviderConfiguration(localizedName: "Dona Leda")
        config.supportsVideo = false
        config.maximumCallsPerCallGroup = 1
        config.maximumCallGroups = 1
        config.supportedHandleTypes = [.generic]
        self.provider = CXProvider(configuration: config)
        super.init()
        self.provider.setDelegate(self, queue: nil)
    }

    func start() {
        guard registry == nil else { return }
        let voipRegistry = PKPushRegistry(queue: .main)
        voipRegistry.delegate = self
        voipRegistry.desiredPushTypes = [.voIP]
        self.registry = voipRegistry
    }

    func consumePendingAction() -> (acao: String, chamadaId: String)? {
        let current = pendingAction
        pendingAction = nil
        return current
    }

    // MARK: - PKPushRegistryDelegate

    func pushRegistry(
        _ registry: PKPushRegistry,
        didUpdate pushCredentials: PKPushCredentials,
        for type: PKPushType
    ) {
        guard type == .voIP else { return }
        let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
        guard !token.isEmpty else { return }
        lastVoipToken = token
        activePlugin?.emitToken(token)
    }

    func pushRegistry(
        _ registry: PKPushRegistry,
        didReceiveIncomingPushWith payload: PKPushPayload,
        for type: PKPushType,
        completion: @escaping () -> Void
    ) {
        guard type == .voIP else {
            completion()
            return
        }
        let dict = payload.dictionaryPayload
        let chamadaId = (dict["chamadaId"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? UUID().uuidString
        let assistente = (dict["assistente"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "Dona Leda"

        let callUUID = UUID()
        activeCalls[callUUID] = chamadaId

        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: assistente)
        update.localizedCallerName = assistente
        update.hasVideo = false
        update.supportsHolding = false
        update.supportsGrouping = false
        update.supportsUngrouping = false
        update.supportsDTMF = false

        // Obrigatório pelo iOS 13+: reportar imediatamente ao CallKit no callback PushKit.
        provider.reportNewIncomingCall(with: callUUID, update: update) { _ in
            completion()
        }
    }

    // MARK: - CXProviderDelegate

    func providerDidReset(_ provider: CXProvider) {
        activeCalls.removeAll()
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        let chamadaId = activeCalls[action.callUUID]
        configureAudioSessionForVoice()
        if let id = chamadaId {
            sendCallResponseInBackground(acao: "atender", chamadaId: id)
            dispatchAction(acao: "atender", chamadaId: id)
        }
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        if let id = activeCalls.removeValue(forKey: action.callUUID) {
            sendCallResponseInBackground(acao: "recusar", chamadaId: id)
            dispatchAction(acao: "recusar", chamadaId: id)
        }
        action.fulfill()
    }

    private func configureAudioSessionForVoice() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(
            .playAndRecord,
            mode: .voiceChat,
            options: [.allowBluetooth, .defaultToSpeaker]
        )
        try? session.setActive(true)
    }

    private func dispatchAction(acao: String, chamadaId: String) {
        if let plugin = activePlugin {
            plugin.emitCallAction(acao: acao, chamadaId: chamadaId)
        } else {
            pendingAction = (acao, chamadaId)
        }
    }
}

@objc(DonaLedaCallPushPlugin)
public class DonaLedaCallPushPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DonaLedaCallPushPlugin"
    public let jsName = "DonaLedaCallPush"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "register", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPendingCall", returnType: CAPPluginReturnPromise),
    ]

    public override func load() {
        super.load()
        DonaLedaVoipCoordinator.shared.activePlugin = self
        DonaLedaVoipCoordinator.shared.start()
    }

    @objc func register(_ call: CAPPluginCall) {
        DonaLedaVoipCoordinator.shared.saveCredentials(
            aparelhoToken: call.getString("aparelhoToken"),
            serverUrl: call.getString("serverUrl")
        )
        DonaLedaVoipCoordinator.shared.start()
        var result: [String: Any] = [:]
        if let token = DonaLedaVoipCoordinator.shared.lastVoipToken {
            result["token"] = token
            result["plataforma"] = "ios"
        }
        call.resolve(result)
    }

    @objc func getPendingCall(_ call: CAPPluginCall) {
        var result: [String: Any] = [:]
        if let pending = DonaLedaVoipCoordinator.shared.consumePendingAction() {
            result["acao"] = pending.acao
            result["chamadaId"] = pending.chamadaId
        }
        call.resolve(result)
    }

    func emitToken(_ token: String) {
        notifyListeners("tokenReceived", data: [
            "token": token,
            "plataforma": "ios",
        ])
    }

    func emitCallAction(acao: String, chamadaId: String) {
        notifyListeners("callAction", data: [
            "acao": acao,
            "chamadaId": chamadaId,
        ])
    }
}
