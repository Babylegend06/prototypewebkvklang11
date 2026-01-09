// Smart Dobi - Dashboard JavaScript
// ===========================================

let currentUser = null;
let selectedMachineId = null;
let revenueChart = null;
let usageChart = null;

// Initialize Firebase Auth
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showDashboard();
    } else {
        currentUser = null;
        showLogin();
    }
});

// Sign in with Google
function signInWithGoogle() {
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            console.log('Login successful:', result.user.email);
        })
        .catch((error) => {
            console.error('Login error:', error);
            alert('Ralat log masuk: ' + error.message);
        });
}

// Sign out
function signOut() {
    auth.signOut()
        .then(() => {
            console.log('Logged out');
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
}

// Show login section
function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
}

// Show dashboard section
function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    // Update user info
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.displayName || currentUser.email;
        document.getElementById('userPhoto').src = currentUser.photoURL || 'https://via.placeholder.com/36';
    }
    
    // Load dashboard data
    loadMachinesManagement();
    initCharts();
    loadDailyStats();
}

// Format time
function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Get status text in Malay
function getStatusText(status) {
    const statusMap = {
        'available': 'Tersedia',
        'washing': 'Sedang Basuh',
        'reserved': 'Ditempah',
        'broken': 'Rosak',
        'maintenance': 'Penyelenggaraan'
    };
    return statusMap[status] || status;
}

// Create management card HTML
function createManagementCard(machineId, data) {
    const status = data.status || 'available';
    const isOnline = data.is_online !== false;
    const timeRemaining = data.time_remaining || 0;
    const whatsapp = data.whatsapp || '-';
    
    const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
    </svg>`;
    
    return `<div class="management-card">
        <div class="management-card-header">
            <div class="machine-badge">
                <div class="machine-badge-icon ${status}">
                    ${icon}
                </div>
                <div class="machine-badge-text">
                    <h3 class="fredoka">Mesin ${machineId}</h3>
                    <p>ID: M-${machineId}</p>
                </div>
            </div>
            <div class="online-indicator ${isOnline ? 'online' : 'offline'}">
                <span class="online-dot"></span>
                <span>${isOnline ? 'Online' : 'Offline'}</span>
            </div>
        </div>
        
        <div class="management-card-body">
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="status-tag ${status}">${getStatusText(status)}</span>
            </div>
            ${status === 'washing' ? `<div class="info-row">
                <span class="info-label">Masa Berbaki</span>
                <span class="info-value">${formatTime(timeRemaining)}</span>
            </div>` : ''}
            <div class="info-row">
                <span class="info-label">WhatsApp</span>
                <span class="info-value">${whatsapp}</span>
            </div>
        </div>
        
        <div class="management-card-actions">
            <button class="btn-action" onclick="openStatusModal('${machineId}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Tukar Status
            </button>
            <button class="btn-action danger" onclick="deleteMachine('${machineId}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Padam
            </button>
        </div>
    </div>`;
}

// Load machines for management
function loadMachinesManagement() {
    const grid = document.getElementById('machinesManagement');
    
    machinesRef.on('value', (snapshot) => {
        const machines = snapshot.val();
        
        if (!machines) {
            grid.innerHTML = `<div class="loading-container">
                <p class="text-muted">Tiada mesin. Klik "Tambah Mesin Baru" untuk mula.</p>
            </div>`;
            updateStats({});
            return;
        }
        
        grid.innerHTML = '';
        
        const sortedIds = Object.keys(machines).sort((a, b) => parseInt(a) - parseInt(b));
        
        sortedIds.forEach((id, index) => {
            const card = createManagementCard(id, machines[id]);
            grid.innerHTML += card;
        });
        
        updateStats(machines);
    });
}

// Update stats
function updateStats(machines) {
    let available = 0;
    let washing = 0;
    
    Object.keys(machines).forEach(id => {
        const machine = machines[id];
        if (machine.status === 'available') available++;
        if (machine.status === 'washing') washing++;
    });
    
    document.getElementById('statAvailable').textContent = available;
    document.getElementById('statWashing').textContent = washing;
}

// Load daily stats
function loadDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    
    dailyRecordsRef.child(today).once('value', (snapshot) => {
        const data = snapshot.val() || { cycles: 0, revenue: 0 };
        
        document.getElementById('statRevenue').textContent = `RM ${data.revenue || 0}`;
        document.getElementById('statCycles').textContent = data.cycles || 0;
    });
}

// Initialize charts
function initCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Hasil (RM)',
                data: [],
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
    
    // Usage Chart
    const usageCtx = document.getElementById('usageChart').getContext('2d');
    usageChart = new Chart(usageCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Kitaran',
                data: [],
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: '#6366f1',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Load chart data
    loadChartData();
}

// Load chart data
function loadChartData() {
    const labels = [];
    const revenueData = [];
    const cyclesData = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('ms-MY', { weekday: 'short' });
        
        labels.push(dayName);
        
        // Get data for this day
        dailyRecordsRef.child(dateStr).once('value', (snapshot) => {
            const data = snapshot.val() || { cycles: 0, revenue: 0 };
            revenueData[6 - i] = data.revenue || 0;
            cyclesData[6 - i] = data.cycles || 0;
            
            // Update charts when all data loaded
            if (revenueData.filter(x => x !== undefined).length === 7) {
                revenueChart.data.labels = labels;
                revenueChart.data.datasets[0].data = revenueData;
                revenueChart.update();
                
                usageChart.data.labels = labels;
                usageChart.data.datasets[0].data = cyclesData;
                usageChart.update();
            }
        });
    }
}

// Open status modal
function openStatusModal(machineId) {
    selectedMachineId = machineId;
    document.getElementById('modalMachineId').textContent = machineId;
    document.getElementById('statusModal').style.display = 'flex';
}

// Close status modal
function closeStatusModal() {
    document.getElementById('statusModal').style.display = 'none';
    selectedMachineId = null;
}

// Update machine status
function updateMachineStatus(newStatus) {
    if (!selectedMachineId) return;
    
    machinesRef.child(selectedMachineId).update({
        status: newStatus,
        whatsapp: null,
        time_remaining: 0
    })
    .then(() => {
        console.log('Status updated to:', newStatus);
        closeStatusModal();
    })
    .catch((error) => {
        console.error('Error updating status:', error);
        alert('Ralat mengemaskini status');
    });
}

// Add new machine
function addNewMachine() {
    machinesRef.once('value', (snapshot) => {
        const machines = snapshot.val() || {};
        const existingIds = Object.keys(machines).map(id => parseInt(id));
        const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
        
        machinesRef.child(String(newId)).set({
            status: 'available',
            is_online: true,
            whatsapp: null,
            time_remaining: 0
        })
        .then(() => {
            console.log('New machine added:', newId);
        })
        .catch((error) => {
            console.error('Error adding machine:', error);
            alert('Ralat menambah mesin');
        });
    });
}

// Delete machine
function deleteMachine(machineId) {
    if (!confirm(`Adakah anda pasti mahu padam Mesin ${machineId}?`)) {
        return;
    }
    
    machinesRef.child(machineId).remove()
        .then(() => {
            console.log('Machine deleted:', machineId);
        })
        .catch((error) => {
            console.error('Error deleting machine:', error);
            alert('Ralat memadam mesin');
        });
}