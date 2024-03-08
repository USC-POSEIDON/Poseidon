const electron = require('electron');
const url = require('url');
const path = require('path');
const { app, BrowserWindow, ipcMain } = electron;
const spawn = require('child_process').spawn;
const axios = require('axios');

let mainWindow;
let tleFlaskProcess = null;

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

    // const pythonExecutable = path.join(__dirname, 'backend/dist', process.platform === "win32" ? "run.exe" : "run");
    // console.log("Python executable: ", pythonExecutable);
    
    // tleFlaskProcess = spawn(pythonExecutable);


    const pythonCommand = process.platform === "win32" ? "py" : "python3"; //change your path here to env where you installed the tle package
    tleFlaskProcess = spawn(pythonCommand, ['-m', 'tle_calculations.run']);

    tleFlaskProcess.stdout.on('data', function(data) {
        console.log("TLE data: ", data.toString('utf8'));
    });

    tleFlaskProcess.stderr.on('data', (data) => {
        console.error(`TLE stderr: ${data}`);
    });

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const checkServerIsUp = async (attempts = 5, interval = 1000) => {
        for (let i = 0; i < attempts; i++) {
            try {
                const response = await axios.get('http://127.0.0.1:5000/health');
                if (response.status === 200) {
                    console.log('Server is up and running');
                    attempts = i;
                    mainWindow.loadURL(url.format({
                        pathname: path.join(__dirname, 'mainWindow.html'),
                        protocol: 'file:',
                        slashes: true
                    }));
                    return;
                }
            } catch (error) {
                console.error(`Attempt ${i + 1}: Server is not up yet.`, error.message);
                await delay(interval);
            }
        }
        console.error('Server failed to start after multiple attempts.');
    };

    checkServerIsUp();

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
