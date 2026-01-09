const box = document.getElementById("box");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const highEl = document.getElementById("highScore");
const gameArea = document.getElementById("game-area");

const startBtn = document.getElementById("startBtn");
const overlay = document.getElementById("overlay");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");

let score = 0;
let timeLeft = 30;
let timerId = null;
let running = false;

// difficulty state
let moveIntervalId = null;
let boxSize = 50;
let moveDelay = 900;

// high score
const HS_KEY = "clickBoxHighScore";
let highScore = Number(localStorage.getItem(HS_KEY) || 0);
highEl.textContent = String(highScore);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function moveBox() {
  const maxX = gameArea.clientWidth - box.clientWidth;
  const maxY = gameArea.clientHeight - box.clientHeight;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  box.style.left = x + "px";
  box.style.top = y + "px";
}

function applyDifficulty() {
  boxSize = clamp(50 - score * 2, 18, 50);
  box.style.width = boxSize + "px";
  box.style.height = boxSize + "px";

  moveDelay = clamp(900 - score * 35, 250, 900);

  if (moveIntervalId) clearInterval(moveIntervalId);
  moveIntervalId = setInterval(() => {
    if (running) moveBox();
  }, moveDelay);
}

function startGame() {
  score = 0;
  timeLeft = 30;
  running = true;

  scoreEl.textContent = "0";
  timeEl.textContent = String(timeLeft);
  overlay.style.display = "none";
  startBtn.disabled = true;

  // reset difficulty
  boxSize = 50;
  moveDelay = 900;
  box.style.width = "50px";
  box.style.height = "50px";

  moveBox();

  if (timerId) clearInterval(timerId);
  if (moveIntervalId) clearInterval(moveIntervalId);

  timerId = setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = String(timeLeft);
    if (timeLeft <= 0) endGame();
  }, 1000);

  moveIntervalId = setInterval(() => {
    if (running) moveBox();
  }, moveDelay);
}

function endGame() {
  running = false;

  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  if (moveIntervalId) {
    clearInterval(moveIntervalId);
    moveIntervalId = null;
  }

  // update high score if needed
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(HS_KEY, String(highScore));
    highEl.textContent = String(highScore);
  }

  startBtn.disabled = false;

  finalScoreEl.textContent = String(score);
  overlay.style.display = "grid";
}

box.addEventListener("click", () => {
  if (!running) return;

  score += 1;
  scoreEl.textContent = String(score);

  moveBox();
  applyDifficulty();
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

// hide until start
box.style.left = "-9999px";
box.style.top = "-9999px";
