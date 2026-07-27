const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getStudents: () => ipcRenderer.invoke("desktop-getStudents"),
  saveStudentProfile: (profile) => ipcRenderer.invoke("desktop-saveStudentProfile", profile),
  getAttendanceHistory: () => ipcRenderer.invoke("desktop-getAttendanceHistory"),
  recordAttendance: (record) => ipcRenderer.invoke("desktop-recordAttendance", record),
  getAttentionMetrics: () => ipcRenderer.invoke("desktop-getAttentionMetrics"),
  recordAttention: (record) => ipcRenderer.invoke("desktop-recordAttention", record),
  getInteractions: () => ipcRenderer.invoke("desktop-getInteractions"),
  recordInteraction: (record) => ipcRenderer.invoke("desktop-recordInteraction", record),
  getSeatingPlans: () => ipcRenderer.invoke("desktop-getSeatingPlans"),
  saveSeatingPlan: (plan) => ipcRenderer.invoke("desktop-saveSeatingPlan", plan),
  getEnv: (key) => ipcRenderer.invoke("desktop-getEnv", key),
});
