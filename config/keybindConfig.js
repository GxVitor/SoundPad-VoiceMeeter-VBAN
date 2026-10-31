const { readJsonFile, writeJsonFile } = require('./jsonStore');

function loadKeybinds() {
  return readJsonFile('keybinds.json', {});
}

function saveKeybind(fileName, shortcut) {
  const keybinds = loadKeybinds();
  if (shortcut && shortcut.trim() !== '') {
    keybinds[fileName] = shortcut.trim();
  } else {
    delete keybinds[fileName];
  }
  writeJsonFile('keybinds.json', keybinds);
}

function deleteKeybind(fileName) {
  const keybinds = loadKeybinds();
  delete keybinds[fileName];
  writeJsonFile('keybinds.json', keybinds);
}

function formatToElectronAccelerator(shortcut) {
  if (!shortcut) return '';
  return shortcut
    .replace(/ArrowRight/g, 'Right')
    .replace(/ArrowLeft/g, 'Left')
    .replace(/ArrowUp/g, 'Up')
    .replace(/ArrowDown/g, 'Down')
    .replace(/Spacebar/g, 'Space')
    .replace(/Esc/g, 'Escape');
}

module.exports = {
  loadKeybinds,
  saveKeybind,
  deleteKeybind,
  formatToElectronAccelerator
};