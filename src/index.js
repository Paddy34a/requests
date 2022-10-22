const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require("fs"); 

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow; 

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  mainWindow.on("closed", () => {
    app.quit(); 
  }) 

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
          label: "Quit Application", 
          role: "close"
        }
      ]
    }, 
    {
      label: "Edit", 
      submenu: [
        {
          label: "Undo", 
          role: "undo"
        }, 
        {
          label: "Redo", 
          role: "redo"
        }, 
        {
          label: "Copy", 
          role: "copy"
        }, 
        {
          label: "Paste", 
          role: "paste"
        }, 
        {
          label: "Cut", 
          role: "cut"
        }
      ]
    },
    {
      label: "View", 
      submenu: [
        {
          label: "Zoom In", 
          role: "zoomIn"
        }, 
        {
          label: "Zoom Out", 
          role: "zoomOut"
        }, 
        {
          label: "Reset Zoom", 
          role: "resetZoom"
        }
      ]
    }, 
    {
      label: "Developer", 
      submenu: [
        {
          label: "Reload", 
          role: "reload"
        },
        {
          label: "Force Reload", 
          role: "forceReload"
        },
        {
          label: "Toggle Developer Tools", 
          role: "toggleDevTools", 
        },
      ]
    }
  ])); 

  const appPath = app.getPath("userData"); 

  try {
    console.log("[requests] config initializer > starting scan...")
    const configDir = path.join(appPath, "config"); 

    if(fs.existsSync(configDir)) {
      console.log("[requests] config initializer > found config directory"); 
      for(const file of fs.readdirSync(configDir, { withFileTypes: true })) {
        if(file.name === "config.json") {
          console.log("[requests] config initializer > found config.json file"); 
          console.log("[requests] config initializer > scan complete.")
          return; 
        }
      }
      console.log("[requests] config initializer > couldn't find config.json file, initializing new file..."); 
      const configFilePath = path.join(configDir, "config.json"); 
      const jsonPayload = JSON.stringify(
        {
          firstLaunch: true
        }, 
        null, // these 2 params make the json pretty-printed
        2     // in order for much higher legibility
      ); 
      fs.writeFileSync(configFilePath, jsonPayload, "utf8"); 
      console.log("[requests] config initializer > successfully created empty config.json file");
      console.log("[requests] config initializer > scan complete."); 
    } else {
      console.log("[requests] config initializer > couldn't find config directory, initializing new config directory..."); 
      fs.mkdirSync(configDir); 
      console.log("[requests] config initializer > successfully created config directory"); 
      console.log("[requests] config initializer > initializing new config.json file..."); 
      const configFilePath = path.join(configDir, "config.json"); 
      const jsonPayload = JSON.stringify(
        {
          firstLaunch: true
        }, 
        null, // these 2 params make the json pretty-printed
        2     // in order for much higher legibility
      ); 
      fs.writeFileSync(configFilePath, jsonPayload, "utf8"); 
      console.log("[requests] config initializer > successfully created empty config.json file");
      console.log("[requests] config initializer > scan complete."); 
    }
    
  } catch (e) {
    console.error("[requests] config initializer > an unknown error occured whilst trying to fetch directories."); 
    console.error(e);
  }

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

// --- ipc data transfer --- 

ipcMain.on("gettingStarted", (event, payload) => {

  const gettingStartedWindow = new BrowserWindow({
    width: 900, 
    height: 800, 
    resizable: false,
    webPreferences: {
      devTools: false
    } 
  }); 

  gettingStartedWindow.loadFile(path.join(__dirname, "gettingStarted.html")); 
  gettingStartedWindow.setIcon(path.join(__dirname, "images/main_icon.png")); 
  gettingStartedWindow.setMenu(null); 

}); 

ipcMain.on("firstLaunchCheck", async (event, payload) => {
  const jsonResponse = await getConfigData(); 
  const res = jsonResponse.firstLaunch; 
  if(res !== undefined && res !== null) {
    await mainWindow.webContents.send("firstLaunchCheck", res);  
    if(res === true) {
      jsonResponse.firstLaunch = false; 
      const json = JSON.stringify(jsonResponse, null, 2); 
      const configFile = path.join(path.join(app.getPath("userData"), "config"), "config.json"); 
      if(fs.existsSync(configFile)){
        fs.writeFileSync(configFile, json, "utf8"); 
      }
    }
  } else {
    mainWindow.webContents.send("firstLaunchCheck", true);  
  }
})

// helper functions

const getConfigData = () => {
  const configFile = path.join(path.join(app.getPath("userData"), "config"), "config.json"); 
  if(fs.existsSync(configFile)) {
    return JSON.parse(fs.readFileSync(configFile)); 
  } else {
    return {};   
  }
}; 
