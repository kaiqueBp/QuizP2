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

let clientePontuacao = {};

wss.on('connection', (ws) => {
    const clientId = Math.floor(Math.random() * 1000000);
    clientePontuacao[clientId] = { pontuacao: 0 };

    console.log(`Cliente ${clientId} conectado`);
    ws.send(JSON.stringify({ userId: clientId }));

    let perguntas = null;
    let resposta = null;
    let historico = new Set();

    fs.readFile('perguntas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo JSON:', err);
            return;
        }
        perguntas = JSON.parse(data);
        ws.send(JSON.stringify({ totalPerguntas: perguntas.length }));
        enviarPergunta();
    });

    function enviarPergunta() {
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
            const correctIndex = resposta.resposta;

            if (resposta && correctIndex === client) {
                clientePontuacao[clientId].pontuacao++;
            }

            ws.send(JSON.stringify({ correctIndex, client }));
            ws.send(JSON.stringify({ pontuacao: clientePontuacao[clientId].pontuacao }));
            enviaPontuacao();
        } else if (respostaClient.nextQuestion) {
            enviarPergunta();
        }
    });

    ws.on('close', () => {
        delete clientePontuacao[clientId];
        console.log(`Cliente ${clientId} desconectado`);
        enviaPontuacao();
    });

    function enviaPontuacao() {
        const scores = Object.keys(clientePontuacao).map(clientId => ({
            clientId,
            pontuacao: clientePontuacao[clientId].pontuacao
        }));
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ scores }));
            }
        });
    }
});

server.listen(3000, () => {
    console.log(`Servidor está ouvindo na porta 3000`);
});
