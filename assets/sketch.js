/* =========================================================
   DATA GENERATION (Simulasi output kp.py)
========================================================= */
function generateData(days) {
    const data = {
        labels: [],
        actual: [],
        lr: [],
        rf: [],
        ensemble: []
    };

    const startDate = new Date('2024-01-01');

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        data.labels.push(
            currentDate.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short'
            })
        );

        // Seasonality
        const season = 1 + 0.6 * Math.sin(2 * Math.PI * i / 365);

        // Actual rain (zero-inflated + extreme)
        let rainProb = 0.3 * season;
        let isRain = Math.random() < rainProb;
        let actualVal = 0;

        if (isRain) {
            actualVal = (Math.random() + Math.random()) * 8 * season;
            if (Math.random() > 0.95) actualVal *= 3;
        }

        // Linear Regression (underestimate extremes)
        let lrVal = isRain ? actualVal * 0.6 + 2 : 1;
        lrVal = Math.max(0, lrVal + (Math.random() - 0.5) * 3);

        // Random Forest (lebih agresif)
        let rfVal = isRain ? actualVal * 0.9 + (Math.random() - 0.5) * 5 : 0;
        rfVal = Math.max(0, rfVal);

        // Ensemble (weighted)
        let ensVal = (0.4 * lrVal) + (0.6 * rfVal);

        data.actual.push(+actualVal.toFixed(1));
        data.lr.push(+lrVal.toFixed(1));
        data.rf.push(+rfVal.toFixed(1));
        data.ensemble.push(+ensVal.toFixed(1));
    }

    return data;
}

const fullData = generateData(365);

/* =========================================================
   MAIN TIME SERIES CHART
========================================================= */
const ctxMain = document.getElementById('mainTimeSeriesChart');
const mainChart = new Chart(ctxMain, {
    type: 'line',
    data: {
        labels: fullData.labels.slice(0, 100),
        datasets: [
            {
                label: 'Aktual',
                data: fullData.actual.slice(0, 100),
                borderColor: '#1e293b',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1
            },
            {
                label: 'Ensemble',
                data: fullData.ensemble.slice(0, 100),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.1)',
                fill: true,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.3
            },
            {
                label: 'Random Forest',
                data: fullData.rf.slice(0, 100),
                borderColor: '#fb923c',
                borderDash: [5, 5],
                borderWidth: 1,
                pointRadius: 0,
                hidden: true
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Curah Hujan (mm)' } },
            x: { grid: { display: false } }
        }
    }
});

/* =========================================================
   FILTER MUSIM
========================================================= */
function updateChartPeriod(period) {
    let start = 0;
    let end = 100;

    if (period === 'wet') {
        start = 0;
        end = 90;
    } else if (period === 'dry') {
        start = 150;
        end = 240;
    } else {
        start = 0;
        end = 365;
    }

    mainChart.data.labels = fullData.labels.slice(start, end);
    mainChart.data.datasets[0].data = fullData.actual.slice(start, end);
    mainChart.data.datasets[1].data = fullData.ensemble.slice(start, end);
    mainChart.data.datasets[2].data = fullData.rf.slice(start, end);
    mainChart.update();
}

/* =========================================================
   ERROR BAR CHART
========================================================= */
new Chart(document.getElementById('errorComparisonChart'), {
    type: 'bar',
    data: {
        labels: ['Persistence', 'Linear Reg', 'Random Forest', 'Ensemble'],
        datasets: [{
            data: [5.8, 4.12, 3.85, 3.42],
            backgroundColor: ['#cbd5e1', '#818cf8', '#fb923c', '#2563eb']
        }]
    },
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    }
});

/* =========================================================
   SCATTER PLOT
========================================================= */
const scatterPoints = fullData.actual
    .map((v, i) => ({ x: v, y: fullData.ensemble[i] }))
    .filter((_, i) => i % 3 === 0);

new Chart(document.getElementById('scatterChart'), {
    type: 'scatter',
    data: {
        datasets: [{
            data: scatterPoints,
            backgroundColor: 'rgba(37,99,235,0.5)',
            pointRadius: 3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    }
});

/* =========================================================
   EWS SLIDER LOGIC
========================================================= */
const slider = document.getElementById('rainSlider');
const valLr = document.getElementById('val-lr');
const valRf = document.getElementById('val-rf');
const valEns = document.getElementById('val-ens');

slider.addEventListener('input', e => {
    const v = +e.target.value;

    const lr = v * 0.7 + 2;
    const rf = v * 0.95;
    const ens = 0.35 * lr + 0.65 * rf;

    valLr.textContent = lr.toFixed(1);
    valRf.textContent = rf.toFixed(1);
    valEns.textContent = ens.toFixed(1);
});

slider.dispatchEvent(new Event('input'));
