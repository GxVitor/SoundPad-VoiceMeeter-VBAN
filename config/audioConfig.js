const { readJsonFile, writeJsonFile } = require('./jsonStore');

function loadAudioVolumes() {
  return readJsonFile('volumes.json', {});
}

function saveAudioVolume(fileName, volume) {
  const vols = loadAudioVolumes();
  vols[fileName] = parseFloat(volume);
  writeJsonFile('volumes.json', vols);
}

function deleteAudioVolume(fileName) {
  const vols = loadAudioVolumes();
  delete vols[fileName];
  writeJsonFile('volumes.json', vols);
}

function loadFavorites() {
  return readJsonFile('favorites.json', []);
}

function toggleFavorite(fileName) {
  let favorites = loadFavorites();
  if (favorites.includes(fileName)) {
    favorites = favorites.filter(f => f !== fileName);
  } else {
    favorites.push(fileName);
  }
  writeJsonFile('favorites.json', favorites);
  return favorites;
}

function deleteFavorite(fileName) {
  let favorites = loadFavorites();
  favorites = favorites.filter(f => f !== fileName);
  writeJsonFile('favorites.json', favorites);
}

function loadCustomNames() {
  return readJsonFile('custom_names.json', {});
}

function saveCustomName(fileName, newCustomName) {
  const customNames = loadCustomNames();
  if (newCustomName && newCustomName.trim() !== '') {
    customNames[fileName] = newCustomName.trim();
  } else {
    delete customNames[fileName];
  }
  writeJsonFile('custom_names.json', customNames);
}

function deleteCustomName(fileName) {
  const customNames = loadCustomNames();
  delete customNames[fileName];
  writeJsonFile('custom_names.json', customNames);
}

module.exports = {
  loadAudioVolumes,
  saveAudioVolume,
  deleteAudioVolume,
  loadFavorites,
  toggleFavorite,
  deleteFavorite,
  loadCustomNames,
  saveCustomName,
  deleteCustomName
};