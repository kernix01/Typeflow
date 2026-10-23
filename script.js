const typingInput = document.querySelector("#typingInput");
const typingText = document.querySelector("#typingText");
const resetButton = document.querySelector("#resetButton");
const nextTextButton = document.querySelector("#nextTextButton");
const languageSelect = document.querySelector("#language");
const modeSelect = document.querySelector("#mode");
const speedValue = document.querySelector("#speedValue");
const accuracyValue = document.querySelector("#accuracyValue");
const mistakesValue = document.querySelector("#mistakesValue");
const timeValue = document.querySelector("#timeValue");
const typedCharacters = document.querySelector("#typedCharacters");
const totalCharacters = document.querySelector("#totalCharacters");
const bestSpeedValue = document.querySelector("#bestSpeedValue");
const progressValue = document.querySelector(".progress-value");
const statusText = document.querySelector("#statusText");

let bestSpeed = Number(localStorage.getItem(getBestSpeedKey())) || 0;
bestSpeedValue.textContent = bestSpeed;

let loadedWords = [];
let loadedTexts = [];
let currentText = "";
let mistakes = 0;
let startTime = null;
let timerId = null;
let isStarted = false;

// делает функцию асинхронной и разрешает использовать await, функция возвращает promise(обещание результата в будущем)
async function loadData() {
    statusText.textContent = "Загрузка...";
    typingInput.disabled = true;
    resetButton.disabled = true;
    nextTextButton.disabled = true;
    
    // Выполняем код, в котором может возникнуть ошибка, Если ошибка возникнет, управление перейдёт в catch
    try {
        const language = languageSelect.value;

        const mode = modeSelect.value;

        let filePath;

        if (mode === "words") {
            if (language === "ru") {
                filePath = "./data/russian.json";
            } else {
                filePath = "./data/english.json";
            }
        } else {
            if (language === "ru") {
                filePath = "./data/russian-texts.json";
            } else {
                filePath = "./data/english-texts.json";
            }
        }

        const response = await fetch(filePath);
        // проверяет HTTP-статус. Значение true обычно означает статус от 200 до 299. При 404 или 500 оно будет false
        if (!response.ok) throw new Error("HTTP " + response.status);

        // Преобразует JSON из тела ответа в JS-объект
        const data = await response.json();
        
        const items = mode === "words"
        ? data.words
        : data.texts;

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("JSON не содержит данных");
        }

        if (mode === "words") {
            loadedWords = items;
        } else {
            loadedTexts = items;
        }

        generateText();

        statusText.textContent = "Тренировка готова";
        resetButton.disabled = false;
        nextTextButton.disabled = false;
    }  catch (error) { // Он выполняется, если внутри try возникла ошибка. Ошибка выводится в консоль, а интерфейс получает состояние error
        console.error(error);
        
        statusText.textContent = "Не удалось загрузить данные";
    }
}

let previousWordIndex = -1;

function randomWords() {
    let randomIndex

    do {
        randomIndex = Math.floor(Math.random() * loadedWords.length);
    } while (loadedWords.length > 1 && randomIndex === previousWordIndex);

    previousWordIndex = randomIndex;

    const randomWord = loadedWords[randomIndex];

    return randomWord;
}

function generateText() {
    if (modeSelect.value === "words") { 
    const words = [];

    for (let i = 0; i < 25; i++) {
        words.push(randomWords());
    }

    currentText = words.join(" ");
} else {
    const randomIndex = Math.floor(Math.random() * loadedTexts.length);

    currentText = loadedTexts[randomIndex];
}

    typingInput.maxLength = currentText.length;

    typingText.textContent = "";

    for (let i = 0; i < currentText.length; i++) {
        const characterSpan = document.createElement("span");

        characterSpan.textContent = currentText[i];
        
        typingText.appendChild(characterSpan);

    }

    totalCharacters.textContent = currentText.length;

    typingInput.value = "";

    typedCharacters.textContent = 0;

    mistakes = 0;
    
    mistakesValue.textContent = 0;

    progressValue.style.width = "0%";
    
    speedValue.textContent = 0;
    
    accuracyValue.textContent = "100%";

    statusText.textContent = "Тренировка готова";
    
    clearInterval(timerId);
    timerId = null;
    isStarted = false;
    startTime = null;
    timeValue.textContent = "00:00";
    typingInput.disabled = false;

    const firstCharacterSpan = typingText.querySelector("span");

    if (firstCharacterSpan) {
        firstCharacterSpan.classList.add("current");
    }
}

