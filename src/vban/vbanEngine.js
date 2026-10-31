const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const { loadAudioVolumes } = require('../../config/audioConfig');

const udpClient = dgram.createSocket('udp4');
const FRAME_SAMPLES = 256;
const TARGET_SAMPLE_RATE = 48000;

let activeConnections = {};
let currentAudioTimeout = null;
let isPlayingAudio = false;
let currentPlayingFile = null;

function buildVbanHeader(streamName, frameIndex) {
  const header = Buffer.alloc(28);
  header.write('VBAN', 0);
  header.writeUInt8(0x03, 4);                // 48000 Hz
  header.writeUInt8(FRAME_SAMPLES - 1, 5);  // 256 amostras
  header.writeUInt8(1, 6);                  // Estéreo
  header.writeUInt8(0x01, 7);               // PCM 16-bit

  const streamBuf = Buffer.alloc(16);
  streamBuf.write(streamName || 'Painel', 0, 'utf-8');
  streamBuf.copy(header, 8);

  header.writeUInt32LE(frameIndex || 0, 24);
  return header;
}

async function decodeAudioFile(buffer) {
  const { default: decode } = await import('audio-decode');
  const decoded = await decode(buffer);

  let channelLeft, channelRight;

  if (typeof decoded.getChannelData === 'function') {
    channelLeft = decoded.getChannelData(0);
    channelRight = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : channelLeft;
  } else if (decoded.channelData) {
    channelLeft = decoded.channelData[0];
    channelRight = decoded.channelData[1] || channelLeft;
  } else {
    throw new Error('Formato de áudio incompatível.');
  }

  return {
    channelLeft,
    channelRight,
    length: channelLeft.length,
    sampleRate: decoded.sampleRate || 44100
  };
}

function stopCurrentAudio(notifyWindow) {
  if (currentAudioTimeout) {
    clearTimeout(currentAudioTimeout);
    currentAudioTimeout = null;
  }
  isPlayingAudio = false;
  currentPlayingFile = null;

  if (notifyWindow) {
    notifyWindow({ isPlaying: false, fileName: null });
  }
}

async function triggerVbanSound(audioPath, fileName, notifyWindow) {
  const activeKeys = Object.keys(activeConnections);
  if (activeKeys.length === 0) {
    console.warn('⚠️ Nenhuma conexão VBAN está ativa!');
    return;
  }

  stopCurrentAudio(notifyWindow);

  const targetFileName = fileName || path.basename(audioPath);
  isPlayingAudio = true;
  currentPlayingFile = targetFileName;

  if (notifyWindow) {
    notifyWindow({ isPlaying: true, fileName: targetFileName });
  }

  try {
    const fileBuffer = fs.readFileSync(audioPath);
    const { channelLeft, channelRight, length: totalSamples, sampleRate } = await decodeAudioFile(fileBuffer);

    const volumes = loadAudioVolumes();
    const userVolume = volumes[targetFileName] !== undefined ? volumes[targetFileName] : 1.0;

    const resampleRatio = sampleRate / TARGET_SAMPLE_RATE;
    let samplePosition = 0;
    let frameIndex = 0;

    const packetDurationMs = (FRAME_SAMPLES / TARGET_SAMPLE_RATE) * 1000;
    const startTime = Date.now();

    function sendNextPacket() {
      if (!isPlayingAudio || samplePosition >= totalSamples) {
        stopCurrentAudio(notifyWindow);
        return;
      }

      const pcmBuffer = Buffer.alloc(FRAME_SAMPLES * 2 * 2);
      let offset = 0;
      const FINAL_GAIN = 0.7 * userVolume;

      for (let i = 0; i < FRAME_SAMPLES; i++) {
        const sIdx = Math.floor(samplePosition);
        let left = 0, right = 0;

        if (sIdx < totalSamples) {
          left = channelLeft[sIdx] * FINAL_GAIN;
          right = channelRight[sIdx] * FINAL_GAIN;
        }

        left = Math.max(-1, Math.min(1, left));
        right = Math.max(-1, Math.min(1, right));

        const intLeft = left < 0 ? Math.floor(left * 32768) : Math.floor(left * 32767);
        const intRight = right < 0 ? Math.floor(right * 32768) : Math.floor(right * 32767);

        pcmBuffer.writeInt16LE(intLeft, offset);
        pcmBuffer.writeInt16LE(intRight, offset + 2);
        offset += 4;

        samplePosition += resampleRatio;
      }

      activeKeys.forEach(connId => {
        const conn = activeConnections[connId];
        if (conn) {
          const header = buildVbanHeader(conn.streamName, frameIndex);
          const packet = Buffer.concat([header, pcmBuffer]);
          udpClient.send(packet, 0, packet.length, conn.port, conn.ip);
        }
      });

      frameIndex++;

      const elapsed = Date.now() - startTime;
      const expectedTime = frameIndex * packetDurationMs;
      const delay = Math.max(0, expectedTime - elapsed);

      currentAudioTimeout = setTimeout(sendNextPacket, delay);
    }

    sendNextPacket();

  } catch (err) {
    stopCurrentAudio(notifyWindow);
    console.error('Erro na transmissão UDP:', err);
  }
}

function toggleConnection(conn, connect) {
  const { id, ip, port, streamName } = conn;

  if (connect) {
    if (activeConnections[id]) clearInterval(activeConnections[id].interval);

    const connData = {
      id,
      ip,
      port: port || 6980,
      streamName,
      frameCount: 0
    };

    connData.interval = setInterval(() => {
      if (isPlayingAudio) return;

      const header = buildVbanHeader(connData.streamName, connData.frameCount++);
      const silencePcm = Buffer.alloc(FRAME_SAMPLES * 2 * 2);
      const packet = Buffer.concat([header, silencePcm]);

      udpClient.send(packet, 0, packet.length, connData.port, connData.ip);
    }, 20);

    activeConnections[id] = connData;
    return true;
  } else {
    if (activeConnections[id]) {
      clearInterval(activeConnections[id].interval);
      delete activeConnections[id];
    }
    return false;
  }
}

function removeActiveConnection(connId) {
  if (activeConnections[connId]) {
    clearInterval(activeConnections[connId].interval);
    delete activeConnections[connId];
  }
}

function getActiveConnectionsMap() {
  return activeConnections;
}

function closeUdpClient() {
  Object.keys(activeConnections).forEach(k => clearInterval(activeConnections[k].interval));
  udpClient.close();
}

function getPlaybackState() {
  return { isPlayingAudio, currentPlayingFile };
}

module.exports = {
  triggerVbanSound,
  stopCurrentAudio,
  toggleConnection,
  removeActiveConnection,
  getActiveConnectionsMap,
  closeUdpClient,
  getPlaybackState
};