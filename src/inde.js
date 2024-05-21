const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = require('http').createServer(app);


const wss = new WebSocket.Server({ server });

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
})


wss.on('connection', (ws) => {
    console.log('Nova conexão WebSocket estabelecida');
    console.log('a user connected');
    socket.emit('users', users);
    
   
    ws.on('disconnect', () => {
        console.log('user disconnected');
    });

    ws.on('data', (data) => {
        users.push(data);
        io.emit('user', data);
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
