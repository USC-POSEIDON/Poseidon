const electron = require('electron');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const spawn = require('child_process').spawn;
const axios = require('axios');

let mainWindow;
let splashScreen;
let tleFlaskProcess = null;

// on ready event for initializing the app
app.on('ready', function() {
    // Splash Screen setup
    splashScreen = new BrowserWindow({
        width: 1203,
        height: 835,
        transparent: true,
        frame: false,
        alwaysOnTop: false,
        focusable: false
    });
    splashScreen.loadURL(url.format({
        pathname: path.join(__dirname, './splash_screen/splash.html'), 
        protocol: 'file:',
        slashes: true
    }));

    // Main Window setup
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, './media_res/icon.png'),
        show: false, 
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false
        }
    });

    // ----------------- Start the TLE Flask server for deploy mode ----------------- //
    let pythonExecutable = path.join(__dirname, 'backend/dist', process.platform === "win32" ? "run.exe" : "run");
    if (app.isPackaged) {
        // Path for packaged app
        pythonExecutable = path.join(process.resourcesPath, '..', process.platform === "win32" ? 'backend/dist/run/run.exe' : 'backend/dist/run');
    } else {
        // Path for development
        pythonExecutable = path.join(__dirname, process.platform === "win32" ? 'backend/dist/run/run.exe' : 'backend/dist/run');
    }
    console.log("Python executable: ", pythonExecutable);
    tleFlaskProcess = spawn(pythonExecutable, { stdio: ['pipe', 'pipe', 'pipe'] });

    // ----------------- End of the TLE Flask server for deploy mode ----------------- //

    // ----------------- Start the TLE Flask server for development mode ----------------- //
    // const pythonCommand = process.platform === "win32" ? "python" : "python3";
    // tleFlaskProcess = spawn(pythonCommand, ['-m', 'tle_calculations.run']);

    // ----------------- End of the TLE Flask server for development mode ----------------- //

    // Function to delay execution
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    console.error(`TLEFlaskProcess PID: ${tleFlaskProcess.pid}`)

    // Every 6 hour TLE refresh
    const refreshTLE = async () => {
        try {
            console.log("Refreshing all TLEs");
            const response = await axios.post('http://127.0.0.1:5000/satellites/update');
        } catch(error){
            console.error("Celestrak API error")
        }
    };

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
                        console.log("before closing splashscreen")
                        splashScreen.close(); // Close the splash screen
                        console.log("before showing mainwindow")
                        mainWindow.show(); // Show the main window
                    });
                    
                    // Refresh all TLEs on app startup, before showing mainwindow
                    await refreshTLE();

                    // After server check, start the 6-hour interval
                    const interval = setInterval(refreshTLE, 6 * 60 * 60 * 1000);

                    // Quit the interval when the app is about to quit 
                    app.on('before-quit', () => {
                        clearInterval(interval);
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



    // ipc communication defination
    // Additional main window and app event handlers
    ipcMain.on('open-devtools', (event, arg) => {
        const webContents = event.sender;
        const window = BrowserWindow.fromWebContents(webContents);
        if (window) {
            window.webContents.openDevTools();
        }
    });

    ipcMain.on('save-commands', (event, commands) => {
        dialog.showSaveDialog({
            title: 'Save Commands',
            defaultPath: 'generated_commands.txt',
            filters: [{ name: 'Text Files', extensions: ['txt'] }]
        }).then(result => {
            if (!result.canceled && result.filePath) {
                fs.writeFile(result.filePath, commands.join('\n'), (err) => {
                    if (err) {
                        console.error('Error saving commands to file:', err);
                        event.reply('save-commands-response', { success: false, error: err });
                    } else {
                        console.log('Commands saved to file:', result.filePath);
                        event.reply('save-commands-response', { success: true, filePath: result.filePath });
                    }
                });
            } else {
                console.log('Save dialog canceled or no file path selected.');
                event.reply('save-commands-response', { success: false, error: 'Save dialog canceled or no file path selected.' });
            }
        }).catch(err => {
            console.error('Error showing save dialog:', err);
            event.reply('save-commands-response', { success: false, error: err });
        });
    });

    ipcMain.handle('save-file-dialog', async (event, fileName, fileData) => {
        const mainWindow = BrowserWindow.getFocusedWindow();
        const csvData = fileData;
    
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Save File',
            defaultPath: fileName,
            filters: [
                { name: 'CSV Files', extensions: ['csv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
    
        if (filePath) {
            // Directly write the CSV data to the selected file path
            await fs.writeFile(filePath, csvData, 'utf8');
            return filePath; // Return the saved file path to the renderer
        } else {
            // User cancelled the save dialog
            throw new Error('File save cancelled');
        }
    });
    

    // Event handler for when the main window is closed
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
