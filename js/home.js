import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  updatePassword, // <-- IMPORT THIS
  reauthenticateWithCredential, // <-- IMPORT THIS
  EmailAuthProvider, // <-- IMPORT THIS
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

// Get element references
const emailInput = document.getElementById('user-email');
const usernameInput = document.getElementById('user-username'); // Assuming you'll add an ID

const currentPassInput = document.getElementById('current-password');
const newPassInput = document.getElementById('new-password');
const confirmPassInput = document.getElementById('confirm-password');
const savePassBtn = document.getElementById('save-password-btn'); // Assuming you'll add an ID

// Variable to hold the current user object
let currentUser = null;

// This checks if the user is logged in every time the page loads
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user; // Store the user object
    console.log("User is signed in:", user.uid);
    // 1. DISPLAY USER INFO
    emailInput.value = user.email || 'N/A'; // Display email
    // Note: Displaying a 'Username' might require a database lookup (like Firestore),
    // as it's not a standard property on the basic Firebase user object.
    usernameInput.value = 'Juan Dela Cruz (Placeholder)'; 

  } else {
    // User is signed out. Redirect them to the login page.
    console.log("No user signed in. Redirecting...");
    window.location.replace('/pages/login.html');
  }
});


// 2. PASSWORD UPDATE LOGIC
savePassBtn.addEventListener('click', async () => {
    if (!currentUser) {
        alert('Error: No user is currently logged in.');
        return;
    }

    const currentPassword = currentPassInput.value;
    const newPassword = newPassInput.value;
    const confirmPassword = confirmPassInput.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all password fields.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('New password and confirm password do not match.');
        return;
    }
    
    // Firebase requires re-authentication before sensitive operations like password change
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);

    try {
        await reauthenticateWithCredential(currentUser, credential);
        
        // Re-authentication successful, now update the password
        await updatePassword(currentUser, newPassword);
        
        alert('Password updated successfully!');
        
        // Clear the password fields
        currentPassInput.value = '';
        newPassInput.value = '';
        confirmPassInput.value = '';

    } catch (error) {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
             alert('Error: Incorrect current password or user not found.');
        } else if (error.code === 'auth/weak-password') {
             alert('Error: The new password is too weak.');
        } else {
            console.error('Password update error:', error);
            alert('Error updating password: ' + error.message);
        }
    }
});


// Add event listener to the logout button
document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => {
    // Sign-out successful.
    alert('You have been logged out successfully.');
    // Correctly use window.location.replace for redirection
    window.location.replace('/pages/login.html'); 
  }).catch((error) => {
    // An error happened.
    alert('Error logging out: ' + error.message);
  });
});