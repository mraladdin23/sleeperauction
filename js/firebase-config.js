// ─────────────────────────────────────────────────────────────
//  FIREBASE CONFIGURATION
//  Replace the values below with your own Firebase project config.
//  See README.md for step-by-step setup instructions.
// ─────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyC6hhUjpTI2gYVgLW2Ru4-CYSjgKKyJ3Ek",
  authDomain: "sleeperbid.firebaseapp.com",
  databaseURL: "https://sleeperbid-default-rtdb.firebaseio.com",
  projectId: "sleeperbid",
  storageBucket: "sleeperbid.firebasestorage.app",
  messagingSenderId: "81288888200",
  appId: "1:81288888200:web:2e3b4c28250fc2da7b043d",
  measurementId: "G-ZKZ73PRXVS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
