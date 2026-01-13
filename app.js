"use strict";

function $(id) {
  return document.getElementById(id);
}

function randomColor() {
  var r = Math.floor(Math.random() * 200) + 30;
  var g = Math.floor(Math.random() * 200) + 30;
  var b = Math.floor(Math.random() * 200) + 30;
  return "rgb(" + r + "," + g + "," + b + ")";
}

function loadJSON(url, onOk) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        onOk(JSON.parse(xhr.responseText));
      }
    }
  };
  xhr.send();
}

function initAuth() {
  var form = $("loginForm");
  if (!form) return;

  var status = $("authStatus");
  var logoutBtn = $("logoutBtn");

  function updateStatus() {
    var user = sessionStorage.getItem("sessionUser");
    if (user) {
      status.textContent = "Autentificat: " + user;
      logoutBtn.disabled = false;
    } else {
      status.textContent = "Neautentificat";
      logoutBtn.disabled = true;
    }
  }

  form.onsubmit = function (event) {
    event.preventDefault();

    var u = $("loginUser").value.trim();
    var p = $("loginPass").value;

    loadJSON("users.json", function (users) {
      var ok = false;
      var i;

      for (i = 0; i < users.length; i++) {
        if (users[i].username === u && users[i].password === p) ok = true;
      }

      if (ok) {
        sessionStorage.setItem("sessionUser", u);
        updateStatus();
      } else {
        status.textContent = "User/parolă greșite.";
      }
    });
  };

  logoutBtn.onclick = function () {
    sessionStorage.removeItem("sessionUser");
    updateStatus();
  };

  updateStatus();
}

function initIndexControls() {
  var range = $("fontRange");
  var out = $("fontValue");
  var btn = $("randColorBtn");
  var tip = $("rotatingTip");

  if (range) {
    range.oninput = function () {
      document.documentElement.style.fontSize = range.value + "px";
      if (out) out.textContent = range.value;
      localStorage.setItem("fontSize", range.value);
    };

    var saved = localStorage.getItem("fontSize");
    if (saved) {
      document.documentElement.style.fontSize = saved + "px";
      range.value = saved;
      if (out) out.textContent = saved;
    }
  }

  if (btn) {
    btn.onclick = function () {
      var c = randomColor();
      document.documentElement.style.setProperty("--accent", c);
      localStorage.setItem("accent", c);
    };

    var a = localStorage.getItem("accent");
    if (a) document.documentElement.style.setProperty("--accent", a);
  }

  if (tip) {
    var tips = [
      "Joacă simplu la început.",
      "Folosește lobul ca să câștigi timp.",
      "Comunică mereu cu partenerul.",
      "Poziționarea bate forța."
    ];
    var i = 0;
    tip.textContent = tips[0];

    setInterval(function () {
      i = (i + 1) % tips.length;
      tip.textContent = tips[i];
    }, 3000);
  }

  document.body.onkeyup = function (event) {
    if (event.key === "/") {
      var inp = $("loginUser");
      if (inp) inp.focus();
    }
  };
}

function initSignupForm() {
  var form = $("signupForm");
  if (!form) return;

  var msg = $("formMsg");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var phoneRe = /^07\d{2}\s?\d{3}\s?\d{3}$/;

  form.onsubmit = function (event) {
    event.preventDefault();

    var name = $("sName").value.trim();
    var email = $("sEmail").value.trim();
    var phone = $("sPhone").value.trim();
    var terms = $("sTerms").checked;

    var errors = [];

    if (name.length < 2) errors.push("Nume prea scurt.");
    if (!emailRe.test(email)) errors.push("Email invalid.");
    if (!phoneRe.test(phone)) errors.push("Telefon invalid.");
    if (!terms) errors.push("Acceptă termenii.");

    if (errors.length) {
      msg.textContent = errors.join(" ");
      msg.style.color = "crimson";
    } else {
      msg.textContent = "Trimis cu succes!";
      msg.style.color = "green";

      form.style.outline = "3px solid var(--accent)";
      setTimeout(function () {
        form.style.outline = "";
      }, 900);
    }
  };
}

