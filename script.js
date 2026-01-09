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

let comboStreak = 0;
let lastHitTime = 0;

// --- Sound + Vibration helpers ---
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Some browsers start audio "suspended" until a user gesture
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playHitSound(volume = 1.4) {
  ensureAudio();
  if (!audioCtx) return;

  const t0 = audioCtx.currentTime;

  // oscillator (tone)
  const osc = audioCtx.createOscillator();
  osc.type = "square"; // punchy
  osc.frequency.setValueAtTime(600, t0);
  osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.07);

  // gain (loudness envelope)
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);

  // compressor (keeps it loud without nasty clipping)
  const comp = audioCtx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-20, t0);
  comp.knee.setValueAtTime(24, t0);
  comp.ratio.setValueAtTime(10, t0);
  comp.attack.setValueAtTime(0.003, t0);
  comp.release.setValueAtTime(0.15, t0);

  osc.connect(gain);
  gain.connect(comp);
  comp.connect(audioCtx.destination);

  osc.start(t0);
  osc.stop(t0 + 0.13);
}

function vibrate(ms = 20) {
  // Works only on some mobile browsers/devices
  if (navigator.vibrate) navigator.vibrate(ms);
}

function vibrate(ms = 25) {
  // Only works on some mobile browsers/devices
  if (navigator.vibrate) navigator.vibrate(ms);
}


// Adjust this: how fast you must hit again to continue combo
const COMBO_WINDOW_MS = 900;

// Web Audio (no file needed)


// high score
const HS_KEY = "clickBoxHighScore";
let highScore = Number(localStorage.getItem(HS_KEY) || 0);
highEl.textContent = String(highScore);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getComboPoints(streak) {
  // “two in a row is 4 points etc.”
  // 1st hit: 2 points, 2nd: 4, 3rd: 8, 4th: 16...
  return Math.pow(2, streak);
}

function updateComboUI() {
  const comboEl = document.getElementById("comboText");
  if (!comboEl) return;
  comboEl.textContent = `Combo x${comboStreak}`;
}

function resetCombo() {
  comboStreak = 0;
  updateComboUI();
}

function playHitSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;

    // Some browsers need resume after first gesture
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(660, ctx.currentTime); // tone
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // If audio fails, game still works
  }
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
    resetCombo();
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
    playHitSound(0.95);
    vibrate(25);
  if (!running) return;

  const now = Date.now();

// combo continues only if hit again quickly enough
if (now - lastHitTime <= COMBO_WINDOW_MS) {
  comboStreak += 1;
} else {
  comboStreak = 1;
}

lastHitTime = now;

const points = getComboPoints(comboStreak);
score += points;

updateComboUI();
playHitSound(1.6);
vibrate(18);

  scoreEl.textContent = String(score);

  moveBox();
  applyDifficulty();
});

startBtn.addEventListener("click", startGame);
ensureAudio();
restartBtn.addEventListener("click", startGame);

// hide until start
box.style.left = "-9999px";
box.style.top = "-9999px";



