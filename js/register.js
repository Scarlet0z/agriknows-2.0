import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCq4lH4tj4AS9-cqvM29um--Nu4v2UdvZw",
  authDomain: "agriknows-data.firebaseapp.com",
  databaseURL: "https://agriknows-data-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agriknows-data",
  storageBucket: "agriknows-data.firebasestorage.app",
  messagingSenderId: "922008629713",
  appId: "1:922008629713:web:5cf15ca9d47036b9a8f0f0"
};


// Show/Hide Password
document.addEventListener('DOMContentLoaded', () => {
  const togglePassword = document.getElementById('togglePassword');
  const password = document.getElementById('password');

  if (togglePassword && password) {
    togglePassword.addEventListener('click', () => {
      // Toggle the type attribute
      const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', type);

      // Toggle the icon
      if (type === 'text') {
        togglePassword.src = '/image/hide.png'; // password is visible, show "hide" icon
      } else {
        togglePassword.src = '/image/show.png'; // password is hidden, show "show" icon
      }
    });
  }
});


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'en' 
const provider = new GoogleAuthProvider();

const googleLogin = document.getElementById("google-login-btn");
googleLogin.addEventListener("click", function(){
  signInWithPopup(auth, provider)
  .then((result) => {
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;
    console.log(user);
    window.location.href = "/index.html";

  }).catch((error) => {

    const errorCode = error.code;
    const errorMessage = error.message;

  });
})


//submit button /  signup button
const submit = document.getElementById("submit");
submit.addEventListener("click", function (event) {
  event.preventDefault();

  //inputs
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    const user = userCredential.user;

    // 1️⃣ Save username to Firebase Auth
    await updateProfile(user, {
      displayName: username
    });

    // 2️⃣ Save user info to Realtime Database
    const db = getDatabase();
    await set(ref(db, "users/" + user.uid), {
      username: username,
      email: email
    });

    alert("Account Created Successfully!");
    window.location.href = "/index.html";
  })
  .catch((error) => {
    alert(error.message);
  });

});