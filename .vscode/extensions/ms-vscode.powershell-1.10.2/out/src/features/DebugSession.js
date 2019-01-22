"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const platform_1 = require("../platform");
const session_1 = require("../session");
const Settings = require("../settings");
const utils = require("../utils");
exports.StartDebuggerNotificationType = new vscode_languageclient_1.NotificationType("powerShell/startDebugger");
class DebugSessionFeature {
    constructor(context, sessionManager) {
        this.sessionManager = sessionManager;
        this.sessionCount = 1;
        // Register a debug configuration provider
        context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider("PowerShell", this));
    }
    dispose() {
        this.command.dispose();
    }
    setLanguageClient(languageClient) {
        languageClient.onNotification(exports.StartDebuggerNotificationType, () => vscode.debug.startDebugging(undefined, {
            request: "launch",
            type: "PowerShell",
            name: "PowerShell Interactive Session",
        }));
    }
    // DebugConfigurationProvider method
    resolveDebugConfiguration(folder, config, token) {
        // Make sure there is a session running before attempting to debug/run a program
        if (this.sessionManager.getSessionStatus() !== session_1.SessionStatus.Running) {
            const msg = "Cannot debug or run a PowerShell script until the PowerShell session has started. " +
                "Wait for the PowerShell session to finish starting and try again.";
            vscode.window.showWarningMessage(msg);
            return undefined;
        }
        // Starting a debug session can be done when there is no document open e.g. attach to PS host process
        const currentDocument = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : undefined;
        const debugCurrentScript = (config.script === "${file}") || !config.request;
        const generateLaunchConfig = !config.request;
        const settings = Settings.load();
        let createNewIntegratedConsole = settings.debugging.createTemporaryIntegratedConsole;
        if (config.request === "attach") {
            const platformDetails = platform_1.getPlatformDetails();
            const versionDetails = this.sessionManager.getPowerShellVersionDetails();
            if (platformDetails.operatingSystem !== platform_1.OperatingSystem.Windows) {
                const msg = "Attaching to a PowerShell Host Process is supported only on Windows.";
                return vscode.window.showErrorMessage(msg).then((_) => {
                    return undefined;
                });
            }
        }
        if (generateLaunchConfig) {
            // No launch.json, create the default configuration for both unsaved (Untitled) and saved documents.
            config.type = "PowerShell";
            config.name = "PowerShell Launch Current File";
            config.request = "launch";
            config.args = [];
            config.script =
                currentDocument.isUntitled
                    ? currentDocument.uri.toString()
                    : currentDocument.fileName;
            if (settings.debugging.createTemporaryIntegratedConsole) {
                // For a folder-less workspace, vscode.workspace.rootPath will be undefined.
                // PSES will convert that undefined to a reasonable working dir.
                config.cwd =
                    currentDocument.isUntitled
                        ? vscode.workspace.rootPath
                        : currentDocument.fileName;
            }
            else {
                // If the non-temp integrated console is being used, default to the current working dir.
                config.cwd = "";
            }
        }
        if (config.request === "launch") {
            // For debug launch of "current script" (saved or unsaved), warn before starting the debugger if either
            // A) there is not an active document
            // B) the unsaved document's language type is not PowerShell
            // C) the saved document's extension is a type that PowerShell can't debug.
            if (debugCurrentScript) {
                if (currentDocument === undefined) {
                    const msg = "To debug the \"Current File\", you must first open a " +
                        "PowerShell script file in the editor.";
                    vscode.window.showErrorMessage(msg);
                    return;
                }
                if (currentDocument.isUntitled) {
                    if (currentDocument.languageId === "powershell") {
                        if (!generateLaunchConfig) {
                            // Cover the case of existing launch.json but unsaved (Untitled) document.
                            // In this case, vscode.workspace.rootPath will not be undefined.
                            config.script = currentDocument.uri.toString();
                            config.cwd = vscode.workspace.rootPath;
                        }
                    }
                    else {
                        const msg = "To debug '" + currentDocument.fileName + "', change the document's " +
                            "language mode to PowerShell or save the file with a PowerShell extension.";
                        vscode.window.showErrorMessage(msg);
                        return;
                    }
                }
                else {
                    let isValidExtension = false;
                    const extIndex = currentDocument.fileName.lastIndexOf(".");
                    if (extIndex !== -1) {
                        const ext = currentDocument.fileName.substr(extIndex + 1).toUpperCase();
                        isValidExtension = (ext === "PS1" || ext === "PSM1");
                    }
                    if ((currentDocument.languageId !== "powershell") || !isValidExtension) {
                        let path = currentDocument.fileName;
                        const workspaceRootPath = vscode.workspace.rootPath;
                        if (currentDocument.fileName.startsWith(workspaceRootPath)) {
                            path = currentDocument.fileName.substring(vscode.workspace.rootPath.length + 1);
                        }
                        const msg = "PowerShell does not support debugging this file type: '" + path + "'.";
                        vscode.window.showErrorMessage(msg);
                        return;
                    }
                    if (config.script === "${file}") {
                        config.script = currentDocument.fileName;
                    }
                }
            }
            if ((currentDocument !== undefined) && (config.cwd === "${file}")) {
                config.cwd = currentDocument.fileName;
            }
            // If the createTemporaryIntegratedConsole field is not specified in the launch config, set the field using
            // the value from the corresponding setting.  Otherwise, the launch config value overrides the setting.
            if (config.createTemporaryIntegratedConsole === undefined) {
                config.createTemporaryIntegratedConsole = createNewIntegratedConsole;
            }
            else {
                createNewIntegratedConsole = config.createTemporaryIntegratedConsole;
            }
        }
        // Prevent the Debug Console from opening
        config.internalConsoleOptions = "neverOpen";
        // Create or show the interactive console
        vscode.commands.executeCommand("PowerShell.ShowSessionConsole", true);
        const sessionFilePath = utils.getDebugSessionFilePath();
        if (createNewIntegratedConsole) {
            if (this.tempDebugProcess) {
                this.tempDebugProcess.dispose();
            }
            this.tempDebugProcess =
                this.sessionManager.createDebugSessionProcess(sessionFilePath, settings);
            this.tempDebugProcess
                .start(`DebugSession-${this.sessionCount++}`)
                .then((sessionDetails) => {
                utils.writeSessionFile(sessionFilePath, sessionDetails);
            });
        }
        else {
            utils.writeSessionFile(sessionFilePath, this.sessionManager.getSessionDetails());
        }
        return config;
    }
}
exports.DebugSessionFeature = DebugSessionFeature;
class SpecifyScriptArgsFeature {
    constructor(context) {
        this.context = context;
        this.command =
            vscode.commands.registerCommand("PowerShell.SpecifyScriptArgs", () => {
                return this.specifyScriptArguments();
            });
    }
    setLanguageClient(languageclient) {
        this.languageClient = languageclient;
    }
    dispose() {
        this.command.dispose();
    }
    specifyScriptArguments() {
        const powerShellDbgScriptArgsKey = "powerShellDebugScriptArgs";
        const options = {
            ignoreFocusOut: true,
            placeHolder: "Enter script arguments or leave empty to pass no args",
        };
        const prevArgs = this.context.workspaceState.get(powerShellDbgScriptArgsKey, "");
        if (prevArgs.length > 0) {
            options.value = prevArgs;
        }
        return vscode.window.showInputBox(options).then((text) => {
            // When user cancel's the input box (by pressing Esc), the text value is undefined.
            // Let's not blow away the previous settting.
            if (text !== undefined) {
                this.context.workspaceState.update(powerShellDbgScriptArgsKey, text);
            }
            return text;
        });
    }
}
exports.SpecifyScriptArgsFeature = SpecifyScriptArgsFeature;
exports.GetPSHostProcessesRequestType = new vscode_languageclient_1.RequestType("powerShell/getPSHostProcesses");
class PickPSHostProcessFeature {
    constructor() {
        this.command =
            vscode.commands.registerCommand("PowerShell.PickPSHostProcess", () => {
                return this.getLanguageClient()
                    .then((_) => this.pickPSHostProcess(), (_) => undefined);
            });
    }
    setLanguageClient(languageClient) {
        this.languageClient = languageClient;
        if (this.waitingForClientToken) {
            this.getLanguageClientResolve(this.languageClient);
            this.clearWaitingToken();
        }
    }
    dispose() {
        this.command.dispose();
    }
    getLanguageClient() {
        if (this.languageClient) {
            return Promise.resolve(this.languageClient);
        }
        else {
            // If PowerShell isn't finished loading yet, show a loading message
            // until the LanguageClient is passed on to us
            this.waitingForClientToken = new vscode.CancellationTokenSource();
            return new Promise((resolve, reject) => {
                this.getLanguageClientResolve = resolve;
                vscode.window
                    .showQuickPick(["Cancel"], { placeHolder: "Attach to PowerShell host process: Please wait, starting PowerShell..." }, this.waitingForClientToken.token)
                    .then((response) => {
                    if (response === "Cancel") {
                        this.clearWaitingToken();
                        reject();
                    }
                });
                // Cancel the loading prompt after 60 seconds
                setTimeout(() => {
                    if (this.waitingForClientToken) {
                        this.clearWaitingToken();
                        reject();
                        vscode.window.showErrorMessage("Attach to PowerShell host process: PowerShell session took too long to start.");
                    }
                }, 60000);
            });
        }
    }
    pickPSHostProcess() {
        return this.languageClient.sendRequest(exports.GetPSHostProcessesRequestType, null).then((hostProcesses) => {
            const items = [];
            for (const p in hostProcesses) {
                if (hostProcesses.hasOwnProperty(p)) {
                    let windowTitle = "";
                    if (hostProcesses[p].mainWindowTitle) {
                        windowTitle = `, Title: ${hostProcesses[p].mainWindowTitle}`;
                    }
                    items.push({
                        label: hostProcesses[p].processName,
                        description: `PID: ${hostProcesses[p].processId.toString()}${windowTitle}`,
                        pid: hostProcesses[p].processId,
                    });
                }
            }
            if (items.length === 0) {
                return Promise.reject("There are no PowerShell host processes to attach to.");
            }
            const options = {
                placeHolder: "Select a PowerShell host process to attach to",
                matchOnDescription: true,
                matchOnDetail: true,
            };
            return vscode.window.showQuickPick(items, options).then((item) => {
                // Return undefined when user presses Esc.
                // This prevents VSCode from opening launch.json in this case which happens if we return "".
                return item ? `${item.pid}` : undefined;
            });
        });
    }
    clearWaitingToken() {
        if (this.waitingForClientToken) {
            this.waitingForClientToken.dispose();
            this.waitingForClientToken = undefined;
        }
    }
}
exports.PickPSHostProcessFeature = PickPSHostProcessFeature;
//# sourceMappingURL=DebugSession.js.map