function updateTimer() {
    const elapsedMilliseconds = Math.floor(Date.now() - startTime);
    
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    const minutes = Math.floor(elapsedSeconds / 60);

    const seconds = elapsedSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, "0");

    const formattedSeconds = String(seconds).padStart(2, "0");
    
    timeValue.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

function getBestSpeedKey() {
    return `typingBestSpeed-${languageSelect.value}`;
}



typingInput.addEventListener("input", () => {
    mistakes = 0;
    
    const typed = typingInput.value;

    typedCharacters.textContent = typed.length;

    if (!isStarted && typed.length > 0) {
        isStarted = true;

        startTime = Date.now();

        timerId = setInterval(updateTimer, 1000);
    }

    const progress = (typed.length / currentText.length) * 100;

    progressValue.style.width = progress + "%";

    const characterSpans = typingText.querySelectorAll("span");

    for (let i = 0; i < characterSpans.length; i++) {
        characterSpans[i].classList.remove("incorrect");
        characterSpans[i].classList.remove("correct");
        characterSpans[i].classList.remove("current");
    }
    
    for (let i = 0; i < typed.length; i++) {
        if (typed[i] !== currentText[i]) {
            mistakes += 1;

            characterSpans[i].classList.add("incorrect");
        } else {
            characterSpans[i].classList.add("correct");
        }
    }

    const currentIndex = typed.length;

    if (currentIndex < characterSpans.length) {
        characterSpans[currentIndex].classList.add("current");
    }

    mistakesValue.textContent = mistakes;

    let accuracy;

    if (typed.length > 0) {
        accuracy = Math.round (
            ((typed.length - mistakes) / typed.length) * 100
        );
    } else {
        accuracy = 100;
    }

    accuracyValue.textContent = accuracy + "%";

    if (isStarted) {
        const elapsedMilliseconds = Math.max(Date.now() - startTime, 1000);
        const elapsedMinutes = elapsedMilliseconds / 60000;
        
        const correctCharacters = typed.length - mistakes;

        const speed = Math.round((correctCharacters / 5) / elapsedMinutes);

        speedValue.textContent = speed;
    }

    if (typed.length === currentText.length) {
        updateTimer();
        clearInterval(timerId);
        timerId = null;
        isStarted = false;
        typingInput.disabled = true;
        statusText.textContent = "Попытка завершена";

        const finalSpeed = Number(speedValue.textContent);

        if (finalSpeed > bestSpeed) {
            bestSpeed = finalSpeed;

            bestSpeedValue.textContent = bestSpeed;

            localStorage.setItem(getBestSpeedKey(), bestSpeed);
        }
    }
});

resetButton.addEventListener("click", () => {
    typingInput.value = "";
    typedCharacters.textContent = 0;
    mistakes = 0;
    mistakesValue.textContent = 0;
    progressValue.style.width = "0%";
    speedValue.textContent = 0;
    accuracyValue.textContent = "100%";
    statusText.textContent = "Тренировка готова";

    clearInterval(timerId);
    timerId = null;
    startTime = null;
    isStarted = false;
    timeValue.textContent = "00:00";
    typingInput.disabled = false;

    const characterSpans = typingText.querySelectorAll("span");

    for (let i = 0; i < characterSpans.length; i++) {
        characterSpans[i].classList.remove("incorrect");
        characterSpans[i].classList.remove("correct");
        characterSpans[i].classList.remove("current");
    }
    
    const firstCharacterSpan = typingText.querySelector("span");

    if (firstCharacterSpan) {
        firstCharacterSpan.classList.add("current");
    }
});

languageSelect.addEventListener("change", () => {
    bestSpeed = Number(localStorage.getItem(getBestSpeedKey())) || 0;
    bestSpeedValue.textContent = bestSpeed;
    
    loadData();
});

modeSelect.addEventListener("change", () => {
    loadData();
})

nextTextButton.addEventListener("click", () => {
    generateText();
});

loadData();
