import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

function preventBack(){window.history.forward()};
setTimeout("preventBack()",0);
window.onunload=function(){null;}

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

// --- ADD THIS AUTH STATE LISTENER ---
// This checks if the user is logged in every time the page loads
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, they can stay on this page.
    console.log("User is signed in:", user.uid);
  } else {
    // User is signed out. Redirect them to the login page.
    console.log("No user signed in. Redirecting...");
    // Use replace() to prevent "back" button from working
    window.location.replace('/pages/login.html');
  }
});

// Add event listener to the logout button
document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => {
    // Sign-out successful.
    alert('You have been logged out successfully.');
    // Redirect to the login page (based on your signup.html link)
    window.location.replace = ('/pages/login.html'); 
  }).catch((error) => {
    // An error happened.
    alert('Error logging out: ' + error.message);
  });
});