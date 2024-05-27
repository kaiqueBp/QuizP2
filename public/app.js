document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket('ws://localhost:3000');
    const perguntas = document.getElementById('perguntas');
    const alternativas = document.getElementById('alternativas');
    const messagesDiv = document.getElementById('messages');
    let currentQuestion = null;
    let pontuacao = 0;

    ws.onopen = () => {
        console.log('Conectado ao servidor WebSocket');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.perguntas) {
            perguntas.textContent = message.perguntas;
            alternativas.innerHTML = '';
            message.alternativas.forEach((answer, index) => {
                const answerButton = document.createElement('button');
                answerButton.textContent = answer;
                answerButton.className = 'answer-button';
                answerButton.addEventListener('click', () => {
                    ws.send(JSON.stringify({ answerIndex: index }));
                });
                alternativas.appendChild(answerButton);
            });
            currentQuestion = message;
        } else if (message.correcao) {
            const mensagemResposta = document.createElement('p');
            mensagemResposta.textContent = message.correcao;
            messagesDiv.appendChild(mensagemResposta);
            setTimeout(() => {
                messagesDiv.removeChild(mensagemResposta);
            }, 2000);
        } else if (message.pontuacao !== undefined) {
            pontuacao = message.pontuacao;
            const pontuacaoTotal = document.getElementById('pontuação');
            pontuacaoTotal.textContent = `Pontuação: ${pontuacao}`;
        }
    };

    ws.onclose = () => {
        console.log('Desconectado do servidor WebSocket');
    };

    ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
    };
});
