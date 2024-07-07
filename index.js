document.addEventListener("DOMContentLoaded", function () {

    let score = 0;
    let highestScore = localStorage.getItem("highestScore") || 0;
    let timer;
    let countdown;
    let currentWord = '';
    const usedWords = new Set();
    const startButton = document.getElementById("start-btn");
    const stopButton = document.getElementById("stop-btn");
    const restartButton = document.getElementById("restart-btn");
    const submitButton = document.getElementById("submit-btn");
    const userInput = document.getElementById("user-input");
    const wordDisplay = document.getElementById("word-display");
    const scoreDisplay = document.getElementById("score");
    const highestScoreDisplay = document.getElementById("highest-score");
    const timerDisplay = document.getElementById("timer");
    const messageDisplay = document.getElementById("message");
    const meaningDisplay = document.getElementById("meaning-display");
    const gameplaySection = document.getElementById("gameplay");

    highestScoreDisplay.textContent = "Highest Score: " + highestScore;

    startButton.addEventListener("click", startGame);
    stopButton.addEventListener("click", stopGame);
    restartButton.addEventListener("click", restartGame);
    submitButton.addEventListener("click", submitWord);

    function startGame() {
        startButton.disabled = true;
        stopButton.disabled = false;
        restartButton.disabled = false;
        userInput.disabled = false;
        submitButton.disabled = false;
        gameplaySection.style.display = "block";
        messageDisplay.textContent = "";
        meaningDisplay.textContent = "";
        score = 0;
        usedWords.clear();
        scoreDisplay.textContent = "Score: " + score;
        startTimer();
    }

    function stopGame() {
        clearInterval(countdown);
        startButton.disabled = false;
        stopButton.disabled = true;
        restartButton.disabled = false;
        userInput.disabled = true;
        submitButton.disabled = true;
        gameplaySection.style.display = "none";
        messageDisplay.textContent = "Game stopped.";
        updateHighestScore();
    }

    function restartGame() {
        stopGame();
        startGame();
    }

    function startTimer() {
        clearInterval(countdown);
        timer = 30;
        timerDisplay.textContent = "Time: " + timer + "s";
        countdown = setInterval(function () {
            timer--;
            timerDisplay.textContent = "Time: " + timer + "s";
            if (timer <= 0) {
                clearInterval(countdown);
                computerTurn(true); // Pass true to indicate user timeout
            }
        }, 1000);
    }

    function submitWord() {
        const word = userInput.value.trim().toLowerCase();
        if (word && (!currentWord || word[0] === currentWord[currentWord.length - 1])) {
            if (usedWords.has(word)) {
                messageDisplay.textContent = "You already entered this word. Try again.";
                return;
            }
            checkWordInDictionary(word)
                .then(isValid => {
                    if (isValid) {
                        usedWords.add(word);
                        currentWord = word;
                        wordDisplay.textContent = "User: " + currentWord;
                        fetchWordMeaning(word);
                        userInput.value = "";
                        score++;
                        scoreDisplay.textContent = "Score: " + score;
                        startTimer();
                        setTimeout(computerTurn, 2000);
                    } else {
                        messageDisplay.textContent = "The word is not in the dictionary. Try again.";
                    }
                })
                .catch(error => {
                    console.error('Error checking word:', error);
                    messageDisplay.textContent = "Error checking word. Try again.";
                });
        } else {
            messageDisplay.textContent = "Invalid word. Try again.";
        }
    }

    function checkWordInDictionary(word) {
        return fetch(`https://api.datamuse.com/words?sp=${word}&max=1`)
            .then(response => response.json())
            .then(data => data.length > 0)
            .catch(error => {
                console.error('Error fetching word:', error);
                return false;
            });
    }

    function fetchWordMeaning(word) {
        fetch(`https://api.datamuse.com/words?ml=${word}&md=d&max=1`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0 && data[0].defs) {
                    meaningDisplay.textContent = `Meaning of "${word}": ${data[0].defs.join(', ')}`;
                } else {
                    meaningDisplay.textContent = `No meaning found for "${word}".`;
                }
            })
            .catch(error => {
                console.error('Error fetching word meaning:', error);
                meaningDisplay.textContent = "Error fetching word meaning.";
            });
    }

    function computerTurn(userTimedOut = false) {
        const lastLetter = currentWord[currentWord.length - 1];
        fetch(`https://api.datamuse.com/words?sp=${lastLetter}*&max=1`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const word = data[0].word;
                    if (usedWords.has(word)) {
                        messageDisplay.textContent = "Computer wins! No valid words left.";
                        stopGame();
                        return;
                    }
                    usedWords.add(word);
                    currentWord = word;
                    wordDisplay.textContent = "Computer: " + currentWord;
                    fetchWordMeaning(word);
                    score++;
                    scoreDisplay.textContent = "Score: " + score;
                    if (userTimedOut) {
                        messageDisplay.textContent = "You lost! Time's up.";
                        stopGame();
                    } else {
                        startTimer();
                    }
                } else {
                    messageDisplay.textContent = "Computer wins! No valid words left.";
                    stopGame();
                }
            })
            .catch(error => {
                console.error('Error fetching word:', error);
                messageDisplay.textContent = "Error fetching word. Try again.";
            });
    }

    function updateHighestScore() {
        if (score > highestScore) {
            highestScore = score;
            localStorage.setItem("highestScore", highestScore);
            highestScoreDisplay.textContent = "Highest Score: " + highestScore;
        }
    }

    window.addEventListener("beforeunload", updateHighestScore);
});
