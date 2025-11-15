import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

//web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxTSnDc-z4wJ4fL9zf3kB3uuvZjcISNjQ",
  authDomain: "login-agriknows.firebaseapp.com",
  projectId: "login-agriknows",
  storageBucket: "login-agriknows.firebasestorage.app",
  messagingSenderId: "281355587751",
  appId: "1:281355587751:web:fb479b62b5036b44b68b82",
};

//show pass
document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById("togglePassword");
  const password = document.getElementById("password");

  if (togglePassword && password) {
    togglePassword.addEventListener("click", () => {
      const isPasswordHidden = password.getAttribute("type") === "password";

      // Toggle password visibility
      password.setAttribute("type", isPasswordHidden ? "text" : "password");

      // Toggle the icon image
      togglePassword.src = isPasswordHidden
        ? "/image/hide.png" // when showing password
        : "/image/show.png"; // when hiding password
    });
  }
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- ADD THIS: Google Sign-In Logic ---
const googleLoginBtn = document.getElementById("google-login-btn");
const provider = new GoogleAuthProvider(); // Create a Google provider instance

googleLoginBtn.addEventListener("click", (event) => {
  event.preventDefault(); // Prevent default button behavior

  signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;

      console.log("Signed in with Google:", user);
      alert("Signed In Successfully with Google!");
      window.location.href = "/index.html"; // Redirect to your main page
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Google Sign-In Error:", errorMessage);
      alert(`Error: ${errorMessage}`);
    });
});
// ------------------------------------

const submit = document.getElementById("submit");
submit.addEventListener("click", function (event) {
  event.preventDefault();

  //inputs
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

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

//reset 
const reset = document.getElementById("reset");
reset.addEventListener('click', function(event){
event.preventDefault()

const email = document.getElementById("email").value;
sendPasswordResetEmail(auth, email)
  .then(() => {
    alert("email sent!") 
    
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert(errorMessage)
  });
})