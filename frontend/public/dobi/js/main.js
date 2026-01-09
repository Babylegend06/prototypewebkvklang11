// Smart Dobi - Main JavaScript
// ===========================================

// Check if first visit for onboarding
function checkFirstVisit() {
    const hasVisited = localStorage.getItem('smartDobi_visited');
    if (!hasVisited) {
        setTimeout(() => showOnboarding(), 500);
    }
}

function showOnboarding() {
    document.getElementById('onboardingModal').style.display = 'flex';
}

function closeOnboarding() {
    document.getElementById('onboardingModal').style.display = 'none';
    localStorage.setItem('smartDobi_visited', 'true');
}

// Format time from seconds to MM:SS
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

// Get timer class based on remaining time
function getTimerClass(seconds) {
    if (seconds <= 60) return 'danger';
    if (seconds <= 300) return 'warning';
    return '';
}

// Create machine card HTML
function createMachineCard(machineId, data) {
    const status = data.status || 'available';
    const isOnline = data.is_online !== false;
    const timeRemaining = data.time_remaining || 0;
    const displayStatus = !isOnline ? 'maintenance' : status;
    
    const isAvailable = displayStatus === 'available';
    const isWashing = displayStatus === 'washing';
    
    // Icon SVG based on status
    const icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
    </svg>`;
    
    // Action button
    let actionButton = '';
    if (isAvailable) {
        actionButton = `<button class="machine-action available" onclick="selectMachine('${machineId}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Pilih Mesin Ini
        </button>`;
    } else if (isWashing) {
        actionButton = `<button class="machine-action disabled" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Sedang Digunakan
        </button>`;
    } else {
        actionButton = `<button class="machine-action disabled" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Tidak Tersedia
        </button>`;
    }
    
    // Timer display for washing machines
    let timerDisplay = '';
    if (isWashing && timeRemaining > 0) {
        const timerClass = getTimerClass(timeRemaining);
        timerDisplay = `<div class="detail-row">
            <span class="detail-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Masa Berbaki
            </span>
            <span class="timer-value ${timerClass}" id="timer-${machineId}">${formatTime(timeRemaining)}</span>
        </div>`;
    }
    
    return `<div class="machine-card ${displayStatus}" style="animation-delay: ${(parseInt(machineId) - 1) * 0.1}s">
        <div class="machine-glow"></div>
        <div class="machine-header">
            <div class="machine-info">
                <div class="machine-icon ${displayStatus}">
                    ${icon}
                </div>
                <div>
                    <h3 class="machine-title fredoka">Mesin ${machineId}</h3>
                    <p class="machine-type">mesin basuh</p>
                </div>
            </div>
        </div>
        
        <div class="status-badge ${displayStatus}">
            <span class="pulse-dot"></span>
            ${getStatusText(displayStatus)}
        </div>
        
        <div class="machine-details">
            <div class="detail-row">
                <span class="detail-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    Harga
                </span>
                <span class="detail-value">RM 5.00</span>
            </div>
            ${timerDisplay}
        </div>
        
        ${actionButton}
    </div>`;
}

// Select machine and go to payment page
function selectMachine(machineId) {
    window.location.href = `payment.html?machine=${machineId}`;
}

// Update status counters
function updateCounters(machines) {
    let available = 0;
    let working = 0;
    
    Object.keys(machines).forEach(id => {
        const machine = machines[id];
        const isOnline = machine.is_online !== false;
        
        if (!isOnline) return;
        
        if (machine.status === 'available') available++;
        if (machine.status === 'washing') working++;
    });
    
    document.getElementById('availableCount').textContent = available;
    document.getElementById('workingCount').textContent = working;
    
    // Show alert if no machines available
    const alertBanner = document.getElementById('alertBanner');
    if (available === 0) {
        alertBanner.style.display = 'flex';
    } else {
        alertBanner.style.display = 'none';
    }
}

// Initialize default machines in Firebase
function initDefaultMachines() {
    machinesRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            // Create default machines if none exist
            const defaultMachines = {
                "1": {
                    status: "available",
                    is_online: true,
                    whatsapp: null,
                    time_remaining: 0
                },
                "2": {
                    status: "available",
                    is_online: true,
                    whatsapp: null,
                    time_remaining: 0
                },
                "3": {
                    status: "available",
                    is_online: true,
                    whatsapp: null,
                    time_remaining: 0
                }
            };
            
            machinesRef.set(defaultMachines)
                .then(() => console.log('Default machines created'))
                .catch((err) => console.error('Error creating machines:', err));
        }
    });
}

// Load and listen to machines
function loadMachines() {
    const grid = document.getElementById('machinesGrid');
    
    // Initialize default machines first
    initDefaultMachines();
    
    machinesRef.on('value', (snapshot) => {
        const machines = snapshot.val();
        
        if (!machines) {
            grid.innerHTML = `<div class="loading-container">
                <p class="text-muted">Memuatkan mesin...</p>
            </div>`;
            return;
        }
        
        // Clear grid
        grid.innerHTML = '';
        
        // Sort machines by ID
        const sortedIds = Object.keys(machines).sort((a, b) => parseInt(a) - parseInt(b));
        
        // Create cards
        sortedIds.forEach(id => {
            grid.innerHTML += createMachineCard(id, machines[id]);
        });
        
        // Update counters
        updateCounters(machines);
    }, (error) => {
        console.error('Error loading machines:', error);
        grid.innerHTML = `<div class="loading-container">
            <p class="text-muted text-rose">Ralat memuatkan data. Sila refresh halaman.</p>
        </div>`;
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkFirstVisit();
    loadMachines();
});