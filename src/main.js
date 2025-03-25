import Alpine from "alpinejs";
window.Alpine = Alpine;

const allItemIds = Object.keys(import.meta.glob("../public/brainrot/*.webp")).map((path) =>
  path.split("/").pop().split(".").shift(),
);

Alpine.data("app", () => ({
  screen: "start",
  gameMode: "all",
  totalQuestions: 5,

  questions: [],
  usedCorrectAnswers: [],

  currentQuestion: null,
  currentQuestionIndex: 0,
  selectedOptionId: null,
  audioSource: undefined,

  progress: 0,
  lives: 3,
  score: 0,
  resultMessage: "",

  gameModeOptions: [
    { label: "All in!", value: "all" },
    { label: "Text only", value: "text" },
    { label: "Audio only", value: "audio" },
  ],

  numberOfQuestionsOptions: [5, 10, 15, 20],

  get audioEnabled() {
    return this.gameMode === "all" || this.gameMode === "audio";
  },

  get textEnabled() {
    return this.gameMode === "all" || this.gameMode === "text";
  },

  get formattedScore() {
    return `${this.score}/${this.totalQuestions}`;
  },

  initQuiz() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.lives = 3;

    this.generateQuestions();
    this.updateQuestion();
    this.screen = "quiz";
  },

  generateQuestions() {
    this.questions = [];
    this.usedCorrectAnswers = [];

    for (let i = 0; i < this.totalQuestions; i++) {
      const availableItemIds = allItemIds.filter((id) => !this.usedCorrectAnswers.includes(id));

      const correctIndex = Math.floor(Math.random() * availableItemIds.length);
      const correctOptionId = availableItemIds[correctIndex];
      const correctOptionWords = correctOptionId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

      const poolOptionIds = [...availableItemIds];
      poolOptionIds.splice(correctIndex, 1);

      shuffleArray(poolOptionIds);
      const wrongOptions = poolOptionIds.slice(0, 3);

      const optionIds = [...wrongOptions, correctOptionId];
      shuffleArray(optionIds);

      this.usedCorrectAnswers.push(correctOptionId);
      this.questions.push({
        optionIds,
        correctOptionId,
        correctOptionWords,
      });
    }
  },

  updateQuestion() {
    this.selectedOptionId = null;
    this.currentQuestion = this.questions[this.currentQuestionIndex];
    this.progress = Math.round((this.currentQuestionIndex / this.questions.length) * 100);

    if (this.currentQuestionIndex === 0) {
      this.playQuestionAudio();
    } else {
      setTimeout(() => this.playQuestionAudio(), 500);
    }
  },

  async playAudio(source) {
    if (source !== undefined) {
      this.audioSource = source;
      await this.$refs.audio.load();
    }

    this.$refs.audio.pause();
    this.$refs.audio.currentTime = 0;

    const playPromise = this.$refs.audio.play();
    playPromise?.catch(() => {});
  },

  playQuestionAudio() {
    if (this.audioEnabled) {
      const audioSource = `/brainrot/${this.currentQuestion.correctOptionId}.mp3`;
      this.playAudio(audioSource);
    }
  },

  checkAnswer() {
    const isCorrect = this.selectedOptionId === this.currentQuestion.correctOptionId;
    if (isCorrect) {
      this.playAudio("/effects/good.mp3");
      this.score++;
    } else {
      this.playAudio("/effects/bad.mp3");
      this.lives--;
    }

    if (this.lives <= 0) {
      setTimeout(() => this.playAudio('/effects/defeat.mp3'), 500);
      this.showResults();
      return;
    }

    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= this.totalQuestions) {
      setTimeout(() => this.playAudio('/effects/victory.mp3'), 500);
      this.showResults();
      return;
    }

    this.updateQuestion();
  },

  showResults() {
    if (this.score === this.totalQuestions) {
      this.resultMessage = "Perfetto! You're a true Italian brainrot master!";
    } else if (this.score >= this.totalQuestions / 2) {
      this.resultMessage = "Molto bene! You're getting there!";
    } else {
      this.resultMessage = "Mamma mia! Better luck next time!";
    }

    this.screen = "results";
  },

  getSocialButtonOptions() {
    const shareText = encodeURIComponent(
      `Can you guess the Italian brainrot memes? I got ${this.formattedScore} right! 🐘🐊🏜️👢🦈`,
    );
    const shareUrl = encodeURIComponent(window.location.href);
    const shareHashtags = encodeURIComponent("duolinguiniquizzini,brainrot,italian,memes");
    const xUrl = `https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}&hashtags=${shareHashtags}`;

    return [
      { alt: "Share on Twitter", icon: "x", href: xUrl },
      { alt: "Buy Me A Coffee", icon: "bmc", href: "https://buymeacoffee.com/josepdecid" },
      {
        alt: "Contribute on GitHub",
        icon: "github",
        href: "https://github.com/josepdecid/duolinguini-quizzini",
      },
    ];
  },
}));

Alpine.start();

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
