// Smart Dobi - Waiting Page JavaScript
// ===========================================

let currentMachineId = null;
let machineListener = null;

// Get machine ID from URL
function getMachineIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('machine');
}

// Format time from seconds to MM:SS
function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update UI based on machine status
function updateUI(machine) {
    const statusBox = document.getElementById('statusBox');
    const machineStatus = document.getElementById('machineStatus');
    const ledIndicator = document.querySelector('.led-indicator');
    
    if (machine.status === 'washing') {
        // Machine is now washing
        statusBox.classList.add('washing');
        const statusIcon = statusBox.querySelector('.status-icon');
        statusIcon.classList.remove('waiting');
        statusIcon.classList.add('active');
        
        // Update LED to solid
        ledIndicator.classList.remove('blink');
        ledIndicator.classList.add('solid');
        
        // Show timer
        const timeRemaining = machine.time_remaining || 0;
        if (timeRemaining > 0) {
            machineStatus.textContent = `Sedang basuh - ${formatTime(timeRemaining)} berbaki`;
        } else {
            machineStatus.textContent = 'Sedang basuh...';
        }
    } else if (machine.status === 'reserved') {
        // Still waiting for START button
        machineStatus.textContent = 'Menunggu anda tekan START...';
        ledIndicator.classList.add('blink');
        ledIndicator.classList.remove('solid');
    } else if (machine.status === 'available') {
        // Machine completed or reset
        machineStatus.textContent = 'Basuhan selesai!';
        statusBox.classList.add('washing');
        ledIndicator.classList.remove('blink');
        ledIndicator.classList.remove('solid');
    }
}

// Listen to machine status
function listenToMachine() {
    if (machineListener) {
        machineListener();
    }
    
    machineListener = machinesRef.child(currentMachineId).on('value', (snapshot) => {
        const machine = snapshot.val();
        
        if (!machine) {
            console.error('Machine not found');
            return;
        }
        
        updateUI(machine);
    });
}

// Initialize waiting page
function initWaitingPage() {
    currentMachineId = getMachineIdFromUrl();
    
    if (!currentMachineId) {
        alert('Ralat: Mesin tidak dipilih');
        window.location.href = 'index.html';
        return;
    }
    
    // Display machine number
    document.getElementById('machineNumber').textContent = currentMachineId;
    document.querySelectorAll('.machine-num').forEach(el => {
        el.textContent = currentMachineId;
    });
    
    // Start listening to machine status
    listenToMachine();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (machineListener) {
        machinesRef.child(currentMachineId).off('value', machineListener);
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initWaitingPage);