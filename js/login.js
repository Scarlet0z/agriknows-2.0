import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
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

//Show/Hide Password 
document.addEventListener('DOMContentLoaded', () => {
  const togglePassword = document.getElementById('togglePassword');
  const password = document.getElementById('password');

  if (togglePassword && password) {
    togglePassword.addEventListener('click', function () {
      // Check current type
      const isPasswordHidden = password.getAttribute('type') === 'password';
      
      // Toggle password visibility
      password.setAttribute('type', isPasswordHidden ? 'text' : 'password');

      // Toggle the icon image
      togglePassword.src = isPasswordHidden 
        ? '/image/show.png'   // When showing password
        : '/image/hide.png';  // When hiding password
    });
  }
});



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

//submit button /  signup button
const submit = document.getElementById("submit");
submit.addEventListener("click", function (event) {
  event.preventDefault();

  //inputs
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

    password.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      form.requestSubmit(); // triggers the submit event
    }
  });

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up
      const user = userCredential.user;
      alert("Signed In Successfully!");
      window.location.href = "/index.html";
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(errorMessage);
      // ..
    });
});
