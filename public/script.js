const socket = new WebSocket('ws://localhost:8080');
let playerId;
let score = 0;
let gameBoard = document.getElementById('gameBoard');
let scoreDisplay = document.getElementById('score');
let timerDisplay = document.getElementById('timer'); // Elemento para mostrar el temporizador
let flippedCards = {};
let timeLeft = 60; // Tiempo en segundos

// Cargar sonidos
const correctSound = new Audio('sounds/correct.mp3');
const wrongSound = new Audio('sounds/wrong.mp3');
const backgroundMusic = new Audio('public\sounds\contador.mp3'); // Música de fondo
backgroundMusic.loop = true; // Repetir en bucle

// Permitir reproducción de música tras interacción del usuario
document.body.addEventListener('click', () => {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
    }
}, { once: true });

// Iniciar temporizador
function startTimer() {
    timerDisplay.innerText = timeLeft;
    let timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            backgroundMusic.pause(); // Detener música al finalizar
            alert('¡Tiempo agotado! Juego terminado.');
            socket.close();
        }
    }, 1000);
}

socket.onmessage = function(event) {
    let data = JSON.parse(event.data);
    if (data.type === 'init') {
        playerId = data.playerId;
        document.getElementById('playerId').innerText = playerId;
        createBoard(data.images);
        startTimer(); // Iniciar temporizador cuando inicie el juego
    } else if (data.type === 'flip') {
        flipCard(data.index, data.image);
    } else if (data.type === 'unflip') {
        setTimeout(() => {
            unflipCards(data.indexes);
            wrongSound.play(); // Sonido de fallo
        }, 1000);
    } else if (data.type === 'match') {
        if (data.playerId === playerId) {
            score = data.score;
            scoreDisplay.innerText = score;
        }
        setTimeout(() => {
            removeMatchedCards(data.indexes);
            correctSound.play(); // Sonido de acierto
        }, 1000);
    } else if (data.type === 'gameOver') {
        alert('¡Juego terminado! Recarga para jugar otra vez.');
    }
};

function createBoard(images) {
    gameBoard.innerHTML = '';
    images.forEach((_, index) => {
        let card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = index;
        let cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');
        let cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        cardFront.innerText = '?';
        let cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        cardBack.style.backgroundImage = "url('" + images[index] + "')";
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);
        card.addEventListener('click', () => sendFlip(index));
        gameBoard.appendChild(card);
    });
}

function sendFlip(index) {
    if (!flippedCards[index]) {
        socket.send(JSON.stringify({ type: 'flip', index }));
    }
}

function flipCard(index, image) {
    let card = document.querySelector(`[data-index="${index}"]`);
    card.classList.add('flipped');
    flippedCards[index] = true;
}

function unflipCards(indexes) {
    indexes.forEach(index => {
        let card = document.querySelector(`[data-index="${index}"]`);
        card.classList.remove('flipped');
        delete flippedCards[index];
    });
}

function removeMatchedCards(indexes) {
    indexes.forEach(index => {
        let card = document.querySelector(`[data-index="${index}"]`);
        setTimeout(() => card.remove(), 500);
    });
}