let usageChart;
let globalBillsCache = [];

function updateBudgetUI(billsArray) {
    if(billsArray) globalBillsCache = billsArray;
    
    const progressContainer = document.getElementById('budgetProgressBar');
    const progressText = document.getElementById('budgetProgressText');
    const budgetInput = document.getElementById('budgetInput');
    
    if (!progressContainer || !progressText || !budgetInput) return;

    let storedBudget = localStorage.getItem('powerhouse_budget');
    if (storedBudget) {
        budgetInput.value = storedBudget;
    }

    if (!storedBudget || isNaN(storedBudget) || Number(storedBudget) <= 0) {
        progressContainer.style.width = '0%';
        progressText.innerText = "Set your budget to enable tracking";
        progressText.style.color = "var(--text-secondary)";
        return;
    }

    const budgetLimit = Number(storedBudget);

    if (!globalBillsCache || globalBillsCache.length === 0) {
        progressContainer.style.width = '0%';
        progressText.innerText = `₹ 0 / ₹ ${budgetLimit} (0%)`;
        progressText.style.color = "var(--text-secondary)";
        return;
    }

    const currentCost = globalBillsCache[0].cost;
    const progress = (currentCost / budgetLimit) * 100;
    
    progressContainer.style.width = `${Math.min(progress, 100)}%`;
    progressText.innerText = `₹ ${currentCost} / ₹ ${budgetLimit} (${Math.round(progress)}%)`;
    
    if (progress > 100) {
        progressContainer.style.backgroundColor = 'var(--color-penalty)'; 
        progressText.style.color = 'var(--color-penalty)';
    } else {
        progressContainer.style.backgroundColor = 'var(--color-accent)'; 
        progressText.style.color = 'var(--text-primary)';
    }
}

