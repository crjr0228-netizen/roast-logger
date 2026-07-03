let startTime = 0;
let firstCrackTime = null;
let dropTime = null;

let roastInterval = null;

// ---------------- CHART ----------------

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
  dropTime = null;

  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.update();

  document.getElementById("status").innerText = "Running";

  roastInterval = setInterval(() => {
    askTemp();
  }, 30000);

  askTemp();
}

// ---------------- FIRST CRACK ----------------

function markFirstCrack() {
  if (!startTime) return;

  firstCrackTime = Date.now();

  const fcSec = (firstCrackTime - startTime) / 1000;

  document.getElementById("fc").innerText = format(fcSec);

  speak("First crack");

  updateDevStrip();
}

// ---------------- STOP ----------------

function stopRoast() {
  dropTime = Date.now();

  clearInterval(roastInterval);

  const total = (dropTime - startTime) / 1000;
  const dev = firstCrackTime ? (dropTime - firstCrackTime) / 1000 : 0;

  document.getElementById("dev").innerText = format(dev);
  document.getElementById("devPct").innerText =
    firstCrackTime ? ((dev / total) * 100).toFixed(1) + "%" : "--";

  updateDevStrip();
}

// ---------------- 🔥 FIXED DEV STRIP (NO BREAKS, CORRECT MODEL) ----------------

function updateDevStrip() {

  const el = document.getElementById("devStrip");

  if (!firstCrackTime) {
    el.innerText = "Waiting for First Crack...";
    return;
  }

  const devSec = ((dropTime || Date.now()) - firstCrackTime) / 1000;

  const milestones = [15, 17.5, 20, 22.5, 25];

  el.innerText = milestones
    .map(p => `${p}% (${format((p / 100) * devSec)})`)
    .join(" | ");
}

// ---------------- TEMP (SAFE SIMPLE VERSION) ----------------

function askTemp() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();

  rec.lang = "en-US";

  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const temp = parseInt(text.match(/\d+/)?.[0]);

    if (!isNaN(temp)) logTemp(temp);

    if (text.toLowerCase().includes("first crack")) {
      markFirstCrack();
    }
  };

  rec.start();
}

// ---------------- LOG TEMP ----------------

function logTemp(temp) {
  const t = (Date.now() - startTime) / 1000;

  chart.data.labels.push(Math.floor(t));
  chart.data.datasets[0].data.push(temp);

  chart.update();
}

// ---------------- HELPERS ----------------

function speak(t) {
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(t));
}

function format(sec) {
  sec = Math.floor(sec);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
