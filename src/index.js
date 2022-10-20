const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require("fs"); 

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setIcon(path.join(__dirname, "images/main_icon.png"));  
  mainWindow.setMenu(Menu.buildFromTemplate([
    {
      label: "File", 
      submenu: [
        {
          label: "Open Config Folder", 
          click: () => { require("child_process").exec(`start "" "${path.join(app.getPath("userData"), "config")}"`); }
        },
        {
          label: "Quit", 
          role: "close"
        }
      ]
    }, 
    {
      label: "Developer", 
      submenu: [
        {
          label: "Toggle Developer Tools", 
          role: "toggleDevTools", 
        },
      ]
    }
  ])); 

  const appPath = app.getPath("userData"); 
  try {

    const configDir = path.join(appPath, "config"); 

    if(fs.existsSync(configDir)) {

      console.log("[requests] found config directory"); 

    } else {

      console.log("[requests] could not find config directory, initializing new config directory..."); 
      fs.mkdirSync(configDir); 
      console.log("[requests] successfully created dir"); 

    }
    
  } catch (e) {
    console.error("[requests] an unknown error occured whilst trying to fetch directories."); 
  }

  //mainWindow.webContents.openDevTools();
};

app.on('ready', () => {
  createWindow(); 
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
