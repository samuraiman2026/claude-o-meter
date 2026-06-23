const { app, BrowserWindow, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let expressProcess = null;
let mainWindow = null;
let tray = null;

function createWindow() {
    // Start Express server in the background
    expressProcess = exec('node server.js', { cwd: __dirname }, (err, stdout, stderr) => {
        if (err) console.error('Express server error:', err);
    });

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Create a frameless, transparent window
    mainWindow = new BrowserWindow({
        width: 400,
        height: 750,
        x: width - 420, // Position on the right side of the screen
        y: 50,
        transparent: true,
        frame: false,
        hasShadow: false,
        alwaysOnTop: false, // Allow it to go behind other windows
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Make the window ignore mouse events so it doesn't block the desktop
    // mainWindow.setIgnoreMouseEvents(true);

    // Load the local server
    mainWindow.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {
    // Hide from the Dock
    if (app.dock) app.dock.hide();

    createWindow();

    // Create Tray icon
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);
    tray.setTitle('💧 Claude Vat');
    
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Show/Hide Widget', 
            click: () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                }
            } 
        },
        {
            label: 'Reset Position',
            click: () => {
                const primaryDisplay = screen.getPrimaryDisplay();
                const { width } = primaryDisplay.workAreaSize;
                mainWindow.setPosition(width - 420, 50);
            }
        },
        { type: 'separator' },
        { 
            label: 'Quit', 
            click: () => {
                app.quit();
            } 
        }
    ]);
    
    tray.setToolTip('Claude Usage Vat');
    tray.setContextMenu(contextMenu);

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
    if (expressProcess) {
        expressProcess.kill();
    }
});
