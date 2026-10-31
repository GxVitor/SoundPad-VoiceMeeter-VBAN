const { ipcRenderer } = require('electron');

const gridConnections = document.getElementById('gridConnections');
const gridAudiosFavorites = document.getElementById('gridAudiosFavorites');
const gridAudiosLocal = document.getElementById('gridAudiosLocal');
const gridAudiosWeb = document.getElementById('gridAudiosWeb');

const btnRefresh = document.getElementById('btnRefresh');
const btnStopAudio = document.getElementById('btnStopAudio');
const btnAddConnection = document.getElementById('btnAddConnection');
const btnAddAudio = document.getElementById('btnAddAudio');
const btnAddWebAudio = document.getElementById('btnAddWebAudio');

// Context Menu
const contextMenu = document.getElementById('contextMenu');
const menuOptionKeybind = document.getElementById('menuOptionKeybind');
const menuOptionVolume = document.getElementById('menuOptionVolume');
const menuOptionFavorite = document.getElementById('menuOptionFavorite');
const textMenuFavorite = document.getElementById('textMenuFavorite');
const menuOptionRename = document.getElementById('menuOptionRename');
const menuOptionDelete = document.getElementById('menuOptionDelete');

// Modal Keybind
const keybindModal = document.getElementById('keybindModal');
const keybindBox = document.getElementById('keybindBox');
const modalKeybindClear = document.getElementById('modalKeybindClear');
const modalKeybindCancel = document.getElementById('modalKeybindCancel');
const modalKeybindSave = document.getElementById('modalKeybindSave');

// Modal Volume
const volumeModal = document.getElementById('volumeModal');
const inputVolumeRange = document.getElementById('inputVolumeRange');
const volumeValueLabel = document.getElementById('volumeValueLabel');
const modalVolumeCancel = document.getElementById('modalVolumeCancel');
const modalVolumeSave = document.getElementById('modalVolumeSave');

// Modal Conexão
const connectionModal = document.getElementById('connectionModal');
const inputConnName = document.getElementById('inputConnName');
const inputConnIp = document.getElementById('inputConnIp');
const inputConnPort = document.getElementById('inputConnPort');
const inputConnStream = document.getElementById('inputConnStream');
const modalConnCancel = document.getElementById('modalConnCancel');
const modalConnSave = document.getElementById('modalConnSave');
const modalConnTitle = document.getElementById('modalConnTitle');
const inputConnId = document.getElementById('inputConnId');

// Modais Áudios
const renameModal = document.getElementById('renameModal');
const modalInputName = document.getElementById('modalInputName');
const modalBtnCancel = document.getElementById('modalBtnCancel');
const modalBtnSave = document.getElementById('modalBtnSave');

const webAudioModal = document.getElementById('webAudioModal');
const modalInputWebUrl = document.getElementById('modalInputWebUrl');
const modalWebLoading = document.getElementById('modalWebLoading');
const modalWebBtnCancel = document.getElementById('modalWebBtnCancel');
const modalWebBtnSave = document.getElementById('modalWebBtnSave');

let selectedAudioForContext = null;
let currentCapturedKeybind = '';

window.addEventListener('click', () => contextMenu.classList.add('hidden'));

// Parar Áudio
btnStopAudio.addEventListener('click', () => {
  ipcRenderer.send('stop-vban-sound');
});

