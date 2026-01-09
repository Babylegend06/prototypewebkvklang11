// Smart Dobi - Main JavaScript
// ===========================================

// Check if first visit for onboarding (only on index page)
function checkFirstVisit() {
    // Only show on index page
    if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/dobi/')) {
        return;
    }
    
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

// Create machine card HTML - Simple Design
function createMachineCard(machineId, data) {
    const status = data.status || 'available';
    const isOnline = data.is_online !== false;
    const timeRemaining = data.time_remaining || 0;
    const displayStatus = !isOnline ? 'maintenance' : status;
    
    const isAvailable = displayStatus === 'available';
    const isWashing = displayStatus === 'washing';
    
    // Status text
    let statusText = getStatusText(displayStatus).toUpperCase();
    if (isWashing && timeRemaining > 0) {
        statusText = formatTime(timeRemaining);
    }
    
    // Action button
    let actionButton = '';
    if (isAvailable) {
        actionButton = `<button class="machine-action available" onclick="selectMachine('${machineId}')">PILIH</button>`;
    } else {
        actionButton = `<button class="machine-action disabled" disabled>${isWashing ? 'RUNNING' : 'UNAVAILABLE'}</button>`;
    }
    
    return `<div class="machine-card ${displayStatus}" style="animation-delay: ${(parseInt(machineId) - 1) * 0.1}s">
        <div class="machine-header">
            <div class="machine-info">
                <h3 class="machine-title">MESIN ${machineId}</h3>
            </div>
        </div>
        
        <div class="status-badge ${displayStatus}">
            ${statusText}
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

// Initialize default machines in Firebase (only if empty)
function initDefaultMachines() {
    machinesRef.once('value', (snapshot) => {
        if (!snapshot.exists() || snapshot.numChildren() === 0) {
            // Only create if no machines exist
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
                }
            };
            
            machinesRef.set(defaultMachines)
                .then(() => console.log('Default machines created'))
                .catch((err) => console.error('Error:', err));
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