function updateMoMInsights(billsArray) {
    const momValue = document.getElementById('displayMomValue');
    const momText = document.getElementById('displayMomText');
    if (!momValue || !momText) return;

    if (!billsArray || billsArray.length < 2) {
        momValue.innerText = "-";
        momText.innerText = "No comparison data yet";
        momText.className = "stat-trend neutral";
        momValue.style.color = "var(--text-primary)";
        return;
    }

    const latest = billsArray[0].cost;
    const previous = billsArray[1].cost;

    if (previous === 0) {
        momValue.innerText = "N/A";
        momText.innerText = "Previous bill was zero";
        momText.className = "stat-trend neutral";
    } else {
        const diff = latest - previous;
        const percent = (diff / previous) * 100;
        
        if (percent > 0) {
            momValue.innerText = `⬆️ ${Math.abs(percent).toFixed(1)}%`;
            momValue.style.color = "var(--color-penalty)";
            momText.innerText = `Higher than last cycle`;
            momText.className = "stat-trend negative";
        } else if (percent < 0) {
            momValue.innerText = `⬇️ ${Math.abs(percent).toFixed(1)}%`;
            momValue.style.color = "var(--color-safe)";
            momText.innerText = `Lower than last cycle`;
            momText.className = "stat-trend positive";
        } else {
            momValue.innerText = `0%`;
            momValue.style.color = "var(--text-secondary)";
            momText.innerText = `Same as last cycle`;
            momText.className = "stat-trend neutral";
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // --- 0. SECURITY CHECK (THE BOUNCER) ---
    const currentUserId = localStorage.getItem('powerhouse_userId');
    const isDashboard = window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('appliances.html');

    // --- BUDGET EVENT LISTENER ---
    const saveBudgetBtn = document.getElementById('saveBudgetBtn');
    if (saveBudgetBtn) {
        saveBudgetBtn.addEventListener('click', () => {
            const budgetInput = document.getElementById('budgetInput');
            if (budgetInput.value && Number(budgetInput.value) > 0) {
                localStorage.setItem('powerhouse_budget', budgetInput.value);
                updateBudgetUI();
            }
        });
    }

    // --- MY BILLS LEDGER LOGIC ---
    const billsTableBody = document.getElementById('billsTableBody');
    if (billsTableBody) {
        try {
            const response = await fetch('/api/bills/' + currentUserId);
            const billsData = await response.json();

            if (billsData.length === 0) {
                billsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">No bills logged yet. Head to the Dashboard to add one.</td></tr>`;
            } else {
                // Reverse the array so the newest bills are at the top
                billsData.reverse().forEach(bill => {
                    const statusText = bill.units > 500 ? '<span style="color: #e74c3c; font-weight: 600;">Penalty Slab</span>' : '<span style="color: #2ecc71; font-weight: 600;">Safe Slab</span>';
                    
                    const row = document.createElement('tr');
                    row.style.borderBottom = "1px solid #eee";
                    row.innerHTML = `
                        <td style="padding: 1.5rem;">${bill.month}</td>
                        <td style="padding: 1.5rem;">${bill.units} kWh</td>
                        <td style="padding: 1.5rem;">₹${bill.cost}</td>
                        <td style="padding: 1.5rem;">${statusText}</td>
                        <td style="padding: 1.5rem;">
                            <button class="delete-bill-btn" data-id="${bill._id}" style="color: #e74c3c; background: none; border: none; cursor: pointer; font-weight: 600;">Delete</button>
                        </td>
                    `;
                    billsTableBody.appendChild(row);
                });

                // Attach event listeners to all the new delete buttons
                document.querySelectorAll('.delete-bill-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const billId = this.getAttribute('data-id');
                        if(confirm("Are you sure you want to delete this bill? This will update your dashboard chart.")) {
                            await fetch('/api/bills/' + billId, { method: 'DELETE' });
                            window.location.reload(); // Refresh to show updated table
                        }
                    });
                });
            }
        } catch (error) {
            console.error("Error loading bills ledger:", error);
        }
    }

    

    // If they are trying to view the private pages without a VIP pass, kick them out
    if (isDashboard && !currentUserId) {
        window.location.href = 'login.html';
        return; // Stop running the rest of the script
    }

    // Handle the Logout button
    const logoutBtn = document.querySelector('.sidebar-footer a');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('powerhouse_userId'); // Tear up the VIP pass
            window.location.href = 'index.html'; // Send them home
        });
    }

    const ctx = document.getElementById('usageChart');
    
    // --- 1. GET DATA FROM BACKEND (PRIVATE TO USER) ---
    if (ctx) {
        try {
            // Ask for this specific user's bills using their ID
            const response = await fetch('/api/bills/' + currentUserId);
            const billsData = await response.json();

            // Handle the Empty Database State for new users
            if (billsData.length === 0) {
                usageChart = new Chart(ctx, {
                    type: 'line',
                    data: { labels: ['No Data Yet'], datasets: [{ label: 'Cost (₹)', data: [0] }] },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            } else {
                // We have data! Extract arrays for the chart
                const labelsArray = billsData.map(bill => bill.month).reverse();
                const costArray = billsData.map(bill => bill.cost).reverse();

                // Build the real chart
                const chartData = {
                    labels: labelsArray,
                    datasets: [{
                        label: 'Bi-monthly Cost (₹)',
                        data: costArray,
                        backgroundColor: 'rgba(88, 166, 255, 0.1)',
                        borderColor: '#58a6ff',
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
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#8b949e' }
                            },
                            x: { 
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#8b949e' }
                            }
                        }
                    }
                });

                // --- Update the Top Stat Cards ---
                const latestBill = billsData[0];
                
                document.getElementById('displayCost').innerText = `₹ ${latestBill.cost}`;
                document.getElementById('displayCycle').innerText = `Cycle ending in ${latestBill.month}`;
                document.getElementById('displayUnits').innerText = `${latestBill.units} kWh`;

                // Calculate TNEB Status for the 3rd Card
                const statusCard = document.getElementById('displayStatus');
                const statusTrend = document.getElementById('displayStatusTrend');
                
                if (latestBill.units <= 500) {
                    statusCard.innerText = "Safe Slab";
                    statusCard.style.color = "#2ecc71"; // Green
                    statusTrend.innerText = `${500 - latestBill.units} units left before penalty`;
                    statusTrend.className = "stat-trend positive";
                } else {
                    statusCard.innerText = "Penalty Slab";
                    statusCard.style.color = "#e74c3c"; // Red
                    statusTrend.innerText = `Exceeded 500 units by ${latestBill.units - 500}`;
                    statusTrend.className = "stat-trend negative";
                }
                
                updateMoMInsights(billsData);
                updateBudgetUI(billsData);
            }
        } catch (error) {
            console.error("Error loading chart data:", error);
        }
    }

    // --- MODAL LOGIC (Unchanged) ---
    const modal = document.getElementById("addBillModal");
    const btn = document.querySelector(".dashboard-header .btn-primary");
    const closeSpan = document.getElementsByClassName("close-btn")[0];
    const addBillForm = document.getElementById("addBillForm");

    if(btn) btn.onclick = () => modal.style.display = "flex";
    if(closeSpan) closeSpan.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

    // --- 2. POST NEW DATA TO BACKEND ---
    if(addBillForm) {
        addBillForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            try {
                const monthInput = document.getElementById('billMonth');
                const unitsInput = document.getElementById('billUnits');

                const dateObj = new Date(monthInput.value);
                const monthName = dateObj.toLocaleString('default', { month: 'long' });
                
                // 3. Create the data package WITH the User ID attached (Cost is derived in backend)
                const newBillData = {
                    userId: currentUserId, 
                    month: monthName,
                    units: Number(unitsInput.value)
                };

                const response = await fetch('/api/bills', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBillData)
                });

                if (!response.ok) {
                    throw new Error(`Server rejected the data with status: ${response.status}`);
                }

                // 5. Fetch fresh data specifically for this user
                const freshResponse = await fetch('/api/bills/' + currentUserId);
                const freshBills = await freshResponse.json();

                if (usageChart) {
                    usageChart.data.labels = freshBills.map(b => b.month).reverse();
                    usageChart.data.datasets[0].data = freshBills.map(b => b.cost).reverse();
                    
                    usageChart.data.datasets[0].label = 'Bi-monthly Cost (₹)';
                    usageChart.data.datasets[0].backgroundColor = 'rgba(88, 166, 255, 0.1)';
                    usageChart.data.datasets[0].borderColor = '#58a6ff';
                    usageChart.data.datasets[0].borderWidth = 2;
                    usageChart.data.datasets[0].fill = true;
                    
                    usageChart.update();
                }

                // 6. Update the stat cards visually
                const latestBill = freshBills[0];
                document.getElementById('displayCost').innerText = `₹ ${latestBill.cost}`;
                document.getElementById('displayCycle').innerText = `Cycle ending in ${latestBill.month}`;
                document.getElementById('displayUnits').innerText = `${latestBill.units} kWh`;
                
                // 7. Live update the TNEB status card
                const statusCard = document.getElementById('displayStatus');
                const statusTrend = document.getElementById('displayStatusTrend');
                if (latestBill.units <= 500) {
                    statusCard.innerText = "Safe Slab";
                    statusCard.style.color = "#2ecc71";
                    statusTrend.innerText = `${500 - newBillData.units} units left before penalty`;
                    statusTrend.className = "stat-trend positive";
                } else {
                    statusCard.innerText = "Penalty Slab";
                    statusCard.style.color = "#e74c3c";
                    statusTrend.innerText = `Exceeded 500 units by ${newBillData.units - 500}`;
                    statusTrend.className = "stat-trend negative";
                }

                updateMoMInsights(freshBills);
                updateBudgetUI(freshBills);

                // 8. Close the modal
                addBillForm.reset();
                modal.style.display = "none";

            } catch(error) {
                console.error("CRITICAL BROWSER ERROR:", error);
                alert("Failed to save bill. Check the browser console for details.");
            }
        });
    }

    // --- SERVER-SIDE SLAB PREDICTOR (WHAT-IF) LOGIC ---
    const targetUnitsInput = document.getElementById('targetUnits');
    const predictBillBtn = document.getElementById('predictBillBtn');
    const predictResultContainer = document.getElementById('predictResultContainer');

    if (predictBillBtn) {
        predictBillBtn.addEventListener('click', async () => {
            const expectedUnits = parseFloat(targetUnitsInput.value);

            if (isNaN(expectedUnits) || expectedUnits < 0) {
                alert("Please enter a valid positive number for units.");
                return;
            }

            try {
                // Send calculation request to the new Backend Endpoint
                const response = await fetch('/api/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expectedUnits })
                });

                if (!response.ok) throw new Error("Prediction request failed");

                const result = await response.json();
                
                predictResultContainer.classList.remove('d-none');
                
                const isSafe = result.status === "Safe Slab";
                const color = isSafe ? "#2ecc71" : "#e74c3c";
                const icon = isSafe ? "✅" : "⚠️";
                const message = isSafe 
                    ? `You are under the 500 unit limit. You have <b>${result.difference.toFixed(0)}</b> buffer units left.`
                    : `You have triggered the Penalty Rates! You are <b>${result.difference.toFixed(0)}</b> units over the limit.`;

                const cssColor = isSafe ? "var(--color-safe)" : "var(--color-penalty)";
                predictResultContainer.className = "predictor-result-box";
                predictResultContainer.innerHTML = `
                    <h4 style="color: ${cssColor}">${icon} ${result.status}</h4>
                    <p>Cost: <b>₹${result.cost.toFixed(2)}</b></p>
                    <p class="msg">${message}</p>
                `;
            } catch (error) {
                console.error("Prediction Error:", error);
                alert("Failed to calculate prediction over the server.");
            }
        });
    }
    // --- TNEB SIMULATOR LOGIC ---
    const applianceForm = document.getElementById('applianceForm');
    const applianceList = document.getElementById('applianceList');
    const baseUnitsInput = document.getElementById('baseUnits');
    
    let simulatedAppliances = [];

    function calculateTNEBBill(totalUnits) {
        let bill = 0;
        if (totalUnits <= 500) {
            if (totalUnits > 100) {
                let slab101to400 = Math.min(totalUnits - 100, 300);
                bill += slab101to400 * 2.25;
            }
            if (totalUnits > 400) {
                let slab401to500 = totalUnits - 400;
                bill += slab401to500 * 4.50;
            }
        } else {
            if (totalUnits > 100) {
                let slab101to400 = Math.min(totalUnits - 100, 300);
                bill += slab101to400 * 4.50; 
            }
            if (totalUnits > 400) {
                let slab401to500 = Math.min(totalUnits - 400, 100);
                bill += slab401to500 * 6.00; 
            }
            if (totalUnits > 500) {
                let slab501plus = totalUnits - 500;
                bill += slab501plus * 8.00; 
            }
        }
        return bill;
    }

    function updateSimulation() {
        const tierWarning = document.getElementById('tierWarning');
        const projectedBill = document.getElementById('projectedBill');
        const totalSimUnitsDisplay = document.getElementById('totalSimUnits');
        
        let baseUnits = Number(baseUnitsInput.value) || 0;
        let applianceUnits = 0;
        
        simulatedAppliances.forEach(app => {
            applianceUnits += app.units60Days;
        });

        let grandTotalUnits = baseUnits + applianceUnits;
        let finalBill = calculateTNEBBill(grandTotalUnits);

        totalSimUnitsDisplay.innerText = grandTotalUnits.toFixed(0);
        projectedBill.innerText = `Projected Bill: ₹${finalBill.toFixed(2)}`;

        if (grandTotalUnits > 500) {
            tierWarning.innerText = "⚠️ DANGER: Pushed into High Slab (>500 Units)";
            tierWarning.style.color = "#e74c3c";
            projectedBill.style.color = "#e74c3c";
        } else {
            tierWarning.innerText = "Safe: Below 500 Unit Slab";
            tierWarning.style.color = "#2ecc71";
            projectedBill.style.color = "#333";
        }
    }

    if (baseUnitsInput) {
        baseUnitsInput.addEventListener('input', updateSimulation);
    }

    if(applianceForm) {
        applianceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('appName').value;
            const watts = Number(document.getElementById('appWatts').value);
            const hours = Number(document.getElementById('appHours').value);

            const units60Days = ((watts * hours) / 1000) * 60; 
            const id = Date.now();
            
            simulatedAppliances.push({ id, name, units60Days });

            const newRow = document.createElement('tr');
            newRow.style.borderBottom = "1px solid #f4f7f6";
            newRow.id = `row-${id}`;
            newRow.innerHTML = `
                <td style="padding: 1rem; font-weight: 600;">${name}</td>
                <td style="padding: 1rem;">+${units60Days.toFixed(0)} Units</td>
                <td style="padding: 1rem;"><button class="remove-btn" data-id="${id}" style="color: #e74c3c; background: none; border: none; cursor: pointer;">Remove</button></td>
            `;

            newRow.querySelector('.remove-btn').onclick = function() {
                const removeId = Number(this.getAttribute('data-id'));
                simulatedAppliances = simulatedAppliances.filter(app => app.id !== removeId);
                document.getElementById(`row-${removeId}`).remove();
                updateSimulation();
            };

            applianceList.appendChild(newRow);
            applianceForm.reset();
            updateSimulation();
        });
    }

    

    // --- AUTHENTICATION LOGIC ---
    const authForm = document.getElementById('authForm');
    if (authForm) {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const authMessage = document.getElementById('authMessage');

        async function handleAuth(endpoint) {
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            if (!email || !password) {
                authMessage.innerText = "Please enter both email and password.";
                return;
            }

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Success! Save the VIP pass
                    localStorage.setItem('powerhouse_userId', data.userId);
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Show error from server
                    authMessage.innerText = data.message;
                }
            } catch (error) {
                console.error("Auth Error:", error);
                authMessage.innerText = "Failed to connect to server.";
            }
        }

        loginBtn.addEventListener('click', () => handleAuth('/api/login'));
        signupBtn.addEventListener('click', () => handleAuth('/api/signup'));
    }
});