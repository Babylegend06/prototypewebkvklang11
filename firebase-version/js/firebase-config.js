// Firebase Configuration for Smart Dobi
const firebaseConfig = {
    apiKey: "AIzaSyBPaObgmHZBQR8-0aX3pTUOFeMOxIsn0Lc",
    authDomain: "smart-dobi-system-fyp.firebaseapp.com",
    databaseURL: "https://smart-dobi-system-fyp-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-dobi-system-fyp",
    storageBucket: "smart-dobi-system-fyp.firebasestorage.app",
    messagingSenderId: "377544234994",
    appId: "1:377544234994:web:690cd32c142e7ee501fd6b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();

// Export references
const machinesRef = database.ref('machines');
const dailyRecordsRef = database.ref('daily_records');
const settingsRef = database.ref('settings');

console.log('🔥 Firebase initialized successfully!');