const { readJsonFile, writeJsonFile } = require('./jsonStore');

const VBAN_DEFAULT_PORT = 6980;

function loadSavedConnections() {
  const defaultConnections = [
    { id: 'conn_default', name: 'VoiceMeeter Principal', ip: '192.168.15.3', port: VBAN_DEFAULT_PORT, streamName: 'Painel', connected: false }
  ];
  return readJsonFile('connections.json', defaultConnections);
}

function saveConnections(conns) {
  writeJsonFile('connections.json', conns);
}

function addConnection(newConn) {
  const connections = loadSavedConnections();
  const connObj = {
    id: 'conn_' + Date.now(),
    name: newConn.name || 'Nova Conexão',
    ip: newConn.ip.trim(),
    port: parseInt(newConn.port) || VBAN_DEFAULT_PORT,
    streamName: newConn.streamName.trim() || 'Painel',
    connected: false
  };
  connections.push(connObj);
  saveConnections(connections);
  return connObj;
}

function updateConnection(updatedConn) {
  const connections = loadSavedConnections();
  const index = connections.findIndex(c => c.id === updatedConn.id);
  if (index !== -1) {
    connections[index] = {
      ...connections[index],
      name: updatedConn.name || 'Conexão sem nome',
      ip: updatedConn.ip.trim(),
      port: parseInt(updatedConn.port) || VBAN_DEFAULT_PORT,
      streamName: updatedConn.streamName.trim() || 'Painel'
    };
    saveConnections(connections);
    return true;
  }
  return false;
}

function deleteConnectionConfig(connId) {
  let connections = loadSavedConnections();
  connections = connections.filter(c => c.id !== connId);
  saveConnections(connections);
}

module.exports = {
  loadSavedConnections,
  saveConnections,
  addConnection,
  updateConnection,
  deleteConnectionConfig
};