// --- CONEXÕES ---
async function loadConnections() {
  gridConnections.innerHTML = '';
  const connections = await ipcRenderer.invoke('get-connections');

  if (connections.length === 0) {
    gridConnections.innerHTML = `<div class="col-span-full p-4 text-center text-slate-400 border border-dashed border-slate-700/80 rounded-xl text-xs bg-slate-900/40">Nenhuma conexão cadastrada. Clique em + Adicionar Conexão!</div>`;
    return;
  }

  connections.forEach(conn => {
    const card = document.createElement('div');
    const isConn = conn.connected;

    card.className = `p-3.5 rounded-xl border ${isConn ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-slate-800/80 border-slate-700/60'} flex items-center justify-between gap-3 shadow-md transition backdrop-blur-sm`;

  card.innerHTML = `
    <div class="overflow-hidden flex-1">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full ${isConn ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} shrink-0"></span>
        <p class="text-xs font-bold text-slate-100 truncate">${conn.name}</p>
      </div>
      <p class="text-[11px] text-slate-400 mt-1 truncate">IP: <span class="text-cyan-300 font-mono">${conn.ip}:${conn.port}</span> | Stream: <span class="text-cyan-300 font-mono">${conn.streamName}</span></p>
    </div>

    <div class="flex items-center gap-1.5 shrink-0">
      <button class="btn-toggle-conn px-3 py-1.5 ${isConn ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white rounded-lg text-xs font-semibold transition active:scale-95 shadow">
        ${isConn ? 'Desconectar' : 'Conectar'}
      </button>
      <button class="btn-edit-conn p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/80 rounded-lg transition" title="Editar Conexão">
        <i class="fa-solid fa-pen text-xs"></i>
      </button>
      <button class="btn-delete-conn p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 rounded-lg transition" title="Excluir Conexão">
        <i class="fa-solid fa-trash text-xs"></i>
      </button>
    </div>
  `;

    card.querySelector('.btn-toggle-conn').addEventListener('click', async () => {
      await ipcRenderer.invoke('toggle-connection-status', { id: conn.id, connect: !isConn });
      loadConnections();
    });

    card.querySelector('.btn-delete-conn').addEventListener('click', async () => {
      if (confirm(`Excluir a conexão "${conn.name}"?`)) {
        await ipcRenderer.invoke('delete-connection', conn.id);
        loadConnections();
      }
    });

    card.querySelector('.btn-edit-conn').addEventListener('click', () => {
      inputConnId.value = conn.id;
      inputConnName.value = conn.name;
      inputConnIp.value = conn.ip;
      inputConnPort.value = conn.port;
      inputConnStream.value = conn.streamName;
      
      modalConnTitle.innerHTML = `<i class="fa-solid fa-pen text-cyan-400"></i> Editar Conexão VBAN`;
      connectionModal.classList.remove('hidden');
      inputConnName.focus();
    });

    gridConnections.appendChild(card);
  });
}

btnAddConnection.addEventListener('click', () => {
  inputConnId.value = ''; // Limpa o ID para indicar nova conexão
  inputConnName.value = '';
  inputConnIp.value = '192.168.15.3';
  inputConnPort.value = '6980';
  inputConnStream.value = 'Painel';

  modalConnTitle.innerHTML = `<i class="fa-solid fa-network-wired text-cyan-400"></i> Nova Conexão VBAN`;
  connectionModal.classList.remove('hidden');
  inputConnName.focus();
});

modalConnCancel.addEventListener('click', () => connectionModal.classList.add('hidden'));

modalConnSave.addEventListener('click', async () => {
  const id = inputConnId.value;
  const name = inputConnName.value.trim();
  const ip = inputConnIp.value.trim();
  const port = inputConnPort.value.trim();
  const streamName = inputConnStream.value.trim();

  if (!ip || !streamName) {
    alert('Preencha o IP e o Nome da Stream!');
    return;
  }

  if (id) {
    // Se possui ID, é uma edição
    await ipcRenderer.invoke('update-connection', { id, name, ip, port, streamName });
  } else {
    // Se não possui ID, cria uma nova conexão
    await ipcRenderer.invoke('add-connection', { name, ip, port, streamName });
  }

  connectionModal.classList.add('hidden');
  loadConnections();
});

// --- GERENCIADOR DE KEYBINDS ---
menuOptionKeybind.addEventListener('click', () => {
  if (!selectedAudioForContext) return;
  contextMenu.classList.add('hidden');

  currentCapturedKeybind = selectedAudioForContext.keybind || '';
  keybindBox.innerText = currentCapturedKeybind || 'Pressione a tecla...';
  keybindModal.classList.remove('hidden');
  keybindBox.focus();
});

keybindBox.addEventListener('keydown', (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

  const mods = [];
  if (e.ctrlKey) mods.push('Ctrl');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');

  let keyName = e.key;

  const keyMap = {
    'ArrowRight': 'Right',
    'ArrowLeft': 'Left',
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    ' ': 'Space',
    'Escape': 'Esc'
  };

  if (keyMap[keyName]) {
    keyName = keyMap[keyName];
  } else if (e.code.startsWith('Numpad')) {
    keyName = e.code;
  } else if (keyName.length === 1) {
    keyName = keyName.toUpperCase();
  }

  currentCapturedKeybind = [...mods, keyName].join('+');
  keybindBox.innerText = currentCapturedKeybind;
});

