let recognition = null;
let voiceActive = false;

let data = [];
let startTime = 0;

let uiTimer = null;
let roastTimer = null;

let firstCrackTime = null;
let stopTime = null;

// ---------------- CHART ----------------

const ctx = document.getElementById("chart").getContext("2d");

const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      { label: "Temp", data: [], borderColor: "#ffcc00", tension: 0.3 },
      { label: "RoR", data: [], borderColor: "#00ccff", tension: 0.3 },
      { label: "First Crack", data: [], showLine: false, pointRadius: 8 }
    ]
  }
});

// ---------------- VOICE ----------------

function initVoice() {

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;

  recognition.onresult = (event) => {
    const text = event.results[event.results.length - 1][0].transcript;
    handleSpeech(text);
  };

  recognition.onend = () => {
    if (voiceActive) recognition.start();
  };

  recognition.start();
  voiceActive = true;

  document.getElementById("startBtn").disabled = false;
  document.getElementById("status").innerText = "Voice Ready";
}

// ---------------- START ----------------

function startRoast() {

  data = [];
  startTime = Date.now();

  firstCrackTime = null;

  chart.data.labels = [];
  chart.data.datasets.forEach(d => d.data = []);
  chart.update();

  document.getElementById("status").innerText = "Roast Running";

  document.getElementById("date").innerText =
    new Date().toLocaleDateString();

  uiTimer = setInterval(updateTimer, 1000);

  roastTimer = setInterval(() => {
    speak("Temperature");
  }, 30000);

  setTimeout(() => speak("Temperature"), 2000);
}

// ---------------- TIMER ----------------

function updateTimer() {
  const t = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(t / 60);
  const s = t % 60;

  document.getElementById("timer").innerText =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// ---------------- SPEECH ----------------

function handleSpeech(text) {

  if (!text) return;

  text = text.toLowerCase();

  if (text.includes("first crack")) {
    confirmFirstCrack();
    return;
  }

  const temp = parseNumber(text);

  if (temp !== null) logTemp(temp);
}

// ---------------- FIRST CRACK ----------------

function confirmFirstCrack() {
  speak("Did you say First Crack?");

  setTimeout(() => {
    listenOnce((resp) => {
      if (resp.toLowerCase().includes("yes")) {
        markFirstCrack();
      }
    });
  }, 800);
}

function markFirstCrackManual() {
  markFirstCrack();
}

function markFirstCrack() {

  firstCrackTime = Date.now();

  const sec = Math.floor((firstCrackTime - startTime) / 1000);

  chart.data.datasets[2].data.push({
    x: sec + "s",
    y: data[data.length - 1]?.temp || 0
  });

  document.getElementById("fcTime").innerText = sec + " sec";

  chart.update();

  speak("First Crack recorded");
}

// ---------------- LOGGING ----------------

function logTemp(temp) {

  const t = Math.floor((Date.now() - startTime) / 1000);

  data.push({ time: t, temp });

  chart.data.labels.push(t + "s");
  chart.data.datasets[0].data.push(temp);

  updateRoR();

  document.getElementById("temp").innerText = "Temp: " + temp;

  chart.update();
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

// ---------------- STOP + SUMMARY ----------------

function stopRoast() {

  voiceActive = false;

  if (recognition) recognition.stop();

  clearInterval(uiTimer);
  clearInterval(roastTimer);

  stopTime = Date.now();

  const total = Math.floor((stopTime - startTime) / 1000);

  const dev = firstCrackTime
    ? Math.floor((stopTime - firstCrackTime) / 1000)
    : 0;

  document.getElementById("totalTime").innerText = total + " sec";
  document.getElementById("devTime").innerText = dev + " sec";

  const pct = firstCrackTime ? ((dev / total) * 100).toFixed(1) : "--";
  document.getElementById("devPct").innerText = pct + "%";

  const green = parseFloat(document.getElementById("green").value);
  const roast = parseFloat(document.getElementById("roast").value);

  if (!isNaN(green) && !isNaN(roast)) {
    const loss = ((green - roast) / green) * 100;
    document.getElementById("loss").innerText = loss.toFixed(1) + "%";
  }

  speak("Roast complete");
}

// ---------------- VOICE HELPERS ----------------

function listenOnce(cb) {
  const r = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  r.lang = "en-US";
  r.onresult = e => cb(e.results[0][0].transcript);
  r.start();
}

function speak(text) {
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

// ---------------- NUMBER PARSER ----------------

function parseNumber(text) {

  if (text.match(/\d+/)) return parseInt(text.match(/\d+/)[0]);

  const map = {
    one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
    ten:10,twenty:20,thirty:30,forty:40,fifty:50
  };

  let total = 0;

  text.split(" ").forEach(w => {
    if (map[w]) total += map[w];
  });

  return total || null;
}
