let recognition;
let voiceActive = false;
let voiceReady = false;

let data = [];
let startTime = 0;

let uiTimer = null;
let devTimer = null;

let firstCrackTime = null;

// ---------------- CHART ----------------

const ctx = document.getElementById("chart").getContext("2d");

const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Temp",
        data: [],
        borderColor: "#ffcc00",
        tension: 0.3
      },
      {
        label: "RoR",
        data: [],
        borderColor: "#00ccff",
        tension: 0.3
      }
    ]
  }
});

// ---------------- VOICE ----------------

function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SR();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    const text = e.results[e.results.length - 1][0].transcript;
    handleSpeech(text);
  };

  recognition.onend = () => {
    if (voiceActive) recognition.start();
  };

  recognition.start();
  voiceActive = true;

  document.getElementById("status").innerText = "Voice initializing...";
}

// ---------------- READY ----------------

function setVoiceReady() {
  if (voiceReady) return;
  voiceReady = true;

  document.getElementById("status").innerText = "Ready";
  speak("Ready");
  document.getElementById("startBtn").disabled = false;
}

// ---------------- START ----------------

function startRoast() {
  data = [];
  startTime = Date.now();
  firstCrackTime = null;

  chart.data.labels = [];
  chart.data.datasets.forEach(d => d.data = []);
  chart.update();

  document.getElementById("date").innerText =
    new Date().toLocaleDateString();

  document.getElementById("status").innerText = "Roast Running";

  uiTimer = setInterval(updateTimer, 1000);
  devTimer = setInterval(updateDevStrip, 1000);

  setTimeout(() => speak("Temperature"), 800);
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

  const sec = Math.floor((firstCrackTime - startTime) / 1000);

  document.getElementById("fcTime").innerText = formatTime(sec);

  speak("First Crack recorded");
}

// ---------------- DEV STRIP (FIXED + ALWAYS RENDERING) ----------------

function updateDevStrip() {

  const stripEl = document.getElementById("devStrip");

  if (!firstCrackTime) {
    stripEl.innerText = "Waiting for First Crack...";
    return;
  }

  const totalSec = (Date.now() - startTime) / 1000;
  const devSec = (Date.now() - firstCrackTime) / 1000;

  const milestones = [15, 17.5, 20, 22.5, 25];

  const strip = milestones.map(pct => {
    const sec = (pct / 100) * devSec;
    return `${pct}% (${formatTime(sec)})`;
  }).join("   |   ");

  stripEl.innerText = strip;

  const pct = ((devSec / totalSec) * 100);

  document.getElementById("devPct").innerText =
    `${pct.toFixed(1)}% (${formatTime(devSec)})`;

  document.getElementById("devTime").innerText =
    formatTime(devSec);
}

// ---------------- TEMP ----------------

function handleSpeech(text) {
  if (!text) return;

  text = text.toLowerCase();

  if (!voiceReady) setVoiceReady();

  if (text.includes("first crack")) {
    markFirstCrack();
    return;
  }

  const temp = parseNumber(text);
  if (temp !== null) logTemp(temp);
}

function logTemp(temp) {
  const t = Math.floor((Date.now() - startTime) / 1000);

  data.push({ time: t, temp });

  chart.data.labels.push(t + "s");
  chart.data.datasets[0].data.push(temp);

  updateRoR();
  chart.update();

  document.getElementById("temp").innerText = "Temp: " + temp;
}

// ---------------- RoR ----------------

function updateRoR() {
  if (data.length < 2) return;

  const a = data[data.length - 1];
  const b = data[data.length - 2];

  const dt = (a.time - b.time) / 60;
  if (dt === 0) return;

  const ror = (a.temp - b.temp) / dt;

  chart.data.datasets[1].data.push(ror);

  document.getElementById("ror").innerText =
    "RoR: " + ror.toFixed(1);
}

// ---------------- STOP ----------------

function stopRoast() {
  voiceActive = false;
  if (recognition) recognition.stop();

  clearInterval(uiTimer);
  clearInterval(devTimer);

  const total = Math.floor((Date.now() - startTime) / 1000);

  document.getElementById("totalTime").innerText = formatTime(total);

  const dev = firstCrackTime
    ? Math.floor((Date.now() - firstCrackTime) / 1000)
    : 0;

  document.getElementById("devTime").innerText = formatTime(dev);

  const pct = firstCrackTime ? ((dev / total) * 100).toFixed(1) : "--";

  document.getElementById("devPct").innerText =
    firstCrackTime ? `${pct}% (${formatTime(dev)})` : "--";

  speak("Roast complete");
}

// ---------------- HELPERS ----------------

function speak(text) {
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function formatTime(sec) {
  sec = Math.floor(sec);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function parseNumber(text) {
  const match = text.match(/\d+/);
  if (match) return parseInt(match[0]);
  return null;
}
