const brainrot = Object.keys(import.meta.glob('../public/brainrot/*.webp'))
  .map((path) => {
    const id = path.split('/').pop().split('.').shift();
    return {
      id,
      phrase: id.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    }
  });

const state = {
	questions: [],
	usedCorrectAnswers: [],
	currentQuestion: 0,
	currentQuestionAudioSource: null,
	selectedAnswer: null,
	score: 0,
	lives: 3,
};

const settings = {
	textEnabled: true,
	audioEnabled: true,
	totalQuestions: 5,
};

// DOM elements
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");

// Selectable buttons
const settingsGameModeButtons = document.querySelectorAll(
	"#settings-game-mode-buttons > button",
);
const optionButtons = document.querySelectorAll(".option-button");

const progressBar = document.getElementById("progress-bar");
const livesCount = document.getElementById("lives-count");
const phraseElement = document.getElementById("phrase");
const audioButton = document.getElementById("audio-button");
const finalScore = document.getElementById("final-score");
const resultsMessage = document.getElementById("results-message");
const playAgainButton = document.getElementById("play-again-button");
const audioPlayer = document.getElementById("audio-player");

const startButton = document.getElementById("start-button");
const checkButton = document.getElementById("check-button");
const shareButton = document.getElementById("share-button");

// Game logic
document.addEventListener("DOMContentLoaded", () => {
	settingsGameModeButtons.forEach((selectedButton, selectedIndex) => {
		selectedButton.addEventListener("click", () => {
			settings.textEnabled = selectedIndex !== 2;
			settings.audioEnabled = selectedIndex !== 1;

			settingsGameModeButtons.forEach((button, index) => {
				if (index === selectedIndex) {
					button.classList.add("selected");
				} else {
					button.classList.remove("selected");
				}
			});
		});
	});

	startButton.addEventListener("click", initQuiz);
});

function initQuiz() {
	applySettings();
	generateQuestions();
	updateQuestion();
	updateLives();
	updateProgress();

	startScreen.classList.add("hidden");
	quizScreen.classList.remove("hidden");

	audioButton.addEventListener("click", playQuestionSound);
	checkButton.addEventListener("click", handleCheckAnswer);
	playAgainButton.addEventListener("click", resetQuiz);

	for (const button of optionButtons) {
		button.addEventListener("click", () => {
			const index = Number.parseInt(button.dataset.index);
			handleAnswerClick(index);
		});
	}

	setTimeout(playQuestionSound, 500);
}

function applySettings() {
	if (settings.textEnabled) {
		phraseElement.classList.remove("hidden");
	} else {
		phraseElement.classList.add("hidden");
	}

	if (settings.audioEnabled) {
		audioButton.classList.remove("hidden");
	} else {
		audioButton.classList.add("hidden");
	}
}

function generateQuestions() {
	state.questions = [];
	state.usedCorrectAnswers = [];

	for (let i = 0; i < settings.totalQuestions; i++) {
		const availableItems = brainrot.filter(
			(item) => !state.usedCorrectAnswers.includes(item.id),
		);

		const correctIndex = Math.floor(Math.random() * availableItems.length);
		const correctItem = availableItems[correctIndex];
		state.usedCorrectAnswers.push(correctItem.id);

		const optionsPool = [...availableItems];
		optionsPool.splice(correctIndex, 1);

		shuffleArray(optionsPool);
		const wrongOptions = optionsPool.slice(0, 3);

		const allOptions = [...wrongOptions, correctItem];
		shuffleArray(allOptions);

		const correctAnswerIndex = allOptions.findIndex(
			(item) => item.id === correctItem.id,
		);

		state.questions.push({
			id: correctItem.id,
			phrase: correctItem.phrase,
			options: allOptions.map((item) => item.id),
			correctAnswer: correctAnswerIndex,
		});
	}
}

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}

function updateQuestion() {
	const question = state.questions[state.currentQuestion];

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
		const img = button.querySelector("img");

		button.classList.add("animation-pulse");
		img.src = `/brainrot/${optionId}.webp`;
		img.alt = optionId;

		img.onload = () => {
			button.classList.remove("animation-pulse");
		};
	});

	state.currentQuestionAudioSource = `/brainrot/${question.id}.mp3`;

  state.selectedAnswer = null;
	for (const button of optionButtons) {
		button.classList.remove("selected");
	}

	checkButton.disabled = true;
}

function updateLives() {
	livesCount.textContent = state.lives;
}

function updateProgress() {
	const progress = Math.round((state.currentQuestion / state.questions.length) * 100);
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
	if (settings.audioEnabled) {
		playAudio(state.currentQuestionAudioSource);
	}
}

function handleAnswerClick(answerIndex) {
	state.selectedAnswer = answerIndex;
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
	const isCorrect = state.selectedAnswer === state.questions[state.currentQuestion].correctAnswer;
	playAudio(`/effects/${isCorrect ? "good" : "bad"}.mp3`);

	if (!isCorrect) {
		state.lives--;
		updateLives();

		if (state.lives <= 0) {
			playAudio("/effects/defeat.mp3");
			showResults();
			return;
		}
	} else {
		state.score++;
	}

	state.currentQuestion++;
	if (state.currentQuestion < state.questions.length) {
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

	finalScore.textContent = `${state.score}/${state.questions.length}`;

	if (state.score === state.questions.length) {
		resultsMessage.textContent =
			"Perfetto! You're a true Italian brainrot master!";
	} else if (state.score >= state.questions.length / 2) {
		resultsMessage.textContent = "Molto bene! You're getting there!";
	} else {
		resultsMessage.textContent = "Mamma mia! Better luck next time!";
	}
}

function resetQuiz() {
  state.currentQuestion = 0;
  state.selectedAnswer = null;
  state.score = 0;
  state.lives = 3;

	generateQuestions();

	updateQuestion();
	updateLives();
	updateProgress();

	resultsScreen.classList.add("hidden");
	quizScreen.classList.remove("hidden");

	setTimeout(playQuestionSound, 500);
}

shareButton.addEventListener("click", () => {
	const shareText = encodeURIComponent(
		`Can you guess the Italian brainrot memes? I got ${state.score}/${settings.totalQuestions} right! 🐘🐊🏜️👢🦈`,
	);
	const shareUrl = encodeURIComponent(window.location.href);
	const shareHashtags = encodeURIComponent(
		"duolinguiniquizzini,brainrot,italian,memes",
	);
	const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}${shareHashtags ? `&hashtags=${shareHashtags}` : ""}`;
	window.open(twitterUrl, "_blank", "width=550,height=420");
});
