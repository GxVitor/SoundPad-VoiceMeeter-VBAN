const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Módulos internos
const audioConfig = require('./config/audioConfig');
const keybindConfig = require('./config/keybindConfig');
const connectionConfig = require('./config/connectionConfig');
const vbanEngine = require('./src/vban/vbanEngine');

let mainWindow;

// Define o diretório de áudios correto para DEV e para o EXE instalado (userData)
const audiosDir = app.isPackaged 
  ? path.join(app.getPath('userData'), 'audios')
  : path.join(__dirname, 'audios');

if (!fs.existsSync(audiosDir)) {
  fs.mkdirSync(audiosDir, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 900,
    title: 'GX Soundboard - VBAN Multi-Stream',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');
}

function notifyAudioStatus(status) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('audio-status-changed', status);
  }
}

function registerAllGlobalShortcuts() {
  globalShortcut.unregisterAll();
  const keybinds = keybindConfig.loadKeybinds();

  for (const [fileName, rawShortcut] of Object.entries(keybinds)) {
    if (!rawShortcut) continue;

    const shortcut = keybindConfig.formatToElectronAccelerator(rawShortcut);

    try {
      const registered = globalShortcut.register(shortcut, () => {
        console.log(`⚡ Atalho disparado no SO: [${shortcut}] -> Arquivo: ${fileName}`);
        const audioPath = path.join(audiosDir, fileName);

        if (fs.existsSync(audioPath)) {
          vbanEngine.triggerVbanSound(audioPath, fileName, notifyAudioStatus);
        }
      });

      if (!registered) {
        console.warn(`Aviso: O SO não permitiu registrar o atalho: ${shortcut}`);
      }
    } catch (err) {
      console.error(`Erro ao registrar atalho [${shortcut}]:`, err);
    }
  }
}

app.whenReady().then(() => {
  createWindow();
  registerAllGlobalShortcuts();
});

// IPC - Áudio Transmissão
ipcMain.on('play-vban-sound', (event, { audioPath, fileName }) => {
  vbanEngine.triggerVbanSound(audioPath, fileName, notifyAudioStatus);
});

ipcMain.on('stop-vban-sound', () => {
  vbanEngine.stopCurrentAudio(notifyAudioStatus);
});

// IPC - Atalhos e Volume
ipcMain.handle('set-audio-keybind', async (event, { fileName, shortcut }) => {
  keybindConfig.saveKeybind(fileName, shortcut);
  registerAllGlobalShortcuts();
  return true;
});

ipcMain.handle('set-audio-volume', async (event, { fileName, volume }) => {
  audioConfig.saveAudioVolume(fileName, volume);
  return true;
});

// IPC - Conexões VBAN
ipcMain.handle('get-connections', async () => {
  const saved = connectionConfig.loadSavedConnections();
  const activeMap = vbanEngine.getActiveConnectionsMap();
  return saved.map(conn => ({
    ...conn,
    connected: !!activeMap[conn.id]
  }));
});

ipcMain.handle('add-connection', async (event, newConn) => {
  return connectionConfig.addConnection(newConn);
});

ipcMain.handle('update-connection', async (event, updatedConn) => {
  vbanEngine.removeActiveConnection(updatedConn.id);
  return connectionConfig.updateConnection(updatedConn);
});

ipcMain.handle('delete-connection', async (event, connId) => {
  vbanEngine.removeActiveConnection(connId);
  connectionConfig.deleteConnectionConfig(connId);
  return true;
});

ipcMain.handle('toggle-connection-status', async (event, { id, connect }) => {
  const connections = connectionConfig.loadSavedConnections();
  const conn = connections.find(c => c.id === id);
  if (!conn) return false;

  return vbanEngine.toggleConnection(conn, connect);
});

// IPC - Gerenciamento de Arquivos de Áudio
ipcMain.handle('toggle-favorite', async (event, fileName) => {
  audioConfig.toggleFavorite(fileName);
  return true;
});

ipcMain.handle('rename-audio', async (event, { fileName, newCustomName }) => {
  audioConfig.saveCustomName(fileName, newCustomName);
  return true;
});

ipcMain.handle('delete-audio', async (event, fileName) => {
  try {
    const filePath = path.join(audiosDir, fileName);

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    audioConfig.deleteCustomName(fileName);
    audioConfig.deleteFavorite(fileName);
    audioConfig.deleteAudioVolume(fileName);
    keybindConfig.deleteKeybind(fileName);
    
    registerAllGlobalShortcuts();
    return true;
  } catch (err) {
    console.error('Erro ao excluir áudio:', err);
    return false;
  }
});

// Download de Áudio Web
function downloadFile(fileUrl, destPath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(fileUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    client.get(fileUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => { fileStream.close(); resolve(true); });
      fileStream.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
    }).on('error', reject);
  });
}

function fetchHtml(urlStr) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    client.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

ipcMain.handle('download-web-audio', async (event, inputUrl) => {
  try {
    let directAudioUrl = inputUrl.trim();
    let suggestedName = 'Web_Audio_' + Date.now();

    if (directAudioUrl.includes('myinstants.com')) {
      const html = await fetchHtml(directAudioUrl);
      const match = html.match(/https?:\/\/[^"']+\.mp3/i) || html.match(/\/media\/sounds\/[^"']+\.mp3/i);

      if (match) {
        directAudioUrl = match[0];
        if (directAudioUrl.startsWith('/')) directAudioUrl = 'https://www.myinstants.com' + directAudioUrl;
      }

      const urlMatch = inputUrl.match(/\/instant\/([^\/\?]+)/);
      if (urlMatch && urlMatch[1]) {
        suggestedName = decodeURIComponent(urlMatch[1]).replace(/[-_]/g, ' ');
      }
    }

    const fileName = `web_${Date.now()}.mp3`;
    const destPath = path.join(audiosDir, fileName);
    await downloadFile(directAudioUrl, destPath);

    audioConfig.saveCustomName(fileName, suggestedName);
    return true;
  } catch (err) {
    console.error('Erro no download:', err);
    return false;
  }
});

ipcMain.handle('select-audios', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecionar Áudios',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Arquivos de Áudio', extensions: ['mp3', 'wav', 'ogg'] }]
  });

  if (result.canceled || result.filePaths.length === 0) return false;

  for (const filePath of result.filePaths) {
    const fileName = path.basename(filePath);
    const destPath = path.join(audiosDir, fileName);
    fs.copyFileSync(filePath, destPath);
  }
  return true;
});

// Listar áudios na interface (Único handler registrado)
ipcMain.handle('get-audios', async () => {
  if (!fs.existsSync(audiosDir)) return [];

  const files = fs.readdirSync(audiosDir);
  const audioFiles = files.filter(file => /\.(mp3|wav|ogg)$/i.test(file));
  const customNames = audioConfig.loadCustomNames();
  const favorites = audioConfig.loadFavorites();
  const volumes = audioConfig.loadAudioVolumes();
  const keybinds = keybindConfig.loadKeybinds();
  const { isPlayingAudio, currentPlayingFile } = vbanEngine.getPlaybackState();

  return audioFiles.map(file => ({
    fileName: file,
    displayName: customNames[file] || path.parse(file).name,
    isWeb: file.startsWith('web_'),
    isFavorite: favorites.includes(file),
    volume: volumes[file] !== undefined ? volumes[file] : 1.0,
    keybind: keybinds[file] || null,
    isPlaying: isPlayingAudio && currentPlayingFile === file,
    path: path.join(audiosDir, file)
  }));
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  vbanEngine.closeUdpClient();
  vbanEngine.stopCurrentAudio(null);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});