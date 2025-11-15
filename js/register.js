import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
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


//show pass
document.addEventListener('DOMContentLoaded', () => {
  const togglePassword = document.getElementById('togglePassword');
  const password = document.getElementById('password');

  if (togglePassword && password) {
    togglePassword.addEventListener('click', (e) => {
      const isPasswordHidden = password.getAttribute('type') === 'password';

      // Toggle password visibility
      password.setAttribute('type', isPasswordHidden ? 'text' : 'password');

      // Toggle the icon image
      togglePassword.src = isPasswordHidden 
        ? '/image/hide.png'
        : '/image/show.png';
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
    .then((userCredential) => {
      // Signed up
      const user = userCredential.user;
      alert("Creating Account...");
      window.location.href = "/index.html";
      
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(errorMessage);
      
    });
});