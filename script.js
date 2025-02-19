// ========================
// SCORING LOGIC FUNCTIONS
// ========================

// Pull-Ups: 5 points per rep (max 100)
function getPullupScore(reps) {
  return Math.min(5 * reps, 100);
}

// Push-Ups: (reps * 100 / 80), rounded down, capped at 100
function getPushupScore(reps) {
  return Math.floor(Math.min((reps * 100) / 80, 100));
}

// Plank Hold: 4:20 (260 sec) yields 100 points; every 2 seconds less deducts 1 point
function getPlankScore(plankSec) {
  return (plankSec >= 260) 
    ? 100 
    : Math.max(100 - Math.floor((260 - plankSec) / 2), 0);
}

// Inverse function for Plank: Given a desired score, returns the required time in seconds.
function getPlankRequiredTimeForScore(score) {
  return (score === 100) ? 260 : 260 - 2 * (100 - score);
}

// 2-Mile Run: 12:00 (720 sec) yields 100 points; every 5 seconds extra deducts 1 point
function getRunScore(runSec) {
  return (runSec <= 720) 
    ? 100 
    : Math.max(100 - Math.floor((runSec - 720) / 5), 0);
}

// Inverse function for Run: Given a desired score, returns the required time in seconds.
function getRunRequiredTimeForScore(score) {
  return (score === 100) ? 720 : 720 + 5 * (100 - score);
}

// Combined scoring function (expects plankTime in minutes and runTime in seconds)
function calculateScores(pullups, pushups, plankTime, runTime) {
  const pullupScore = getPullupScore(pullups);
  const pushupScore = getPushupScore(pushups);
  const plankSec = plankTime * 60;
  const plankScore = getPlankScore(plankSec);
  const runScore = getRunScore(runTime);
  const finalScore = (pullupScore + pushupScore + plankScore + runScore) / 4;
  return { pullupScore, pushupScore, plankScore, runScore, finalScore };
}

// Classify overall fitness based on final score
function classifyFitness(score) {
  if (score >= 90) return "Elite (Special Forces Ready)";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 60) return "Average";
  if (score >= 40) return "Below Average";
  if (score >= 20) return "Needs Improvement";
  return "Beginner";
}

// ========================
// HELPER FUNCTIONS
// ========================

// Format a time in seconds as mm:ss
function formatTimeFromSeconds(totalSeconds) {
  let mins = Math.floor(totalSeconds / 60);
  let secs = Math.round(totalSeconds % 60);
  if (secs < 10) secs = '0' + secs;
  return mins + ":" + secs;
}

// ========================
// CHART SETUP
// ========================

const ctx = document.getElementById('fitnessChart').getContext('2d');
let fitnessChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [], // Dates (yyyy-mm-dd) will be added here
    datasets: [
      {
        label: 'Pull-Up Score',
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        data: [],
        fill: false,
        tension: 0.1
      },
      {
        label: 'Push-Up Score',
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        fill: false,
        tension: 0.1
      },
      {
        label: 'Plank Hold Score',
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        data: [],
        fill: false,
        tension: 0.1
      },
      {
        label: '2-Mile Run Score',
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        data: [],
        fill: false,
        tension: 0.1
      },
      {
        label: 'Combined Final Score',
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        data: [],
        fill: false,
        tension: 0.1
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Score History' }
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'month', tooltipFormat: 'yyyy-MM-dd' },
        title: { display: true, text: 'Date' }
      },
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Score' }
      }
    }
  }
});

// Add a new data point to the chart
function addDataPoint(date, scores) {
  fitnessChart.data.labels.push(date);
  fitnessChart.data.datasets[0].data.push(scores.pullupScore);
  fitnessChart.data.datasets[1].data.push(scores.pushupScore);
  fitnessChart.data.datasets[2].data.push(+scores.plankScore.toFixed(1));
  fitnessChart.data.datasets[3].data.push(+scores.runScore.toFixed(1));
  fitnessChart.data.datasets[4].data.push(+scores.finalScore.toFixed(1));
  fitnessChart.update();
}

// ========================
// LOAD HISTORICAL DATA
// ========================

fetch('historicalData.json')
  .then(response => response.json())
  .then(data => {
    data.forEach(entry => {
      const dateStr = entry.date; // expected in yyyy-mm-dd format
      const plankTime = entry.plank.minutes + (entry.plank.seconds / 60);
      const runTime = entry.run.minutes * 60 + entry.run.seconds;
      const scores = calculateScores(entry.pullups, entry.pushups, plankTime, runTime);
      addDataPoint(dateStr, scores);
    });
  })
  .catch(error => {
    console.error('Error loading historical data:', error);
  });

// ========================
// HANDLE NEW FORM SUBMISSIONS
// ========================

