// Calculate event scores from raw inputs
function calculateScores(pullups, pushups, plank, run) {
  const pullupScore = Math.min(5 * pullups, 100);

  let pushupScore = (pushups * 100) / 80;
  pushupScore = Math.min(pushupScore, 100);
  pushupScore = Math.floor(pushupScore * 2) / 2; // round down to nearest 0.5

  const plankScore = 100 * (1 - Math.exp(-1.2 * plank));

  const runScore = Math.max(100 - 5 * ((run - 720) / 30), 0);

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

// Initialize the Chart.js chart
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
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Fitness Test Scores Over Time'
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          tooltipFormat: 'YYYY-MM-DD'
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Score'
        }
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

// Load historical data from a JSON file
fetch('historicalData.json')
  .then(response => response.json())
  .then(data => {
    data.forEach(entry => {
      const dateStr = entry.date; // expected in yyyy-mm-dd format
      const scores = calculateScores(entry.pullups, entry.pushups, entry.plank, entry.run);
      addDataPoint(dateStr, scores);
    });
  })
  .catch(error => {
    console.error('Error loading historical data:', error);
  });

// Handle new form submissions
document.getElementById('fitnessForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Get raw input values
  const pullups = parseInt(document.getElementById('pullups').value, 10);
  const pushups = parseInt(document.getElementById('pushups').value, 10);
  const plank = parseFloat(document.getElementById('plank').value);
  const run = parseInt(document.getElementById('run').value, 10);

  // Create a simple date string in yyyy-mm-dd format
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  // Create a raw log entry object (JSON)
  const logEntryObj = {
    date: dateStr,
    pullups: pullups,
    pushups: pushups,
    plank: plank,
    run: run
  };

  // Calculate scores from the raw inputs
  const scores = calculateScores(pullups, pushups, plank, run);
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
