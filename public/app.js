document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket('ws://localhost:3000');
    const perguntas = document.getElementById('perguntas');
    const alternativas = document.getElementById('alternativas');
    const messagesDiv = document.getElementById('messages');
    const pontuacaoTotal = document.getElementById('pontuação');
    const scoreTable = document.getElementById('score-table');
    const userIdElement = document.getElementById('user-id');
    let currentQuestion = null;
    let pontuacao = 0;

    ws.onopen = () => {
        console.log('Conectado ao servidor WebSocket');
        ws.send(JSON.stringify({ requestUserId: true }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.userId) {
            userIdElement.textContent = message.userId; 
        } else if (message.perguntas) {
            perguntas.textContent = message.perguntas;
            alternativas.innerHTML = '';
            message.alternativas.forEach((answer, index) => {
                const answerButton = document.createElement('button');
                answerButton.textContent = answer;
                answerButton.className = 'answer-button';
                answerButton.addEventListener('click', () => {
                    ws.send(JSON.stringify({ index: index }));
                });
                alternativas.appendChild(answerButton);
            });
            currentQuestion = message;
        } else if (message.correcao) {
            const answerButtons = document.querySelectorAll('button.answer-button');
            answerButtons.forEach((button, index) => {
                button.disabled = true;
                if (index === message.correctIndex) {
                    button.classList.add('correct');
                } else if (index === message.client) {
                    button.classList.add('incorrect');
                }
            });

            const mensagemResposta = document.createElement('p');
            mensagemResposta.textContent = message.correcao;
            messagesDiv.appendChild(mensagemResposta);
            setTimeout(() => {
                messagesDiv.removeChild(mensagemResposta);
                novaPergunta();
            }, 2000);
        } else if (message.pontuacao !== undefined) {
            pontuacao = message.pontuacao;
            pontuacaoTotal.textContent = `Pontuação: ${pontuacao}`;
        } else if (message.scores) {
            atualizar(message.scores);
        }
    };

    ws.onclose = () => {
        console.log('Desconectado do servidor WebSocket');
    };

    ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
    };

    function novaPergunta() {
        ws.send(JSON.stringify({ nextQuestion: true }));
    }

    function atualizar(scores) {
        scoreTable.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Pontuação</th>
                    </tr>
                </thead>
                <tbody>
                    ${scores.map(score => `
                        <tr>
                            <td>${score.clientId}</td>
                            <td>${score.pontuacao}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
});
