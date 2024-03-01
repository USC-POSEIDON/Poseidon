const electron = require('electron');
const url = require('url');
const path = require('path');
const { app, BrowserWindow, ipcMain } = electron;
const spawn = require('child_process').spawn;

let mainWindow;
let tleFlaskProcess = null; 

function checkBackendReadiness() {
    return new Promise((resolve, reject) => {
        const maxAttempts = 20;
        let attempts = 0;

        const tryConnect = () => {
            fetch('http://127.0.0.1:8000/health') // Adjust the port and endpoint as necessary
                .then(response => {
                    if (response.ok) { // Checks if the response status code is 2xx
                        console.log("Backend is ready.");
                        resolve();
                    } else {
                        throw new Error('Backend not ready');
                    }
                })
                .catch(error => {
                    if (attempts < maxAttempts) {
                        console.log(`Waiting for backend... attempt ${attempts}`);
                        setTimeout(tryConnect, 1000); // Retry every second
                    } else {
                        console.error("Backend failed to become ready in time.");
                        reject(new Error('Backend failed to become ready in time.'));
                    }
                });
        };

        tryConnect();
    });
}


app.on('ready', async function() {
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

    // production mode only
    // const pythonExecutable = path.join(__dirname, 'backend/dist', process.platform === "win32" ? "run.exe" : "run");
    // console.log("Python executable: ", pythonExecutable);
    
    // // Spawn the Python process
    // tleFlaskProcess = spawn(pythonExecutable);

    const pythonCommand = process.platform === "win32" ? "py" : "python3.10";
    tleFlaskProcess = spawn(pythonCommand, ['-m', 'tle_calculations.run']);

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

    // Wait for the backend to be ready
    try {
        await checkBackendReadiness();
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'mainWindow.html'),
            protocol: 'file:',
            slashes: true
        }));
    } catch (error) {
        console.error("Backend readiness check failed:", error.message);
        app.quit(); // Quit the app if the backend isn't ready in time
    }
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('before-quit', () => {
    if (tleFlaskProcess !== null) {
        tleFlaskProcess.kill('SIGINT');
    }
});