modalKeybindClear.addEventListener('click', () => {
  currentCapturedKeybind = '';
  keybindBox.innerText = 'Pressione a tecla...';
});

modalKeybindCancel.addEventListener('click', () => keybindModal.classList.add('hidden'));

modalKeybindSave.addEventListener('click', async () => {
  if (!selectedAudioForContext) return;

  await ipcRenderer.invoke('set-audio-keybind', {
    fileName: selectedAudioForContext.fileName,
    shortcut: currentCapturedKeybind
  });

  keybindModal.classList.add('hidden');
  loadAudios();
});

// --- GERENCIADOR DE VOLUME ---
menuOptionVolume.addEventListener('click', () => {
  if (!selectedAudioForContext) return;
  contextMenu.classList.add('hidden');

  const volPercent = Math.round((selectedAudioForContext.volume || 1.0) * 100);
  inputVolumeRange.value = volPercent;
  volumeValueLabel.innerText = `${volPercent}%`;

  volumeModal.classList.remove('hidden');
});

inputVolumeRange.addEventListener('input', (e) => {
  volumeValueLabel.innerText = `${e.target.value}%`;
});

modalVolumeCancel.addEventListener('click', () => volumeModal.classList.add('hidden'));

modalVolumeSave.addEventListener('click', async () => {
  if (!selectedAudioForContext) return;

  const newVolFloat = parseFloat(inputVolumeRange.value) / 100.0;
  await ipcRenderer.invoke('set-audio-volume', {
    fileName: selectedAudioForContext.fileName,
    volume: newVolFloat
  });

  volumeModal.classList.add('hidden');
  loadAudios();
});

// --- ÁUDIOS ---
btnAddAudio.addEventListener('click', async () => {
  const added = await ipcRenderer.invoke('select-audios');
  if (added) loadAudios();
});

btnAddWebAudio.addEventListener('click', () => {
  modalInputWebUrl.value = '';
  modalWebLoading.classList.add('hidden');
  webAudioModal.classList.remove('hidden');
  modalInputWebUrl.focus();
});

modalWebBtnCancel.addEventListener('click', () => webAudioModal.classList.add('hidden'));

modalWebBtnSave.addEventListener('click', async () => {
  const url = modalInputWebUrl.value.trim();
  if (!url) return;

  modalWebLoading.classList.remove('hidden');
  modalWebBtnSave.disabled = true;

  const success = await ipcRenderer.invoke('download-web-audio', url);

  modalWebLoading.classList.add('hidden');
  modalWebBtnSave.disabled = false;

  if (success) {
    webAudioModal.classList.add('hidden');
    loadAudios();
  } else {
    alert('Não foi possível baixar o áudio deste link. Verifique a URL e tente novamente.');
  }
});

// Menu Contexto
menuOptionFavorite.addEventListener('click', async () => {
  if (!selectedAudioForContext) return;
  contextMenu.classList.add('hidden');
  await ipcRenderer.invoke('toggle-favorite', selectedAudioForContext.fileName);
  loadAudios();
});

menuOptionRename.addEventListener('click', () => {
  if (!selectedAudioForContext) return;
  contextMenu.classList.add('hidden');
  modalInputName.value = selectedAudioForContext.displayName;
  renameModal.classList.remove('hidden');
  modalInputName.focus();
});

menuOptionDelete.addEventListener('click', async () => {
  if (!selectedAudioForContext) return;
  contextMenu.classList.add('hidden');

  if (confirm(`Excluir "${selectedAudioForContext.displayName}"?`)) {
    await ipcRenderer.invoke('delete-audio', selectedAudioForContext.fileName);
    loadAudios();
  }
});

modalBtnCancel.addEventListener('click', () => renameModal.classList.add('hidden'));

modalBtnSave.addEventListener('click', async () => {
  if (!selectedAudioForContext) return;
  const newName = modalInputName.value.trim();
  await ipcRenderer.invoke('rename-audio', {
    fileName: selectedAudioForContext.fileName,
    newCustomName: newName
  });
  renameModal.classList.add('hidden');
  loadAudios();
});

