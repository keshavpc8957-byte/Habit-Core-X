// STORAGE
let users = JSON.parse(localStorage.getItem("users")) || {};

// SWITCH UI
function showSignup(){
  loginBox.classList.add("hidden");
  signupBox.classList.remove("hidden");
}
function showLogin(){
  signupBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
}

// PASSWORD TOGGLE
function togglePass(id, el){
  const input = document.getElementById(id);

  if(input.type === "password"){
    input.type = "text";
    el.textContent = "Hide";
  } else {
    input.type = "password";
    el.textContent = "Show";
  }
}

// SIGNUP
function signup(){
  const email = document.getElementById("email").value.trim();
  const name = document.getElementById("name").value.trim();

  if(users[email]){
    alert("User already exists");
    return;
  }

  if(!name){
  alert("Please enter your name");
  return;
  }

  users[email] = {
    name: document.getElementById("name").value.trim(),
    age: document.getElementById("age").value,
    profession: document.getElementById("profession").value,
    mobile: document.getElementById("mobile").value,
    password: btoa(document.getElementById("password").value),
    data: { habits:[], notes:{} }
  };

  localStorage.setItem("users", JSON.stringify(users));
  alert("Signup successful");
  showLogin();
}

// LOGIN
function login(){
  const email = loginEmail.value.trim();
  const pass = loginPassword.value;

  if(!users[email] || users[email].password !== btoa(pass)){
    alert("Invalid login");
    return;
  }
  localStorage.setItem("currentUser", email);
  localStorage.setItem("currentUserName", users[email].name);
  window.location.href = "../Dashboard/dashboard.html";
}
