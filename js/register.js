import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxTSnDc-z4wJ4fL9zf3kB3uuvZjcISNjQ",
  authDomain: "login-agriknows.firebaseapp.com",
  projectId: "login-agriknows",
  storageBucket: "login-agriknows.firebasestorage.app",
  messagingSenderId: "281355587751",
  appId: "1:281355587751:web:fb479b62b5036b44b68b82"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


//inputs
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;

//submit button /  signup button
const submit = document.getElementsById ('submit');  
submit.addEventListener("click", function (event) {
 event.preventDefault();
 alert(5);
});