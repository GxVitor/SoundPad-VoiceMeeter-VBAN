# 🎛️ GX Soundboard - VBAN Edition

![Electron](https://img.shields.io/badge/Electron-28.x-47848F?style=for-the-badge&logo=electron&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)

Uma aplicação desktop moderna de **Soundboard** desenvolvida em **Electron**, projetada para streaming direto de áudio em rede via protocolo **VBAN** (integrado ao VoiceMeeter). 

Permite gerenciar múltiplos destinos VBAN, associar teclas de atalho globais do sistema operacional aos áudios, baixar vinhetas direto da Web (incluindo suporte ao MyInstants) e controlar volumes individuais de saída.

---

## ✨ Funcionalidades

- 🔊 **Transmissão VBAN Multi-Stream Direct**: Envio de pacotes PCM via UDP 48kHz diretamente para instâncias do VoiceMeeter na rede local.
- 🌐 **Múltiplas Conexões VBAN**: Cadastre, edite, conecte e desconecte múltiplos IPs e portas de recepção VBAN em tempo real.
- ⌨️ **Atalhos Globais (Global Keybinds)**: Configure combinações de teclas no sistema operacional (ex: `F1`, `Ctrl+Numpad1`) para disparar áudios mesmo com o aplicativo em segundo plano ou durante jogos.
- 🎚️ **Controle de Volume Individual**: Ajuste o ganho de saída (0% a 200%) para cada áudio de forma independente.
- 🌍 **Importação de Áudios Web**: Suporte para adicionar vinhetas via URL direta (.mp3) ou scraping automático do [MyInstants](https://www.myinstants.com).
- ⭐ **Favoritos & Organização**: Marque seus efeitos sonoros favoritos e organize entre áudios locais e da web.
- 🪟 **Interface Dark Responsiva**: Design escuro moderno com transparência, suporte a imagem de fundo personalizada e menus de contexto nativos customizados.

---

## 📂 Estrutura do Projeto

O projeto adota uma arquitetura modularizada, separando as responsabilidades de persistência, motor de áudio e interface do usuário:

```text
gx-soundboard/
├── config/                  # Módulos de persistência de dados (JSON)
│   ├── jsonStore.js         # Leitura/Escrita genérica de arquivos na AppData
│   ├── audioConfig.js       # Volumes, favoritos e nomes customizados
│   ├── keybindConfig.js     # Mapeamento e sanitização de atalhos
│   └── connectionConfig.js  # CRUD de conexões VBAN
├── src/
│   ├── styles/
│   │   └── main.css         # Estilos customizados e background
│   ├── vban/
│   │   └── vbanEngine.js    # Decodificação de áudio, protocolo VBAN e socket UDP
│   └── renderer/
│       └── app.js           # Lógica do front-end, DOM e modais
├── audios/                  # Diretório de armazenamento de áudios
├── index.html               # Interface HTML limpa
├── main.js                  # Ponto de entrada do Electron (Janela e Comunicação IPC)
└── package.json             # Dependências e scripts de Build
```

## 📥 Downloads e Releases

| Versão | Descrição | Link de Download |
| :--- | :--- | :---: |
| **Instalador Windows** | Instalador automático (`.exe`) com atalhos no menu iniciar | [📦 Baixar Instalador](https://github.com/SEU-USUARIO/gx-soundboard-vban/releases/download/v1.0.0/GX.Soundboard.Setup.1.0.0.exe) |
| **Versão Portátil** | Executável direto (`.exe` / `.zip`), roda sem precisar instalar | [📁 Baixar Portátil](https://github.com/SEU-USUARIO/gx-soundboard-vban/releases/download/v1.0.0/GX.Soundboard-Portable.zip) |
