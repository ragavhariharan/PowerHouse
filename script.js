let usageChart;

document.addEventListener('DOMContentLoaded', function() {
    
    const ctx = document.getElementById('usageChart');
    if (ctx) {
        const chartData = {
            labels: ['August', 'September', 'October', 'November', 'December', 'January'],
            datasets: [{
                label: 'Monthly Cost (₹)',
                data: [2100, 2300, 1950, 1800, 2600, 2450],
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: '#2ecc71',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        };

        usageChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f0f0f0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    const modal = document.getElementById("addBillModal");
    const btn = document.querySelector(".dashboard-header .btn-primary");
    const closeSpan = document.getElementsByClassName("close-btn")[0];
    const addBillForm = document.getElementById("addBillForm");

    if(btn) {
        btn.onclick = function() {
            modal.style.display = "flex";
        }
    }

    if(closeSpan) {
        closeSpan.onclick = function() {
            modal.style.display = "none";
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    if(addBillForm) {
        addBillForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const monthInput = addBillForm.querySelector('input[type="month"]');
            const unitsInput = addBillForm.querySelector('input[placeholder="e.g. 320"]');
            const costInput = addBillForm.querySelector('input[placeholder="e.g. 2450"]');

            const newMonth = monthInput.value; 
            const newCost = costInput.value;
            const newUnits = unitsInput.value;

            if (newMonth && newCost) {
                
                const dateObj = new Date(newMonth);
                const monthName = dateObj.toLocaleString('default', { month: 'long' });

                if (usageChart) {
                    usageChart.data.labels.push(monthName);
                    usageChart.data.datasets[0].data.push(newCost);
                    usageChart.update();
                }

                const lastMonthBillDisplay = document.querySelector('.stat-number');
                if (lastMonthBillDisplay) {
                    lastMonthBillDisplay.innerText = `₹ ${newCost}`;
                }

                const totalUnitsDisplay = document.querySelectorAll('.stat-number')[1];
                if (totalUnitsDisplay) {
                    totalUnitsDisplay.innerText = `${newUnits} kWh`;
                }

                addBillForm.reset();
                modal.style.display = "none";
            }
        });
    }
    const applianceForm = document.getElementById('applianceForm');
    const applianceList = document.getElementById('applianceList');

    if(applianceForm) {
        applianceForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('appName').value;
            const watts = document.getElementById('appWatts').value;
            const hours = document.getElementById('appHours').value;

            const dailyKwh = (watts * hours) / 1000;
            const monthlyCost = dailyKwh * 30 * 7; 

            const newRow = document.createElement('tr');
            newRow.style.borderBottom = "1px solid #f4f7f6";
            
            newRow.innerHTML = `
                <td style="padding: 1rem; font-weight: 600;">${name}</td>
                <td style="padding: 1rem;">${dailyKwh.toFixed(2)} kWh</td>
                <td style="padding: 1rem; color: #e74c3c; font-weight: 700;">₹ ${monthlyCost.toFixed(0)}</td>
                <td style="padding: 1rem;"><button style="color: #e74c3c; background: none; border: none; cursor: pointer;">Remove</button></td>
            `;

            newRow.querySelector('button').onclick = function() {
                newRow.remove();
            };

            applianceList.appendChild(newRow);
            applianceForm.reset();
        });
    }
});

// --- HOME VS FEATURES PAGE LOGIC ---

// 1. Get the elements
const linkHome = document.getElementById('link-home');
const linkFeatures = document.getElementById('link-features');
const homeView = document.getElementById('home-view');
const featuresView = document.getElementById('features-view');

// 2. Function to switch to Features
if (linkFeatures) {
    linkFeatures.addEventListener('click', function(e) {
        e.preventDefault(); // Stop the link from reloading the page
        
        // Hide Home, Show Features
        if(homeView) homeView.style.display = 'none';
        if(featuresView) featuresView.style.display = 'block';
        
        // Optional: Update text color to show which is active
        linkFeatures.style.color = '#2ecc71'; // Green
        linkHome.style.color = '#333'; // Black
    });
}

// 3. Function to switch back to Home
if (linkHome) {
    linkHome.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Hide Features, Show Home
        if(featuresView) featuresView.style.display = 'none';
        if(homeView) homeView.style.display = 'block';

        // Reset colors
        linkHome.style.color = '#2ecc71';
        linkFeatures.style.color = '#333';
    });
}