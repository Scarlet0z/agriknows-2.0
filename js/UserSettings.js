import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail, 
  updateProfile, 
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
const usernameInput = document.getElementById('user-username');
const saveUserInfoBtn = document.getElementById('save-user-info-btn'); 

const currentPassInput = document.getElementById('current-password');
const newPassInput = document.getElementById('new-password');
const confirmPassInput = document.getElementById('confirm-password');
const savePassBtn = document.getElementById('save-password-btn');

// --- NEW REFERENCES FOR PASSWORD TOGGLE ---
const passwordToggles = document.querySelectorAll('.password-toggle');

// Variable to hold the current user object
let currentUser = null;

// This checks if the user is logged in every time the page loads
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user; // Store the user object
    console.log("User is signed in:", user.uid);
    
    //Use displayName for Username
    usernameInput.value = user.displayName || 'Set your username'; 
    emailInput.value = user.email || 'N/A'; // Display email

  } else {
    // User is signed out. Redirect them to the login page.
    console.log("No user signed in. Redirecting...");
    window.location.replace('/pages/login.html');
  }
});

// --- NEW PASSWORD TOGGLE LOGIC ---
passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        // Get the ID of the input field associated with this toggle
        const targetId = toggle.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggle.textContent = '🙉'; // Change icon to closed eye (or your preferred closed eye symbol)
        } else {
            passwordInput.type = 'password';
            toggle.textContent = '🙈'; // Change icon back to open eye
        }
    });
});
// --- END NEW PASSWORD TOGGLE LOGIC ---


// --- USERNAME/EMAIL UPDATE LOGIC (No Change) ---
saveUserInfoBtn.addEventListener('click', async () => {
    if (!currentUser) {
        alert('Error: No user is currently logged in.');
        return;
    }

    const newUsername = usernameInput.value.trim();
    const newEmail = emailInput.value.trim();
    let updates = {};
    let changesMade = false;

    if (newUsername !== (currentUser.displayName || '')) {
        updates.displayName = newUsername;
        changesMade = true;
    }

    if (newEmail !== currentUser.email) {
        alert("To change your email address, you must first re-authenticate (e.g., provide your current password). Due to Firebase security protocols, the email update cannot be handled by the 'SAVE' button in this section.");
        emailInput.value = currentUser.email;
        return; 
    }

    if (!changesMade) {
        alert('No changes detected in username.');
        return;
    }

if (updates.displayName) {
    try {
        await updateProfile(currentUser, updates); 
        alert('Username updated successfully!');
        
        currentUser.displayName = newUsername; 
        
    } catch (error) {
        console.error('Username update error:', error);
        alert('Error updating username: ' + error.message);
    }
}
});


// --- PASSWORD UPDATE LOGIC---
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
    
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);

    try {
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        
        alert('Password updated successfully!');
        
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


document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => {
    alert('You have been logged out successfully.');
    window.location.replace('/pages/login.html'); 
  }).catch((error) => {
    alert('Error logging out: ' + error.message);
  });
});