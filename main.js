const electron = require('electron');
const url = require('url');
const path = require('path');
const { app, BrowserWindow, ipcMain } = electron;
const spawn = require('child_process').spawn;
const axios = require('axios');

let mainWindow;
let splashScreen; // Splash screen window
let tleFlaskProcess = null;

app.on('ready', function() {
    // Splash Screen setup
    splashScreen = new BrowserWindow({
        width: 400,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true
    });
    splashScreen.loadURL(url.format({
        pathname: path.join(__dirname, 'splash.html'), 
        protocol: 'file:',
        slashes: true
    }));

    // Main Window setup
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false, 
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false
        }
    });

    // ----------------- Start the TLE Flask server for deploy mode ----------------- //
    // let pythonExecutable = path.join(__dirname, 'backend/dist', process.platform === "win32" ? "run.exe" : "run");
    // if (app.isPackaged) {
    //     // Path for packaged app
    //     pythonExecutable = path.join(process.resourcesPath, '..', 'backend/dist', process.platform === "win32" ? "run.exe" : "run");
    // } else {
    //     // Path for development
    //     pythonExecutable = path.join(__dirname, 'backend/dist', process.platform === "win32" ? "run.exe" : "run");
    // }
    // console.log("Python executable: ", pythonExecutable);
    // tleFlaskProcess = spawn(pythonExecutable, { stdio: ['pipe', 'pipe', 'pipe'] });

    // ----------------- End of the TLE Flask server for deploy mode ----------------- //

    // ----------------- Start the TLE Flask server for development mode ----------------- //
    const pythonCommand = process.platform === "win32" ? "py" : "python3";
    tleFlaskProcess = spawn(pythonCommand, ['-m', 'tle_calculations.run']);

    // ----------------- End of the TLE Flask server for development mode ----------------- //

    // Function to delay execution
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Function to check if the server is up
    const checkServerIsUp = async (attempts = 100, interval = 1000) => {
        for (let i = 0; i < attempts; i++) {
            try {
                const response = await axios.get('http://127.0.0.1:5000/health');
                if (response.status === 200) {
                    console.log('Server is up and running');

                    // Server is up, now safe to attach listeners
                    attachProcessListeners();

                    // Load the main window content
                    mainWindow.loadURL(url.format({
                        pathname: path.join(__dirname, 'mainWindow.html'),
                        protocol: 'file:',
                        slashes: true
                    }));
                    
                    // Show the main window only when it is ready to show
                    mainWindow.once('ready-to-show', () => {
                        splashScreen.close(); // Close the splash screen
                        mainWindow.show(); // Show the main window
                    });
                    
                    return;
                }
            } catch (error) {
                console.error(`Attempt ${i + 1}: Server is not up yet.`, error.message);
                await delay(interval);
            }
        }
        console.error('Server failed to start after multiple attempts.');
    };

    // Attach listeners to the process
    const attachProcessListeners = () => {
        tleFlaskProcess.stdout.on('data', function(data) {
            console.log("TLE data: ", data.toString('utf8'));
        });

        tleFlaskProcess.stderr.on('data', (data) => {
            console.error(`TLE stderr: ${data}`);
        });
    };

    // Check if the server is up before proceeding
    checkServerIsUp();

    // Additional main window and app event handlers
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

    app.on('window-all-closed', () => {
        app.quit();
    });

    app.on('before-quit', () => {
        if (tleFlaskProcess !== null) {
            tleFlaskProcess.kill('SIGINT');
        }
    });
});
