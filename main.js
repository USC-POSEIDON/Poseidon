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

    const pythonExecutable = path.join(__dirname, 'backend/dist', process.platform === "win32" ? "run.exe" : "run");
    console.log("Python executable: ", pythonExecutable);
    
    // Spawn the Python process
    tleFlaskProcess = spawn(pythonExecutable);

    // Listen to the stdout and stderr of the spawned Python process
    tleFlaskProcess.stdout.on('data', function(data) {
        console.log("TLE data: ", data.toString());
    });

    tleFlaskProcess.stderr.on('data', (data) => {
        console.error(`TLE stderr: ${data}`);
    });

    tleFlaskProcess.on('error', (err) => {
        console.error('Failed to start subprocess.', err);
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

// This is incorrect - you should not attach these event listeners to the global process object.
// Removed these listeners.

app.on('window-all-closed', () => {
    // Ensure all windows are closed before quitting the app
    app.quit();
});

app.on('before-quit', () => {
    // Gracefully terminate your Python process before the app quits
    if (tleFlaskProcess !== null) {
        tleFlaskProcess.kill('SIGINT');
    }
});
