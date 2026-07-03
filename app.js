let startTime = 0;
let firstCrackTime = null;
let dropTime = null;

let chart;

const ctx = document.getElementById("chart").getContext("2d");

chart = new Chart(ctx, {
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

function startRoast() {
  startTime = Date.now();
  firstCrackTime = null;
  dropTime = null;

  document.getElementById("devStrip").innerText =
    "Waiting for First Crack...";
}

function markFirstCrack() {
  firstCrackTime = Date.now();

  document.getElementById("fc").innerText =
    format(Date.now() - startTime);
}

function stopRoast() {
  dropTime = Date.now();

  const devWindow = dropTime - firstCrackTime;

  document.getElementById("drop").innerText =
    format(devWindow);

  document.getElementById("dev").innerText =
    format(devWindow);

  renderDevStrip(devWindow);
}

// 🔥 THIS IS THE FIXED CORE
function renderDevStrip(devWindow) {

  const milestones = [15, 17.5, 20, 22.5, 25];

  const output = milestones.map(pct => {

    const ms = firstCrackTime + (pct / 100) * devWindow;

    const secFromFC = (ms - firstCrackTime) / 1000;

    return `${pct}% (${format(secFromFC * 1000)})`;

  }).join(" | ");

  document.getElementById("devStrip").innerText = output;
}

function format(ms) {
  let sec = Math.floor(ms / 1000);
  let m = Math.floor(sec / 60);
  let s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
