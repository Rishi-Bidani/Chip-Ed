'static\css\home\home.css'
const electron = require("electron");
const url = require("url");
const path = require("path");

const { app, BrowserWindow, Menu, ipcMain, webContents } = electron;


let mainWindow;

app.on("ready", function () {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true, // for allowing require in html file
    },
  });
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "templates/home.html"), // earlier mainWindow
      protocol: "file",
      slashes: true,
    })
  );
  mainWindow.maximize();
  // add custom  Menu here
});
