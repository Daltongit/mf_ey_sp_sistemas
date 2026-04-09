// Referencias a los elementos del DOM
const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const btnSend = document.getElementById('btn-send');
const serverUrlInput = document.getElementById('server-url');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message-input');
const chatBox = document.getElementById('chat-box');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const countSent = document.getElementById('count-sent');
const countReceived = document.getElementById('count-received');

let socket;
let sentMsgs = 0;
let receivedMsgs = 0;

// Función para imprimir mensajes en la pantalla
function appendMessage(content, type = 'system', isMine = false) {
    const div = document.createElement('div');

    if (type === 'system') {
        div.className = 'msg-system';
        div.innerHTML = `> ${content}`;
    } else {
        div.className = `msg-chat ${isMine ? 'mine' : ''}`;
        div.innerHTML = `
            <div class="author">${isMine ? 'Tú' : content.usuario}</div>
            <div class="text">${content.texto}</div>
        `;
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
}

// Control de botones de la interfaz
function toggleUI(connected) {
    btnConnect.disabled = connected;
    btnDisconnect.disabled = !connected;
    messageInput.disabled = !connected;
    btnSend.disabled = !connected;
    usernameInput.disabled = connected;

    if (connected) {
        statusDot.classList.replace('disconnected', 'connected');
        statusText.innerText = 'Conectado';
        messageInput.focus();
    } else {
        statusDot.classList.replace('connected', 'disconnected');
        statusText.innerText = 'Desconectado';
    }
}

// 🟢 CONECTAR AL SERVIDOR
btnConnect.addEventListener('click', () => {
    const url = serverUrlInput.value;
    const user = usernameInput.value.trim() || 'Anónimo';

    if (!url) return alert('La URL del servidor es obligatoria');

    appendMessage(`Conectando a ${url}...`, 'system');

    // Inicializamos el socket manualmente al dar click
    socket = io(url);

    socket.on('connect', () => {
        toggleUI(true);
        appendMessage('¡Conexión establecida con éxito!', 'system');
    });

    // Escuchar mensajes del sistema (quién entra/sale)
    socket.on('sistema', (data) => {
        appendMessage(`Servidor: ${data.mensaje}`, 'system');
    });

    // Escuchar mensajes de chat
    socket.on('mensaje', (data) => {
        const isMine = data.usuario === user;
        appendMessage(data, 'chat', isMine);

        // Actualizar estadísticas si no es mío (los míos se cuentan al enviar)
        if (!isMine) {
            receivedMsgs++;
            countReceived.innerText = receivedMsgs;
        }
    });

    socket.on('disconnect', () => {
        toggleUI(false);
        appendMessage('Se ha perdido la conexión con el servidor.', 'system');
    });
});

// 🔴 DESCONECTAR DEL SERVIDOR
btnDisconnect.addEventListener('click', () => {
    if (socket) {
        socket.disconnect();
        appendMessage('Te has desconectado manualmente.', 'system');
        toggleUI(false);
    }
});

// ✈️ ENVIAR MENSAJE
function sendMessage() {
    const text = messageInput.value.trim();
    const user = usernameInput.value.trim() || 'Anónimo';

    if (text !== '' && socket && socket.connected) {
        socket.emit('mensaje', { usuario: user, texto: text });
        messageInput.value = '';

        // Actualizar estadísticas
        sentMsgs++;
        countSent.innerText = sentMsgs;
    }
}

// Enviar con botón o con la tecla Enter
btnSend.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});