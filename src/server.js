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

let clientScores = {};

wss.on('connection', (ws) => {
    const clientId = Math.floor(Math.random() * 1000000); 
    clientScores[clientId] = { pontuacao: 0 };

    console.log(`Cliente ${clientId} conectado`);
    ws.send(JSON.stringify({ message: 'Bem-vindo ao servidor do Kaique' }));

    let perguntas = null;
    let resposta = null;
    let historico = new Set();

    fs.readFile('perguntas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo JSON:', err);
            return;
        }
        ws.send(JSON.stringify({ userId: clientId }));
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
        const respostaClient = JSON.parse(message);
        if (respostaClient.index !== undefined) {
            const client = respostaClient.index;
            let correcao;
            const correctIndex = resposta.resposta; 
            if (resposta && correctIndex === client) {
                correcao = 'Resposta correta! :)';
                clientScores[clientId].pontuacao++;
            } else {
                correcao = 'Resposta incorreta!! :(';
            }
            ws.send(JSON.stringify({ correcao, correctIndex, client }));
            ws.send(JSON.stringify({ pontuacao: clientScores[clientId].pontuacao }));
            enviaPontucao();
        } else if (respostaClient.nextQuestion) {
            sendRandomQuestion();
        }
    });

    ws.on('close', () => {
        delete clientScores[clientId];
        console.log(`Cliente ${clientId} desconectado`);
        enviaPontucao();
    });

    function enviaPontucao() {
        const scores = Object.keys(clientScores).map(clientId => ({
            clientId,
            pontuacao: clientScores[clientId].pontuacao
        }));
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ scores }));
            }
        });
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor está ouvindo na porta ${PORT}`);
});
