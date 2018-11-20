// Modules to control application life and create native browser window
const DEBUG = false;
const electron = require('electron')
const { app, BrowserWindow, ipcMain } = electron

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
      fullscreen: true
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
    width: 800, 
    height: 600
  })

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
