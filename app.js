let startTime = 0;
let firstCrackTime = null;

let data = [];
let roastInterval;

const ctx = document.getElementById("chart").getContext("2d");

const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Temp",
      data: [],
      borderColor: "#ffcc00",
      tension: 0.3
    }]
  }
});

// ---------------- START ----------------

function startRoast() {
  startTime = Date.now();
  firstCrackTime = null;
  data = [];

  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.update();

  roastInterval = setInterval(() => {
    askTemp();
  }, 30000);

  askTemp();
  startTimer();
}

// ---------------- TIMER ----------------

function startTimer() {
  setInterval(() => {
    const sec = (Date.now() - startTime) / 1000;
    document.getElementById("timer").innerText =
      format(sec);
  }, 1000);
}

// ---------------- TEMP FLOW ----------------

function askTemp() {
  speak("Temperature");

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = "en-US";

  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const temp = parseInt(text.match(/\d+/)?.[0]);

    if (!isNaN(temp)) {
      logTemp(temp);
    }

    if (!firstCrackTime && text.toLowerCase().includes("first crack")) {
      markFirstCrack();
    }
  };

  rec.start();
}

// ---------------- FIRST CRACK ----------------

function markFirstCrack() {
  firstCrackTime = Date.now();

  const fcSec = (firstCrackTime - startTime) / 1000;

  document.getElementById("fc").innerText = format(fcSec);

  updateDevStrip();
}

// ---------------- STOP ----------------

function stopRoast() {
  clearInterval(roastInterval);

  const total = (Date.now() - startTime) / 1000;
  const dev = firstCrackTime
    ? (Date.now() - firstCrackTime) / 1000
    : 0;

  document.getElementById("dev").innerText = format(dev);
  document.getElementById("devPct").innerText =
    firstCrackTime ? ((dev / total) * 100).toFixed(1) + "%" : "--";

  updateDevStrip();
}

// ---------------- 🔥 FIXED DEV STRIP ----------------

function updateDevStrip() {

  const el = document.getElementById("devStrip");

  if (!firstCrackTime) {
    el.innerText = "Waiting for First Crack...";
    return;
  }

  const devSec = (Date.now() - firstCrackTime) / 1000;

  const milestones = [15, 17.5, 20, 22.5, 25];

  el.innerText = milestones.map(pct => {
    const t = (pct / 100) * devSec;
    return `${pct}% (${format(t)})`;
  }).join(" | ");
}

// ---------------- LOG TEMP ----------------

function logTemp(temp) {
  const t = (Date.now() - startTime) / 1000;

  data.push({ t, temp });

  chart.data.labels.push(Math.floor(t));
  chart.data.datasets[0].data.push(temp);

  chart.update();
}

// ---------------- HELPERS ----------------

function speak(text) {
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function format(sec) {
  sec = Math.floor(sec);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
