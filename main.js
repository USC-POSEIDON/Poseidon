const electron = require('electron');
const url = require('url');
const path = require('path');
const { app, BrowserWindow, ipcMain } = electron;
const spawn = require('child_process').spawn;

let mainWindow;
let tleFlaskProcess = null; // Variable to hold the Flask process

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false
        }
    });

    const pythonCommand = process.platform === "win32" ? "py" : "python3.10";
    tleFlaskProcess = spawn(pythonCommand, ['-m', 'tle_calculations.run']);

    tleFlaskProcess.stdout.on('data', function(data) {
        console.log("TLE data: ", data.toString('utf8'));
    });

    tleFlaskProcess.stderr.on('data', (data) => {
        console.error(`TLE stderr: ${data}`); // when error
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    ipcMain.on('open-devtools', (event, arg) => {
        const webContents = event.sender;
        const window = BrowserWindow.fromWebContents(webContents);
        if (window) {
            window.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});

app.on('window-all-closed', () => {
    app.quit(); 
});

app.on('before-quit', () => {
    if (tleFlaskProcess !== null) {
        tleFlaskProcess.kill('SIGINT'); 
    }
});
