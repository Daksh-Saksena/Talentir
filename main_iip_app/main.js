const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = process.env.ELECTRON_DEV === "true" || process.env.NODE_ENV !== "production";
const createDatabase = require("./database");

let mainWindow;
let desktopApi;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1200,
    minHeight: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = isDev
    ? "http://localhost:3000/main_iip_app"
    : `file://${path.join(__dirname, "../out/main_iip_app/index.html")}`;

  mainWindow.loadURL(url);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpcHandlers(db) {
  ipcMain.handle("desktop-getStudents", () => db.getStudents());
  ipcMain.handle("desktop-saveStudentProfile", (_, profile) => db.saveStudentProfile(profile));
  ipcMain.handle("desktop-getAttendanceHistory", () => db.getAttendanceHistory());
  ipcMain.handle("desktop-recordAttendance", (_, record) => db.recordAttendance(record));
  ipcMain.handle("desktop-getAttentionMetrics", () => db.getAttentionMetrics());
  ipcMain.handle("desktop-recordAttention", (_, record) => db.recordAttention(record));
  ipcMain.handle("desktop-getInteractions", () => db.getInteractions());
  ipcMain.handle("desktop-recordInteraction", (_, record) => db.recordInteraction(record));
  ipcMain.handle("desktop-getSeatingPlans", () => db.getSeatingPlans());
  ipcMain.handle("desktop-saveSeatingPlan", (_, plan) => db.saveSeatingPlan(plan));
  ipcMain.handle("desktop-getEnv", (_, key) => process.env[key] || null);
}

app.whenReady().then(() => {
  const userDataPath = app.getPath("userData");
  desktopApi = createDatabase(userDataPath);
  registerIpcHandlers(desktopApi);
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
