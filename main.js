// Modules to control application life and create native browser window
const DEBUG = false;
const electron = require('electron')
const { app, BrowserWindow, ipcMain } = electron
const log = require('electron-log');
const { autoUpdater } = require("electron-updater");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, secondWindow

function createWindowExternal () {

  let displays = electron.screen.getAllDisplays()
  let externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })

  if (externalDisplay) {
    secondWindow = new BrowserWindow({
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y,
      width: externalDisplay.bounds.width,
      height: externalDisplay.bounds.height,
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#000000',
      fullscreen: true,
      webPreferences: {
        nodeIntegration: true
      }
    })
    if (DEBUG === true) secondWindow.webContents.openDevTools()
    secondWindow.loadFile('secondary.html')
    secondWindow.on('closed', function () {
      secondWindow = null
    })

    ipcMain.on('clear-view', (event, arg) => {

      if (secondWindow === null) {

        createWindowExternal();

      }

      secondWindow.webContents.send('clear-view', arg);

      if (secondWindow.isMinimized()) {
        secondWindow.restore();
      }

    });

    ipcMain.on('select-file', (event, file) => {

      if (secondWindow === null) {

        createWindowExternal();

      }
      
      secondWindow.webContents.send('select-file', file);

      if (secondWindow.isMinimized()) {
        secondWindow.restore();
      }

      if (!secondWindow.isVisible()) {
        secondWindow.showInactive();
      }

    });

    
    ipcMain.on('change-zoom', (event, zoom) => {

      if (secondWindow === null) {

        createWindowExternal();

      }
      
      secondWindow.webContents.send('change-zoom', zoom);

      if (secondWindow.isMinimized()) {
        secondWindow.restore();
      }

    });

    

    return secondWindow;

  } else {

    return null;

  }

}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000, 
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.setMenu(null)

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  if (DEBUG === true) mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    if (secondWindow) secondWindow.close();
    mainWindow = null
  })

  mainWindow.on('minimize', function () {

    if (secondWindow) {
      secondWindow.minimize();
    }

  })

  createWindowExternal();

  ipcMain.on('change-view', (event, data) => {

    mainWindow.webContents.send('change-view', data);

  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){

  createWindow();
  autoUpdater.checkForUpdatesAndNotify();

})

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

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('message', text);
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});