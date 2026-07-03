let recognition;
let voiceActive = false;
let voiceReady = false;

let data = [];
let startTime = 0;
let firstCrackTime = null;
let dropTime = null;

let timerInt = null;
let devInt = null;

// ---------------- CHART ----------------

const ctx = document.getElementById("chart").getContext("2d");

const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      { label: "Temp", data: [], borderColor: "#ffcc00", tension: 0.3 },
      { label: "RoR", data: [], borderColor: "#00ccff", tension: 0.3 }
    ]
  }
});

// ---------------- VOICE ----------------

function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SR();
  recognition.lang = "en-US";
  recognition.continuous = true;

  recognition.onresult = (e) => {
    const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
    handleSpeech(text);
  };

  recognition.onend = () => {
    if (voiceActive) recognition.start();
  };

  recognition.start();
  voiceActive = true;

  document.getElementById("status").innerText = "Ready";
  voiceReady = true;
  document.getElementById("startBtn").disabled = false;

  speak("Ready");
}

// ---------------- START ----------------

function startRoast() {
  data = [];
  startTime = Date.now();
  firstCrackTime = null;
  dropTime = null;

  chart.data.labels = [];
  chart.data.datasets.forEach(d => d.data = []);
  chart.update();

  document.getElementById("date").innerText = new Date().toLocaleDateString();

  timerInt = setInterval(updateTimer, 1000);
  devInt = setInterval(updateDevStrip, 1000);
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
  if (!firstCrackTime) {
    firstCrackTime = Date.now();
    document.getElementById("fcTime").innerText =
      formatTime((firstCrackTime - startTime) / 1000);
    speak("First crack");
  }
}

// ---------------- DROP (STOP = DROP) ----------------

function stopRoast() {
  dropTime = Date.now();

  clearInterval(timerInt);
  clearInterval(devInt);

  const total = (dropTime - startTime) / 1000;
  const dev = firstCrackTime ? (dropTime - firstCrackTime) / 1000 : 0;

  document.getElementById("totalTime").innerText = formatTime(total);
  document.getElementById("devTime").innerText = formatTime(dev);
  document.getElementById("devPct").innerText =
    firstCrackTime ? ((dev / total) * 100).toFixed(1) + "%" : "--";

  speak("Roast complete");
}

// ---------------- 🔥 CORE FIX: DEV STRIP ----------------

function updateDevStrip() {

  if (!firstCrackTime) {
    document.getElementById("devStrip").innerText =
      "Waiting for First Crack...";
    return;
  }

  const now = dropTime || Date.now();

  const devSec = (now - firstCrackTime) / 1000;

  // ORIGINAL STYLE MILESTONES
  const milestones = [15, 17.5, 20, 22.5, 25];

  const strip = milestones.map(pct => {
    const t = (pct / 100) * devSec;
    return `${pct}% (${formatTime(t)})`;
  }).join("   |   ");

  document.getElementById("devStrip").innerText = strip;
}

// ---------------- TEMP INPUT ----------------

function handleSpeech(text) {
  const temp = parseInt(text.match(/\d+/)?.[0]);
  if (!isNaN(temp)) logTemp(temp);
}

function logTemp(temp) {
  const t = (Date.now() - startTime) / 1000;

  data.push({ time: t, temp });

  chart.data.labels.push(Math.floor(t) + "s");
  chart.data.datasets[0].data.push(temp);

  chart.update();

  document.getElementById("temp").innerText = temp;
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
