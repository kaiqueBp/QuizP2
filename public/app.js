document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket('ws://localhost:3000');
    const messagesDiv = document.getElementById('messages');

    ws.onopen = () => {
        console.log('Conectado ao servidor WebSocket');
    };

    ws.onmessage = (event) => {
        const message = document.createElement('p');
        message.textContent = event.data;
        messagesDiv.appendChild(message);
    };

    ws.onclose = () => {
        console.log('Desconectado do servidor WebSocket');
    };

    ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
    };
});

