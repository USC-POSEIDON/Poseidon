const elecron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, Menu} = elecron;

let mainWindow;

// Listen for app to be ready
app.on('ready', function(){
    // Create new window
    mainWindow = new BrowserWindow({});
    // Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol:'file',
        slashes: true
    }));
    // Quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });

    // // Build menu from template
    // const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // // Insert menu
    // Menu.setApplicationMenu(mainMenu);
     }
);