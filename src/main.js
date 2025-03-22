import { brainrot } from "./brainrot";

// App state
let currentQuestion = 0;
let currentQuestionAudioSource = null;
let selectedAnswer = null;
let score = 0;
let lives = 3;
let totalQuestions = 5;
let questions = [];
let usedCorrectAnswers = [];

// DOM elements
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");
const progressBar = document.getElementById("progress-bar");
const livesCount = document.getElementById("lives-count");
const resultsLivesCount = document.getElementById("results-lives-count");
const phraseElement = document.getElementById("phrase");
const audioButton = document.getElementById("audio-button");
const checkButton = document.getElementById("check-button");
const optionButtons = document.querySelectorAll(".option-button");
const finalScore = document.getElementById("final-score");
const resultsMessage = document.getElementById("results-message");
const tryAgainButton = document.getElementById("try-again-button");
const audioPlayer = document.getElementById("audio-player");
const shareButton = document.getElementById("share-button");

// Game logic
document.addEventListener("DOMContentLoaded", initQuiz);
function initQuiz() {
  generateQuestions();
  updateQuestion();
  updateLives();
  updateProgress();

  audioButton.addEventListener("click", playQuestionSound);
  checkButton.addEventListener("click", handleCheckAnswer);
  tryAgainButton.addEventListener("click", resetQuiz);

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.dataset.index);
      handleAnswerClick(index);
    });
  });

  setTimeout(playQuestionSound, 500);
}

function generateQuestions() {
  questions = [];
  usedCorrectAnswers = [];

  for (let i = 0; i < totalQuestions; i++) {
    const availableItems = brainrot.filter((item) => !usedCorrectAnswers.includes(item.id));

    const correctIndex = Math.floor(Math.random() * availableItems.length);
    const correctItem = availableItems[correctIndex];
    usedCorrectAnswers.push(correctItem.id);

    const optionsPool = [...availableItems];
    optionsPool.splice(correctIndex, 1);

    shuffleArray(optionsPool);
    const wrongOptions = optionsPool.slice(0, 3);

    const allOptions = [...wrongOptions, correctItem];
    shuffleArray(allOptions);

    const correctAnswerIndex = allOptions.findIndex((item) => item.id === correctItem.id);

    questions.push({
      id: correctItem.id,
      phrase: correctItem.phrase,
      options: allOptions.map((item) => item.id),
      correctAnswer: correctAnswerIndex,
    });
  }
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function updateQuestion() {
  const question = questions[currentQuestion];

  phraseElement.innerHTML = "";
  const words = question.phrase.split(" ");

  words.forEach((word, index) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";
    wordSpan.textContent = word;

    phraseElement.appendChild(wordSpan);
    if (index < words.length - 1) {
      phraseElement.appendChild(document.createTextNode(" "));
    }
  });

  optionButtons.forEach((button, index) => {
    const optionId = question.options[index];
    const img = button.querySelector(".option-image");

    button.classList.add("loading");
    img.src = `/brainrot/${optionId}.webp`;
    img.alt = optionId;

    img.onload = () => {
      button.classList.remove("loading");
    };
  });

  currentQuestionAudioSource = `/brainrot/${question.id}.mp3`;

  selectedAnswer = null;
  optionButtons.forEach((button) => {
    button.classList.remove("selected");
  });

  checkButton.disabled = true;
}

function updateLives() {
  livesCount.textContent = lives;
  resultsLivesCount.textContent = lives;
}

function updateProgress() {
  const progress = Math.round((currentQuestion / questions.length) * 100);
  progressBar.style.width = `${progress}%`;
}

function playAudio(source) {
  if (source !== undefined) {
    audioPlayer.src = source;
    audioPlayer.load();
  }

  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  audioPlayer.onended = () => {
    audioButton.classList.remove("playing");
  };

  const playPromise = audioPlayer.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        audioButton.classList.add("playing");
      })
      .catch((error) => {
        console.error("Audio playback failed:", error);
      });
  }
}

function playQuestionSound() {
  playAudio(currentQuestionAudioSource);
}

function handleAnswerClick(answerIndex) {
  selectedAnswer = answerIndex;
  optionButtons.forEach((button, index) => {
    if (index === answerIndex) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
  });

  checkButton.disabled = false;
}

function handleCheckAnswer() {
  const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
  playAudio(`/effects/${isCorrect ? "good" : "bad"}.mp3`);

  if (!isCorrect) {
    lives--;
    updateLives();

    if (lives <= 0) {
      playAudio("/effects/defeat.mp3");
      showResults();
      return;
    }
  } else {
    score++;
  }

  currentQuestion++;
  if (currentQuestion < questions.length) {
    updateQuestion();
    updateProgress();
    setTimeout(playQuestionSound, 500);
  } else {
    playAudio("/effects/victory.mp3");
    showResults();
  }
}

function showResults() {
  quizScreen.classList.add("hidden");
  resultsScreen.classList.remove("hidden");

  finalScore.textContent = `${score}/${questions.length}`;

  if (score === questions.length) {
    resultsMessage.textContent =
      "Perfetto! You're a true Italian brainrot master!";
  } else if (score >= questions.length / 2) {
    resultsMessage.textContent = "Molto bene! You're getting there!";
  } else {
    resultsMessage.textContent = "Mamma mia! Better luck next time!";
  }
}

function resetQuiz() {
  currentQuestion = 0;
  selectedAnswer = null;
  score = 0;
  lives = 3;

  generateQuestions();

  updateQuestion();
  updateLives();
  updateProgress();

  resultsScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  setTimeout(playQuestionSound, 500);
}

shareButton.addEventListener('click', () => {
  const shareText = encodeURIComponent(`Can you guess the Italian brainrot memes? I got ${score}/${totalQuestions} right! 🐘🐊🏜️👢🦈`);
  const shareUrl = encodeURIComponent(window.location.href);
  const shareHashtags = encodeURIComponent('duolinguiniquizzini,brainrot,italian,memes');
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}${shareHashtags ? '&hashtags=' + shareHashtags : ''}`;
  window.open(twitterUrl, '_blank', 'width=550,height=420');
});
