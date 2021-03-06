﻿const {performance} = require('perf_hooks');
var sizeof = require('object-sizeof');
var start_inittime = performance.now();
const {app, BrowserWindow, ipcMain} = require('electron');
const electron = require('electron');
const Config = require('electron-config');
const config = new Config();
const {autoUpdater} = require("electron-updater");
var nodeConsole = require('console');
var myConsole = new nodeConsole.Console(process.stdout, process.stderr);
var projectJson = {}
var dialog = app.dialog;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow
var presentationWindow
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function storeStorrageNode(node, st) {
    global[node] = st
}

function getStorrageNode(node) {
    return global[node];
}

function createWindow() {
    autoUpdater.autoDownload = false
    const data = {
        'provider': 'github',
        'owner':    'ItsCoding',
        'repo':     'DSAUtilities'
    };
    autoUpdater.setFeedURL(data);
    let displays = electron.screen.getAllDisplays()
    var fullscreen = false;
    let externalDisplay = null;
    myConsole.log("Main.js ==> createWindow called")
    storeStorrageNode("temp_foundDisplays", displays);
    if (config.get("screen_externalDisplay") !== undefined) {
        myConsole.log("Main.js ==> Display config found");
        fullscreen = config.get("screen_fullscreen");
        externalDisplay = config.get("screen_externalDisplay");
    } else {
        myConsole.log("Main.js ==> No Display config found: Setup");
        externalDisplay = displays.find((display) => {
            if (display.bounds.x !== 0 && display.bounds.y !== 0) {
                fullscreen = true;
                myConsole.log("Display Found: " + display.bounds.x)
            }
            return display.bounds.x !== 0 && display.bounds.y !== 0
        })
        config.set("screen_fullscreen", fullscreen);
        //if (fullscreen) {
        myConsole.log(externalDisplay);
        config.set("screen_externalDisplay", externalDisplay);
        //}
    }
    myConsole.log("Main.js ==> Display init Finished")
    storeStorrageNode("screen_externalDisplay", externalDisplay);
    storeStorrageNode("screen_fullscreen", fullscreen);
    myConsole.log("Main.js ==> Setup IPC listeners")
    ipcMain.on('maxi_main', (event, arg) => {
        mainWindow.setResizable(true)
        mainWindow.maximize();
    });

    ipcMain.on("update", (event, args) => {
        autoUpdater.downloadUpdate();
    });

    autoUpdater.on('checking-for-update', () => {
        myConsole.log('Updater => Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
        mainWindow.webContents.send('updater', {case: "check", update_available: true,info: info});
        myConsole.log(info);
    });
    autoUpdater.on('update-not-available', (info) => {
        myConsole.log("No Update Available");
        mainWindow.webContents.send('updater', {case: "check", update_available: false});
    });
    autoUpdater.on('error', (err) => {
        myConsole.log("Error in Updater:");
        myConsole.log(err);
        mainWindow.webContents.send('updater', {case: "check", update_available: false});
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        myConsole.log(log_message);
        mainWindow.webContents.send('updater', {case: "progress", msg: log_message,obj: progressObj});
    });

    autoUpdater.on('update-downloaded', (info) => {
        myConsole.log("Download completed");
        autoUpdater.quitAndInstall();
    });

    ipcMain.on('global', (event, arg) => {
        /***
         *
         * Method means Sending/Recieving
         * 1: Store value in Global
         *      Requires Json Object with
         *
         *      {prop: "" , value: {}}
         *
         * 2: Get value by objectPropery .variable , and awnsers with the requested object
         *      Requires Json Object with
         *
         *      {prop: ""}
         */
        myConsole.log("IPC Request Recieved ==> " + arg.prop);
        if (arg.method == 1) {
            myConsole.log("ÍPC <=STORE== " + sizeof(arg.value) + "B")
            global[arg.prop] = arg.value;
            if(arg.prop === "screen_externalDisplay" || arg.prop === "screen_fullscreen" ){
              config.set(arg.prop, arg.value);
              myConsole.log("CONFIG <== " + arg.prop)
            }
            event.returnValue = true
        } else if (arg.method == 2) {
            myConsole.log("ÍPC ==GET=> " + sizeof(global[arg.prop]) + "B")
            event.returnValue = global[arg.prop]
        }
    })
    if (fullscreen) {
        presentationWindow = new BrowserWindow({
            width: 1920,
            height: 1000,
            x: externalDisplay.bounds.x,
            y: externalDisplay.bounds.y,
            globals: {id: 2},
            fullscreen: fullscreen
        })
    } else {
        /**presentationWindow = new BrowserWindow({
            width: 1920,
            height: 1000,
            x: 0,
            y: 0,
            globals: {id: 2},
            fullscreen: fullscreen
        }) **/
        myConsole.log("Main.js ==> No Fullscreen Parameter , maybe there is no second monitor")
    }

    if(typeof presentationWindow != "undefined" ){
        presentationWindow.maximize()
        presentationWindow.setMenu(null)
        presentationWindow.loadFile('resources/presentation/index.html')
        presentationWindow.on('closed', function () {
            presentationWindow = null
        })
    }


    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 850,
        height: 300,
        globals: {id: 1},
        frame: false,
        webPreferences: {nodeIntegration: true, devTools: true, enableRemoteModule: true}
    })
    //mainWindow.setMenu(null);
    mainWindow.loadFile('resources/loaderPres.html')
    mainWindow.setResizable(false)
    mainWindow.on('closed', function () {
        presentationWindow.close();
        presentationWindow = null;
        mainWindow = null
    })
    var end_inittime = performance.now();
    autoUpdater.checkForUpdatesAndNotify();
    myConsole.log("Main.js ==> Init took: " + (end_inittime - start_inittime) + ' ms.')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
