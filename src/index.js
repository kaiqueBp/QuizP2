const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use('/public', express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

wss.on('connection', (ws) => {
    console.log('O Cliente está conectado');
    ws.send('Bem vindo ao servidor do kaique');

    ws.on('close', () => {
        console.log('O Cliente se desconectou');
    });
});

server.listen(3000, () => {
    console.log(`Servidor está rodando na porta 3000`);
});
