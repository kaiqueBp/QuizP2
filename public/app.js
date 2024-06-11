document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket('ws://localhost:3000');
    const perguntas = document.getElementById('perguntas');
    const alternativas = document.getElementById('alternativas');
    const pontuacaoTotal = document.getElementById('pontuação');
    const pontuacaoTabela = document.getElementById('score-table');
    const idCliente = document.getElementById('user-id');
    let pontuacao = 0;
    let timer = null;
    let timeTela = 40;
    let totalPerguntas = 0; 
    let perguntasRespondidas = 0;

    ws.onopen = () => {
        console.log('Conectado ao servidor WebSocket');
        ws.send(JSON.stringify({ requestUserId: true }));
        iniciarTempo();
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.userId) {
            idCliente.textContent = message.userId;
        } else if (message.perguntas) {
            perguntasRespondidas++;
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
        } else if (message.correctIndex !== undefined) {
            const answerButtons = document.querySelectorAll('button.answer-button');
            answerButtons.forEach((button, index) => {
                button.disabled = true;
                if (index === message.correctIndex) {
                    button.classList.add('correct');
                } else if (index === message.client) {
                    button.classList.add('incorrect');
                }
            });

            setTimeout(() => {
                if (perguntasRespondidas < totalPerguntas) {
                    novaPergunta();
                } else {
                    pararTempo();
                    perguntas.textContent = 'Parabéns! Você respondeu todas as perguntas.';
                }
            }, 2000);
        } else if (message.pontuacao !== undefined) {
            pontuacao = message.pontuacao;
            pontuacaoTotal.textContent = `Pontuação: ${pontuacao}`;
        } else if (message.scores) {
            atualizar(message.scores);
        } else if (message.totalPerguntas !== undefined) {
            totalPerguntas = message.totalPerguntas;
        }
    };

    ws.onclose = () => {
        console.log('Desconectado do servidor WebSocket');
        pararTempo();
    };

    ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
    };

    function novaPergunta() {
        ws.send(JSON.stringify({ nextQuestion: true }));
    }

    function atualizar(scores) {
        scores.sort((a, b) => a.clientId - b.clientId);
        pontuacaoTabela.innerHTML = `
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

    function iniciarTempo() {
        clearInterval(timer);
        timer = setInterval(() => {
            timeTela--;
            if (timeTela <= 0) {
                pararTempo();
                desativarBotao();
            }
            atualizarTempo();
        }, 1000);
    }

    function pararTempo() {
        clearInterval(timer);
        timeTela = 0;
        atualizarTempo();
    }

    function desativarBotao() {
        const answerButtons = document.querySelectorAll('button.answer-button');
        answerButtons.forEach(button => {
            button.disabled = true;
        });
        perguntas.textContent = 'Tempo esgotado! Você não pode mais responder.';
    }

    function atualizarTempo() {
        document.getElementById('timer').textContent = `Tempo restante: ${timeTela}s`;
    }
});
