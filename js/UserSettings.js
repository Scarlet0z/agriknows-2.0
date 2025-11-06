import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// Your web app's Firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyDxTSnDc-z4wJ4fL9zf3kB3uuvZjcISNjQ",
  authDomain: "login-agriknows.firebaseapp.com",
  projectId: "login-agriknows",
  storageBucket: "login-agriknows.firebasestorage.app",
  messagingSenderId: "281355587751",
  appId: "1:281355587751:web:fb479b62b5036b44b68b82",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Add event listener to the logout button
document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => {
    // Sign-out successful.
    alert('You have been logged out successfully.');
    // Redirect to the login page (based on your signup.html link)
    window.location.href = '/pages/login.html'; 
  }).catch((error) => {
    // An error happened.
    alert('Error logging out: ' + error.message);
  });
});