function makePlayerCard(p) {
  var card = document.createElement("article");
  card.className = "player-card";
  card.setAttribute("data-id", p.id);

  var img = document.createElement("img");
  img.src = p.img;
  img.alt = p.name;

  var h = document.createElement("h3");
  h.textContent = p.name;

  var t = document.createElement("p");
  t.textContent = "Țară: " + p.country + " | Rank: " + p.rank;

  var favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.textContent = "Favorite";

  var delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.textContent = "Șterge";

  card.appendChild(img);
  card.appendChild(h);
  card.appendChild(t);
  card.appendChild(favBtn);
  card.appendChild(delBtn);

  card.onclick = function (event) {
    var who = "target=" + event.target.tagName + ", currentTarget=" + event.currentTarget.tagName;
    card.setAttribute("data-lastclick", who);
    card.classList.toggle("picked");
  };

  favBtn.onclick = function (event) {
    event.stopPropagation();

    favBtn.classList.toggle("active");

    var arr = JSON.parse(localStorage.getItem("favPlayers") || "[]");
    var exists = false;
    var i;

    for (i = 0; i < arr.length; i++) {
      if (arr[i].id === p.id) exists = true;
    }
    if (!exists) arr.push(p);

    localStorage.setItem("favPlayers", JSON.stringify(arr));
  };

  delBtn.onclick = function (event) {
    event.stopPropagation();
    if (card.parentNode) card.parentNode.removeChild(card);
  };

  return card;
}

function initPlayers() {
  var grid = $("playersGrid");
  if (!grid) return;

  loadJSON("players.json", function (players) {
    players.sort(function (a, b) {
      return a.rank - b.rank;
    });

    var i;
    for (i = 0; i < players.length; i++) {
      grid.appendChild(makePlayerCard(players[i]));
    }
  });

  var form = $("playerForm");
  if (!form) return;

  form.onsubmit = function (event) {
    event.preventDefault();

    var p = {
      id: "u" + Math.floor(Math.random() * 1000000),
      name: $("pName").value.trim(),
      country: $("pCountry").value.trim(),
      rank: parseInt($("pRank").value, 10),
      img: $("pImg").value.trim()
    };

    grid.appendChild(makePlayerCard(p));
    form.reset();
  };
}

function initFavorites() {
  var select = $("equipSelect");
  var addBtn = $("addFavBtn");
  var clearBtn = $("clearFavBtn");
  var list = $("favList");

  if (!select || !addBtn || !clearBtn || !list) return;

  function render() {
    list.innerHTML = "";
    var arr = JSON.parse(localStorage.getItem("favorites") || "[]");
    var i;

    for (i = 0; i < arr.length; i++) {
      var li = document.createElement("li");
      li.textContent = arr[i];
      list.appendChild(li);
    }
  }

  addBtn.onclick = function () {
    var arr = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (arr.indexOf(select.value) === -1) arr.push(select.value);
    localStorage.setItem("favorites", JSON.stringify(arr));
    render();
  };

  clearBtn.onclick = function () {
    localStorage.removeItem("favorites");
    render();
  };

  render();
}

function initCanvas() {
  var canvas = $("courtCanvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var ball = { x: 60, y: 60, vx: 2.5, vy: 1.8, r: 8 };

  function drawCourt() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 20);
    ctx.lineTo(canvas.width / 2, canvas.height - 20);
    ctx.stroke();
  }

  function tick() {
    drawCourt();

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 20 || ball.x + ball.r > canvas.width - 20) ball.vx *= -1;
    if (ball.y - ball.r < 20 || ball.y + ball.r > canvas.height - 20) ball.vy *= -1;

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  setInterval(tick, 16);

  canvas.onclick = function () {
    ball.vx = (Math.random() * 4 + 1) * (Math.random() < 0.5 ? -1 : 1);
    ball.vy = (Math.random() * 4 + 1) * (Math.random() < 0.5 ? -1 : 1);
  };
}

function initSVG() {
  var svg = $("racketSvg");
  var btn = $("svgColorBtn");
  if (!svg || !btn) return;

  btn.onclick = function () {
    svg.style.color = randomColor();
  };
}
function initUserToggle(){
  var btn = document.getElementById("userToggle");
  var box = document.getElementById("authBox");
  if(!btn || !box) return;

  btn.onclick = function(){
    if(box.style.display === "block"){
      box.style.display = "none";
    }else{
      box.style.display = "block";
    }
  };

  document.addEventListener("click", function(e){
    if(!btn.contains(e.target) && !box.contains(e.target)){
      box.style.display = "none";
    }
  });
}
function initSelectorsAndComputed() {
  var navLinks = document.querySelectorAll(".main-nav a");

  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].onclick = function () {
     
      var actives = document.getElementsByClassName("active");
      while (actives.length) actives[0].classList.remove("active");

      this.classList.add("active");
      var cs = getComputedStyle(this);
      document.body.style.borderTop = "6px solid " + cs.color;
    };
  }
}


window.onload = function(){
  initUserToggle();
  initAuth();
  initIndexControls();
  initSignupForm();
  initPlayers();
  initFavorites();
  initCanvas();
  initSVG();
  initSelectorsAndComputed();
};



