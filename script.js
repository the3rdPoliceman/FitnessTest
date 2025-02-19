// --- CALCULATION FUNCTIONS ---

// Calculate event scores from raw inputs
function calculateScores(pullups, pushups, plankTime, runTime) {
  const pullupScore = Math.min(5 * pullups, 100);

  let pushupScore = (pushups * 100) / 80;
  pushupScore = Math.min(pushupScore, 100);
  pushupScore = Math.floor(pushupScore); // round down 

  // New Plank scoring:
  // Convert plankTime (minutes) to seconds.
  const plankSec = plankTime * 60;
  const plankScore = (plankSec >= 260) 
    ? 100 
    : Math.max(100 - Math.floor((260 - plankSec) / 2), 0);

  // New Run scoring:
  const runScore = (runTime <= 720) 
    ? 100 
    : Math.max(100 - Math.floor((runTime - 720) / 5), 0);

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

// HELPER FUNCTION: Format seconds as mm:ss
function formatTimeFromSeconds(totalSeconds) {
  let mins = Math.floor(totalSeconds / 60);
  let secs = Math.round(totalSeconds % 60);
  if (secs < 10) secs = '0' + secs;
  return mins + ":" + secs;
}

// --- CHART SETUP ---

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

// --- LOAD HISTORICAL DATA ---

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

// --- HANDLE NEW FORM SUBMISSIONS ---

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

// --- SCORE TABLE GENERATION FUNCTIONS ---

// Generate Pull-Ups Table: Descending from max (20) to 0
function generatePullupTable() {
  const table = document.getElementById("pullupTable");
  table.innerHTML = "";
  let header = table.insertRow();
  header.insertCell().innerHTML = "<strong>Repetitions</strong>";
  header.insertCell().innerHTML = "<strong>Score</strong>";

  for (let reps = 20; reps >= 0; reps--) {
    let score = Math.min(5 * reps, 100);
    let row = table.insertRow();
    row.insertCell().innerText = reps;
    row.insertCell().innerText = score;
  }
}

// Generate Push-Ups Table: Descending from max (80) to 0
function generatePushupTable() {
  const table = document.getElementById("pushupTable");
  table.innerHTML = "";
  let header = table.insertRow();
  header.insertCell().innerHTML = "<strong>Repetitions</strong>";
  header.insertCell().innerHTML = "<strong>Score</strong>";

  for (let reps = 80; reps >= 0; reps--) {
    let score = (reps * 100) / 80;
    score = Math.min(score, 100);
    score = Math.floor(score);
    let row = table.insertRow();
    row.insertCell().innerText = reps;
    row.insertCell().innerText = score;
  }
}

// Generate Plank Table: For each score from 100 down to 0, compute required time
function generatePlankTable() {
  const table = document.getElementById("plankTable");
  table.innerHTML = "";
  let header = table.insertRow();
  header.insertCell().innerHTML = "<strong>Time Required (mm:ss)</strong>";
  header.insertCell().innerHTML = "<strong>Score</strong>";

  for (let s = 100; s >= 0; s--) {
    let row = table.insertRow();
    let timeRequired;
    // For s == 100, time required is 260 seconds (4:20)
    if (s === 100) {
      timeRequired = "4:20";
    } else {
      // Invert the deduction: required time = 260 - 2*(100 - s)
      let t = 260 - 2 * (100 - s);
      timeRequired = formatTimeFromSeconds(t);
    }
    row.insertCell().innerText = timeRequired;
    row.insertCell().innerText = s;
  }
}

// Generate Run Table: For each score from 100 down to 0, compute required time
function generateRunTable() {
  const table = document.getElementById("runTable");
  table.innerHTML = "";
  let header = table.insertRow();
  header.insertCell().innerHTML = "<strong>Time Required (mm:ss)</strong>";
  header.insertCell().innerHTML = "<strong>Score</strong>";

  for (let s = 100; s >= 0; s--) {
    let row = table.insertRow();
    // Invert the run formula: required time = 720 + 5*(100 - s)
    let t = 720 + 5 * (100 - s);
    let timeRequired = formatTimeFromSeconds(t);
    row.insertCell().innerText = timeRequired;
    row.insertCell().innerText = s;
  }
}

// Call table generation functions
generatePullupTable();
generatePushupTable();
generatePlankTable();
generateRunTable();
