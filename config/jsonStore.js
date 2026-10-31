const path = require('path');
const fs = require('fs');

function getConfigPath(filename) {
  let configDir;

  try {
    // Tenta pegar o caminho do AppData via Electron (Main ou Renderer process)
    const { app } = require('electron');
    const electronApp = app || require('@electron/remote').app;
    configDir = path.join(electronApp.getPath('userData'), 'config');
  } catch (e) {
    // Fallback caso seja chamado fora do ambiente Electron
    configDir = path.join(__dirname);
  }

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  return path.join(configDir, filename);
}

function readJsonFile(filename, defaultValue) {
  const fp = getConfigPath(filename);
  if (fs.existsSync(fp)) {
    try {
      return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}

function writeJsonFile(filename, data) {
  fs.writeFileSync(getConfigPath(filename), JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  readJsonFile,
  writeJsonFile
};