document.getElementById('fitnessForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Get raw input values
  const pullups = parseInt(document.getElementById('pullups').value, 10);
  const pushups = parseInt(document.getElementById('pushups').value, 10);
  
  const plankMinutes = parseInt(document.getElementById('plankMinutes').value, 10);
  const plankSeconds = parseInt(document.getElementById('plankSeconds').value, 10);
  const plankTime = plankMinutes + (plankSeconds / 60);

  const runMinutes = parseInt(document.getElementById('runMinutes').value, 10);
  const runSeconds = parseInt(document.getElementById('runSeconds').value, 10);
  const runTime = runMinutes * 60 + runSeconds;

  // Create a simple date string in yyyy-mm-dd format
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  // Create a raw log entry object (JSON) with subfields for time
  const logEntryObj = {
    date: dateStr,
    pullups: pullups,
    pushups: pushups,
    plank: { minutes: plankMinutes, seconds: plankSeconds },
    run: { minutes: runMinutes, seconds: runSeconds }
  };

  // Calculate scores from the raw inputs
  const scores = calculateScores(pullups, pushups, plankTime, runTime);
  const classification = classifyFitness(scores.finalScore);

  // Display calculated results
  document.getElementById('resultDisplay').innerHTML = `
    <p><strong>Pull-Up Score:</strong> ${scores.pullupScore}</p>
    <p><strong>Push-Up Score:</strong> ${scores.pushupScore}</p>
    <p><strong>Plank Hold Score:</strong> ${scores.plankScore.toFixed(1)}</p>
    <p><strong>2-Mile Run Score:</strong> ${scores.runScore.toFixed(1)}</p>
    <p><strong>Combined Final Score:</strong> ${scores.finalScore.toFixed(1)}</p>
    <p><strong>Fitness Level:</strong> ${classification}</p>
  `;

  // Output the raw log entry as formatted JSON for you to copy
  document.getElementById('logEntry').textContent = JSON.stringify(logEntryObj, null, 2);

  // Add the new data point to the chart immediately
  addDataPoint(dateStr, scores);

  // Reset the form
  document.getElementById('fitnessForm').reset();
});

// ========================
// SCORE TABLE GENERATION FUNCTIONS
// ========================

// Pull-Ups Table: Use getPullupScore for each repetition (20 down to 0)
function generatePullupTable() {
  const table = document.getElementById("pullupTable");
  table.innerHTML = "";
  let header = table.insertRow();
  header.insertCell().innerHTML = "<strong>Repetitions</strong>";
  header.insertCell().innerHTML = "<strong>Score</strong>";

  for (let reps = 20; reps >= 0; reps--) {
    let row = table.insertRow();
    row.insertCell().innerText = reps;
    row.insertCell().innerText = getPullupScore(reps);
  }
}

// Push-Ups Table: Use getPushupScore for each repetition (80 down to 0)
function generatePushupTable() {
  const table = document.getElementById("pushupTable");
  table.innerHTML = "";
  let header = table.insertRow();
  header.insertCell().innerHTML = "<strong>Repetitions</strong>";
  header.insertCell().innerHTML = "<strong>Score</strong>";

  for (let reps = 80; reps >= 0; reps--) {
    let row = table.insertRow();
    row.insertCell().innerText = reps;
    row.insertCell().innerText = getPushupScore(reps);
  }
}

// Plank Table: For each score from 100 down to 0, use getPlankRequiredTimeForScore
function generatePlankTable() {
  const table = document.getElementById("plankTable");
  table.innerHTML = "";
  let header = table.insertRow();
  header.insertCell().innerHTML = "<strong>Time Required (mm:ss)</strong>";
  header.insertCell().innerHTML = "<strong>Score</strong>";

  for (let s = 100; s >= 0; s--) {
    let row = table.insertRow();
    let requiredSec = getPlankRequiredTimeForScore(s);
    let timeRequired = formatTimeFromSeconds(requiredSec);
    row.insertCell().innerText = timeRequired;
    row.insertCell().innerText = s;
  }
}

// Run Table: For each score from 100 down to 0, use getRunRequiredTimeForScore
function generateRunTable() {
  const table = document.getElementById("runTable");
  table.innerHTML = "";
  let header = table.insertRow();
  header.insertCell().innerHTML = "<strong>Time Required (mm:ss)</strong>";
  header.insertCell().innerHTML = "<strong>Score</strong>";

  for (let s = 100; s >= 0; s--) {
    let row = table.insertRow();
    let requiredSec = getRunRequiredTimeForScore(s);
    let timeRequired = formatTimeFromSeconds(requiredSec);
    row.insertCell().innerText = timeRequired;
    row.insertCell().innerText = s;
  }
}

// Call table generation functions
generatePullupTable();
generatePushupTable();
generatePlankTable();
generateRunTable();
