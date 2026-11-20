import ExpoModulesCore
import UIKit

/// Présent seulement dans le binaire iOS. Sur iPhone la constante vaut false
/// et aucun raccourci n’est installé. Le profil Apple TV n’autolinke pas ce module.
public class MbaMacModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MbaMac")

    Constant("isiOSAppOnMac") {
      if #available(iOS 14.0, *) {
        return ProcessInfo.processInfo.isiOSAppOnMac
      }
      return false
    }

    Events("onKey")

    OnCreate {
      DispatchQueue.main.async { [weak self] in
        guard #available(iOS 14.0, *), ProcessInfo.processInfo.isiOSAppOnMac else { return }
        MbaMacKeys.install { key in
          self?.sendEvent("onKey", ["key": key])
        }
      }
    }
  }
}

enum MbaMacKeys {
  static var handler: ((String) -> Void)?
  private static var installed = false

  static var originalImp: IMP?
  private static let keySelector = #selector(getter: UIViewController.keyCommands)

  static func install(handler: @escaping (String) -> Void) {
    self.handler = handler
    guard !installed else { return }
    installed = true
    guard
      let original = class_getInstanceMethod(UIViewController.self, keySelector),
      let patched = class_getInstanceMethod(UIViewController.self, #selector(UIViewController.mba_keyCommands))
    else { return }
    originalImp = method_getImplementation(original)
    method_exchangeImplementations(original, patched)
  }

  static func commands() -> [UIKeyCommand] {
    let specs: [(String, UIKeyModifierFlags)] = [
      (UIKeyCommand.inputEscape, []),
      ("f", .command),
      ("\t", []),
      ("\t", .shift),
      ("\r", []),
      (" ", []),
      (UIKeyCommand.inputUpArrow, []),
      (UIKeyCommand.inputDownArrow, []),
      (UIKeyCommand.inputLeftArrow, []),
      (UIKeyCommand.inputRightArrow, []),
    ]
    return specs.map { input, flags in
      let command = UIKeyCommand(input: input, modifierFlags: flags, action: #selector(UIViewController.mba_onKey(_:)))
      if #available(iOS 15.0, *) {
        command.wantsPriorityOverSystemBehavior = true
      }
      return command
    }
  }

  static func name(for command: UIKeyCommand) -> String {
    switch command.input {
    case UIKeyCommand.inputEscape:
      return "escape"
    case "f":
      return command.modifierFlags.contains(.command) ? "find" : "ignore"
    case "\t":
      return command.modifierFlags.contains(.shift) ? "tabBack" : "tab"
    case "\r":
      return "enter"
    case " ":
      return "space"
    case UIKeyCommand.inputUpArrow:
      return "up"
    case UIKeyCommand.inputDownArrow:
      return "down"
    case UIKeyCommand.inputLeftArrow:
      return "left"
    case UIKeyCommand.inputRightArrow:
      return "right"
    default:
      return "ignore"
    }
  }

  static func existingCommands(on controller: UIViewController) -> [UIKeyCommand]? {
    guard let imp = originalImp else { return nil }
    let fn = unsafeBitCast(imp, to: (@convention(c) (AnyObject, Selector) -> [UIKeyCommand]?).self)
    return fn(controller, keySelector)
  }

  static func typing() -> Bool {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let window = scenes.flatMap(\.windows).first(where: \.isKeyWindow)
    var responder = window?.firstResponderView
    while let current = responder {
      if current is UITextField || current is UITextView { return true }
      responder = current.next as? UIView
    }
    return false
  }
}

private extension UIView {
  var firstResponderView: UIView? {
    if isFirstResponder { return self }
    for child in subviews {
      if let found = child.firstResponderView { return found }
    }
    return nil
  }
}

extension UIViewController {
  @objc func mba_keyCommands() -> [UIKeyCommand]? {
    let existing = MbaMacKeys.existingCommands(on: self)
    guard #available(iOS 14.0, *), ProcessInfo.processInfo.isiOSAppOnMac else { return existing }
    return (existing ?? []) + MbaMacKeys.commands()
  }

  @objc func mba_onKey(_ sender: UIKeyCommand) {
    let key = MbaMacKeys.name(for: sender)
    if MbaMacKeys.typing(), key != "escape", key != "find" { return }
    MbaMacKeys.handler?(key)
  }
}
