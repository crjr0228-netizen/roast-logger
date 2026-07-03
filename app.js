let recognition;
let voiceReady = false;

let startTime = 0;
let firstCrackTime = null;
let dropTime = null;

let timerInt;
let stripInt;

// ---------------- START VOICE ----------------

function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SR();
  recognition.lang = "en-US";
  recognition.continuous = true;

  recognition.onresult = (e) => {
    const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
    handleSpeech(text);
  };

  recognition.start();

  document.getElementById("status").innerText = "Ready";
  voiceReady = true;
  document.getElementById("startBtn").disabled = false;

  speak("Ready");
}

// ---------------- START ROAST ----------------

function startRoast() {
  startTime = Date.now();
  firstCrackTime = null;
  dropTime = null;

  document.getElementById("date").innerText =
    new Date().toLocaleDateString();

  timerInt = setInterval(updateTimer, 1000);
  stripInt = setInterval(updateDevStrip, 300);
}

// ---------------- TIMER ----------------

function updateTimer() {
  document.getElementById("timer").innerText =
    formatTime((Date.now() - startTime) / 1000);
}

// ---------------- FIRST CRACK ----------------

function markFirstCrackManual() {
  markFirstCrack();
}

function markFirstCrack() {
  if (!startTime) return;

  firstCrackTime = Date.now();

  document.getElementById("fcTime").innerText =
    formatTime((firstCrackTime - startTime) / 1000);

  speak("First crack");
}

// ---------------- STOP (DROP) ----------------

function stopRoast() {
  dropTime = Date.now();

  clearInterval(timerInt);
  clearInterval(stripInt);

  const total = (dropTime - startTime) / 1000;
  const dev = firstCrackTime
    ? (dropTime - firstCrackTime) / 1000
    : 0;

  document.getElementById("totalTime").innerText = formatTime(total);
  document.getElementById("devTime").innerText = formatTime(dev);

  document.getElementById("devPct").innerText =
    firstCrackTime ? ((dev / total) * 100).toFixed(1) + "%" : "--";

  speak("Roast complete");
}

// ---------------- 🔥 GUARANTEED DEV STRIP ----------------

function updateDevStrip() {

  const el = document.getElementById("devStrip");

  if (!firstCrackTime) {
    el.innerText = "Waiting for First Crack...";
    return;
  }

  const now = dropTime || Date.now();

  const devSec = (now - firstCrackTime) / 1000;

  // FIXED ORIGINAL MILESTONES
  const milestones = [15, 17.5, 20, 22.5, 25];

  let output = "";

  for (let i = 0; i < milestones.length; i++) {
    const pct = milestones[i];
    const time = (pct / 100) * devSec;

    output += `${pct}% (${formatTime(time)})`;

    if (i < milestones.length - 1) output += "   |   ";
  }

  el.innerText = output;
}

// ---------------- SPEECH ----------------

function handleSpeech(text) {
  if (text.includes("first crack")) {
    markFirstCrack();
  }
}

// ---------------- HELPERS ----------------

function speak(t) {
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(t));
}

function formatTime(sec) {
  sec = Math.floor(sec);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