function renderCard(audio, cardType) {
  const card = document.createElement('div');
  let borderStyle = "border-slate-700/60";
  let iconBg = "bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500";
  let textHover = "group-hover:text-cyan-300";

  if (cardType === 'fav') {
    borderStyle = "border-amber-500/40 bg-amber-950/30";
    iconBg = "bg-amber-500/20 text-amber-400 group-hover:bg-amber-500";
    textHover = "group-hover:text-amber-300";
  } else if (cardType === 'web') {
    iconBg = "bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500";
    textHover = "group-hover:text-emerald-300";
  }

  const volPercentDisplay = Math.round((audio.volume || 1.0) * 100);
  const keybindBadge = audio.keybind 
    ? `<span class="px-1.5 py-0.5 bg-slate-950/80 text-cyan-300 border border-slate-700 rounded text-[10px] font-mono">${audio.keybind}</span>` 
    : '';

  card.className = `bg-slate-800/70 hover:bg-slate-700/80 border ${borderStyle} p-4 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-lg active:scale-95 relative backdrop-blur-sm`;

  card.innerHTML = `
    <div class="flex items-center gap-3 overflow-hidden pointer-events-none">
      <div class="p-3 ${iconBg} group-hover:text-slate-900 rounded-lg transition shrink-0">
        <i class="fa-solid fa-play"></i>
      </div>
      <div class="overflow-hidden">
        <p class="text-sm font-semibold text-slate-200 ${textHover} truncate" title="${audio.displayName}">${audio.displayName}</p>
        <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
          <span>Vol: ${volPercentDisplay}%</span>
          ${keybindBadge}
        </div>
      </div>
    </div>
    ${audio.isFavorite ? '<i class="fa-solid fa-star text-amber-400 text-xs mr-1 shrink-0"></i>' : ''}
  `;

  card.addEventListener('click', () => playAudio(audio));

  card.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    selectedAudioForContext = audio;
    textMenuFavorite.innerText = audio.isFavorite ? 'Remover dos Favoritos' : 'Favoritar';

    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.classList.remove('hidden');
  });

  return card;
}

async function loadAudios() {
  gridAudiosFavorites.innerHTML = '';
  gridAudiosLocal.innerHTML = '';
  gridAudiosWeb.innerHTML = '';

  const audios = await ipcRenderer.invoke('get-audios');

  const favAudios = audios.filter(a => a.isFavorite);
  const localAudios = audios.filter(a => !a.isWeb);
  const webAudios = audios.filter(a => a.isWeb);

  if (favAudios.length === 0) {
    gridAudiosFavorites.innerHTML = `<div class="col-span-full p-4 text-center text-slate-400 border border-dashed border-slate-700/80 rounded-xl text-xs bg-slate-900/40">Clique com o botão direito em qualquer áudio abaixo para favoritar!</div>`;
  } else {
    favAudios.forEach(audio => gridAudiosFavorites.appendChild(renderCard(audio, 'fav')));
  }

  if (localAudios.length === 0) {
    gridAudiosLocal.innerHTML = `<div class="col-span-full p-6 text-center text-slate-400 border border-dashed border-slate-700/80 rounded-xl text-xs bg-slate-900/40">Nenhum áudio local. Clique no + acima para adicionar!</div>`;
  } else {
    localAudios.forEach(audio => gridAudiosLocal.appendChild(renderCard(audio, 'local')));
  }

  if (webAudios.length === 0) {
    gridAudiosWeb.innerHTML = `<div class="col-span-full p-6 text-center text-slate-400 border border-dashed border-slate-700/80 rounded-xl text-xs bg-slate-900/40">Nenhum áudio web. Clique no + verde para adicionar via link do MyInstants!</div>`;
  } else {
    webAudios.forEach(audio => gridAudiosWeb.appendChild(renderCard(audio, 'web')));
  }
}

function playAudio(audioItem) {
  ipcRenderer.send('play-vban-sound', { 
    audioPath: audioItem.path,
    fileName: audioItem.fileName 
  });
}

btnRefresh.addEventListener('click', () => {
  loadConnections();
  loadAudios();
});

loadConnections();
loadAudios();