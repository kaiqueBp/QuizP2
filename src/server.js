const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use('/public', express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

wss.on('connection', (ws) => {
    console.log('Cliente conectado');
    ws.send(JSON.stringify({ message: 'Bem-vindo ao servidor do Kaique' }));

    let perguntas = null;
    let pontuacao = 0;
    let resposta = null;
    let historico = new Set();

    fs.readFile('perguntas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo JSON:', err);
            return;
        }
        perguntas = JSON.parse(data);
        sendRandomQuestion();
    });

    function sendRandomQuestion() {
        if (historico.size === perguntas.length) {
            ws.send(JSON.stringify({ perguntas: 'Parabéns! Você respondeu todas as perguntas.', alternativas: [] }));
            return;
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * perguntas.length);
        } while (historico.has(randomIndex));

        resposta = perguntas[randomIndex];
        historico.add(randomIndex);

        ws.send(JSON.stringify(resposta));
    }

    ws.on('message', (message) => {
        const clientAnswer = JSON.parse(message).answerIndex;
        let correcao;
        if (resposta && resposta.resposta === clientAnswer) {
            correcao = 'Resposta correta! 🎉';
            pontuacao++;
        } else {
            correcao = 'Resposta incorreta!! :(';
        }
        ws.send(JSON.stringify({ correcao }));
        ws.send(JSON.stringify({ pontuacao }));
        sendRandomQuestion();
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor está ouvindo na porta ${PORT}`);
});
