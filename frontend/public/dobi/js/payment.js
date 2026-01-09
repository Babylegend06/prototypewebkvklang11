// Smart Dobi - Payment Page JavaScript
// ===========================================

let currentMachineId = null;

// Get machine ID from URL
function getMachineIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('machine');
}

// Initialize payment page
function initPaymentPage() {
    currentMachineId = getMachineIdFromUrl();
    
    if (!currentMachineId) {
        alert('Ralat: Mesin tidak dipilih');
        window.location.href = 'index.html';
        return;
    }
    
    // Display machine number
    document.getElementById('machineNumber').textContent = currentMachineId;
    
    // Verify machine is still available
    verifyMachineAvailable();
}

// Verify machine is still available
function verifyMachineAvailable() {
    machinesRef.child(currentMachineId).once('value', (snapshot) => {
        const machine = snapshot.val();
        
        if (!machine) {
            alert('Ralat: Mesin tidak dijumpai');
            window.location.href = 'index.html';
            return;
        }
        
        if (machine.status !== 'available') {
            alert('Maaf, mesin ini sudah tidak tersedia. Sila pilih mesin lain.');
            window.location.href = 'index.html';
            return;
        }
    });
}

// Confirm payment
function confirmPayment() {
    const whatsappInput = document.getElementById('whatsappInput');
    let whatsappNumber = whatsappInput.value.trim();
    
    // Format WhatsApp number
    if (whatsappNumber) {
        // Remove any non-digits
        whatsappNumber = whatsappNumber.replace(/\D/g, '');
        // Add country code if not present
        if (!whatsappNumber.startsWith('60')) {
            whatsappNumber = '60' + whatsappNumber;
        }
    }
    
    // Show loading
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    // Update machine status in Firebase
    const updates = {
        status: 'reserved',
        whatsapp: whatsappNumber || null,
        reserved_at: new Date().toISOString(),
        time_remaining: 0
    };
    
    machinesRef.child(currentMachineId).update(updates)
        .then(() => {
            console.log('Payment confirmed, machine reserved');
            
            // Redirect to waiting page
            setTimeout(() => {
                window.location.href = `waiting.html?machine=${currentMachineId}`;
            }, 1500);
        })
        .catch((error) => {
            console.error('Error updating machine:', error);
            document.getElementById('loadingOverlay').style.display = 'none';
            alert('Ralat semasa memproses pembayaran. Sila cuba lagi.');
        });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initPaymentPage);