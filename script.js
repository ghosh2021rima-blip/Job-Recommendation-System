// Menu 
const MENUS = {
 user: {
  items: ["Dashboard","My Profile","Find Jobs","Recommended Jobs","My Applications","Saved Jobs","Notifications","Settings"],
  dashboard: ["Application Sent","Application Status","Response Rate"]
 },
 admin: {
  items: ["Dashboard","Manage Users","Manage Jobs","API Management","Job Synchronization","ML Recommendation Analytics","Report & Analytics","Settings"],
  dashboard: ["Recent Registered Users","Recent Fetched Jobs","API Connection Details","Job Statistics","Recommendation Statistics","System Activity"]
 }
};

const $ = id => document.getElementById(id);
const KEY = "jobmatch_users", SESSION = "jobmatch_session";
let memUsers = null, memSession = null; 
let current = null;

/*Storage helpers*/
function load(key){
 try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
 catch(e){ return key === KEY ? memUsers : memSession; }
}
function save(key, val){
 try{ localStorage.setItem(key, JSON.stringify(val)); }
 catch(e){ if(key === KEY) memUsers = val; else memSession = val; }
}
function clear(key){
 try{ localStorage.removeItem(key); }
 catch(e){ memSession = null; }
}
function users(){
 let u = load(KEY);
 if(!u){
  u = [{name:"Admin", email:"admin@jobmatch.com", pass:"admin123", role:"admin"}];
  save(KEY, u);
 }
 return u;
}

/*Messages & tabs*/
function say(text, ok){
 const m = $("msg");
 m.textContent = text;
 m.className = "msg" + (ok ? " ok" : "");
}

function showTab(login){
 $("tabs").classList.remove("hidden");
 $("forgotBox").classList.add("hidden");
 $("loginBox").classList.toggle("hidden", !login);
 $("signupBox").classList.toggle("hidden", login);
 $("tLogin").classList.toggle("on", login);
 $("tSignup").classList.toggle("on", !login);
 $("subtitle").textContent = login
  ? "Log in to find jobs matched to you."
  : "Create a free account to start applying.";
 say("");
}
$("tLogin").onclick = () => showTab(true);
$("tSignup").onclick = () => showTab(false);

/*Signup*/
$("signupBtn").onclick = () => {
 const name = $("sName").value.trim();
 const email = $("sEmail").value.trim().toLowerCase();
 const p = $("sPass").value, p2 = $("sPass2").value;

 if(!name || !email || !p) return say("Fill in all fields.");
 if(!/^\S+@\S+\.\S+$/.test(email)) return say("Enter a valid email address.");
 if(p.length < 6) return say("Password must be at least 6 characters.");
 if(p !== p2) return say("Passwords do not match.");

 const list = users();
 if(list.some(u => u.email === email)) return say("This email is already registered. Log in instead.");

 list.push({name, email, pass:p, role:"user"});
 save(KEY, list);
 showTab(true);
 $("lEmail").value = email;
 say("Account created. Log in to continue.", true);
};

/*Login*/
$("loginBtn").onclick = () => {
 const role = $("lRole").value;
 const email = $("lEmail").value.trim().toLowerCase();
 const p = $("lPass").value;

 if(!email || !p) return say("Enter your email and password.");
 const u = users().find(x => x.email === email && x.pass === p);
 if(!u) return say("Wrong email or password.");
 if(u.role !== role) return say("This account is a " + u.role + " account. Change 'Log in as'.");

 const session = {name:u.name, email:u.email, role:u.role};
 save(SESSION, session);
 openApp(session);
};

["lEmail","lPass"].forEach(id =>
 $(id).addEventListener("keydown", e => { if(e.key === "Enter") $("loginBtn").click(); })
);

/*Forgot password*/
let resetEmail = null, resetCode = null, resetExpiry = 0;

function showForgot(){
 $("loginBox").classList.add("hidden");
 $("signupBox").classList.add("hidden");
 $("tabs").classList.add("hidden");
 $("forgotBox").classList.remove("hidden");
 $("fStep1").classList.remove("hidden");
 $("fStep2").classList.add("hidden");
 $("subtitle").textContent = "Reset your password.";
 $("fEmail").value = $("lEmail").value;
 say("");
}
$("forgotLink").onclick = showForgot;
$("backLogin").onclick = () => showTab(true);

$("sendCodeBtn").onclick = () => {
 const email = $("fEmail").value.trim().toLowerCase();
 if(!email) return say("Enter your registered email.");
 if(!users().some(u => u.email === email)) return say("No account found with this email.");

 resetEmail = email;
 resetCode = String(Math.floor(100000 + Math.random() * 900000));
 resetExpiry = Date.now() + 10 * 60 * 1000; // valid for 10 minutes

 $("fStep1").classList.add("hidden");
 $("fStep2").classList.remove("hidden");
 // DEMO ONLY
 say("Demo reset code: " + resetCode, true);
};

$("resetBtn").onclick = () => {
 const code = $("fCode").value.trim();
 const p = $("fPass").value, p2 = $("fPass2").value;

 if(!resetCode || Date.now() > resetExpiry) return say("Code expired. Request a new one.");
 if(code !== resetCode) return say("Incorrect reset code.");
 if(p.length < 6) return say("Password must be at least 6 characters.");
 if(p !== p2) return say("Passwords do not match.");

 const list = users();
 const u = list.find(x => x.email === resetEmail);
 if(!u) return say("Account not found.");
 u.pass = p;
 save(KEY, list);

 resetEmail = resetCode = null;
 ["fCode","fPass","fPass2"].forEach(id => $(id).value = "");
 showTab(true);
 $("lEmail").value = u.email;
 say("Password updated. Log in with your new password.", true);
};

/*After login*/
function openApp(s){
 current = s;
 $("auth").classList.add("hidden");
 $("app").classList.remove("hidden");
 $("who").textContent = s.name + " (" + s.role + ")";

 const menu = $("menu");
 menu.innerHTML = "";
 MENUS[s.role].items.forEach(name => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = name;
  b.onclick = () => { go(name); $("side").classList.remove("open"); };
  menu.appendChild(b);
 });
 go("Dashboard");
}

function go(name){
 [...$("menu").children].forEach(b => b.classList.toggle("on", b.textContent === name));
 $("pageTitle").textContent = name;
 const body = $("pageBody");
 body.innerHTML = "";

 const p = document.createElement("p");
 p.className = "muted";

 if(name === "Dashboard"){
  p.textContent = "Welcome back, " + current.name + ".";
  const g = document.createElement("div");
  g.className = "grid";
  MENUS[current.role].dashboard.forEach(t => {
   const d = document.createElement("div");
   d.className = "tile";
   d.innerHTML = "<b></b><span>No data yet</span>";
   d.querySelector("b").textContent = t;
   g.appendChild(d);
  });
  body.append(p, g);
 } else {
  p.textContent = "The " + name + " page goes here.";
  body.appendChild(p);
 }
}

$("logoutBtn").onclick = () => {
 clear(SESSION);
 current = null;
 $("app").classList.add("hidden");
 $("auth").classList.remove("hidden");
 $("lPass").value = "";
 showTab(true);
};

$("menuBtn").onclick = () => $("side").classList.toggle("open");


const saved = load(SESSION);
if(saved && saved.role && MENUS[saved.role]) openApp(saved);