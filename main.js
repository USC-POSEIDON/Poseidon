const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, BrowserWindow, Menu } = electron;

let mainWindow;

app.on('ready', function(){
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

    var tle_flask = require('child_process').spawn('py', ['-m', 'tle_calculations.run']);
    tle_flask.stdout.on('data', function (data) {
        console.log("TLE data: ", data.toString('utf8'));
    });
    tle_flask.stderr.on('data', (data) => {
        console.log(`TLE stderr: ${data}`); // when error
    });

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.on('closed', function(){
        const { exec } = require('child_process');
        exec('taskkill /f /t /im celestrak_calls.exe', (err, stdout, stderr) => {
        if (err) {
            console.log(err)
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        });
        app.quit();
    });
});
