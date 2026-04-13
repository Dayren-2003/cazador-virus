const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ESTADOS
let gameState = "menu";

let score = 0;
let level = 1;
let lives = 3;
let highScore = localStorage.getItem("highScore") || 0;

let shake = 0;

// PLAYER
let player = {
  x: canvas.width / 2,
  y: canvas.height - 120
};

// ARRAYS
let viruses = [];
let lasers = [];
let explosions = [];

// CONTROLES
let moveLeft = false;
let moveRight = false;
const speed = 7;

// IMÁGENES
const fondo = new Image();
fondo.src = "assets/fondo.jpg";

const virusImg = new Image();
virusImg.src = "assets/virus.png";

const armaImg = new Image();
armaImg.src = "assets/arma.png";

const explosionImg = new Image();
explosionImg.src = "assets/explosion.png";

const heartImg = new Image();
heartImg.src = "assets/heart.png";

// SONIDOS
const laserSound = new Audio("assets/laser.mp3");
const explosionSound = new Audio("assets/explosion.mp3");

const menuMusic = new Audio("assets/menu.mp3");
menuMusic.loop = true;

const gameOverMusic = new Audio("assets/gameover.mp3");

// 🔊 ACTIVAR AUDIO (CLAVE)
function enableAudio() {
  menuMusic.volume = 0.5;
  gameOverMusic.volume = 0.5;

  menuMusic.play().catch(()=>{});
}

// PRIMER CLICK ACTIVA AUDIO
window.addEventListener("click", enableAudio, { once: true });

// NIVELES
const levelScores = [0, 5, 10, 15, 20, 30, 40, 50, 70, 100];

// BOTONES
const levelsDiv = document.getElementById("levels");

for (let i = 1; i <= 10; i++) {
  const btn = document.createElement("button");
  btn.innerText = i;
  btn.onclick = () => level = i;
  levelsDiv.appendChild(btn);
}

// DISPARO (RECTO HACIA ARRIBA)
function shoot() {
  lasers.push({
    x: player.x,
    y: player.y,
    width: 4,
    height: 20
  });

  laserSound.currentTime = 0;
  laserSound.play();
}

// INICIAR
function startGame() {
  document.getElementById("menu").style.display = "none";

  menuMusic.pause();

  gameState = "playing";
  score = 0;
  lives = 3;

  viruses = [];
  lasers = [];
  explosions = [];

  spawnVirusLoop();
}

// REINICIAR
function restartGame() {
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("menu").style.display = "flex";

  gameOverMusic.pause();

  gameState = "menu";

  menuMusic.play().catch(()=>{});
}

// VIRUS
function spawnVirusLoop() {
  if (gameState !== "playing") return;

  viruses.push({
    x: Math.random() * (canvas.width - 60),
    y: -60,
    size: 60,
    speed: 1 + Math.random() * level
  });

  let delay = 2000 - level * 150;
  if (delay < 400) delay = 400;

  setTimeout(spawnVirusLoop, delay);
}

// CONTROLES
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") moveLeft = true;
  if (e.key === "ArrowRight") moveRight = true;

  if (e.code === "Space" && gameState === "playing") shoot();
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") moveLeft = false;
  if (e.key === "ArrowRight") moveRight = false;
});

window.addEventListener("mousemove", (e) => {
  if (gameState === "playing") player.x = e.clientX;
});

window.addEventListener("click", () => {
  if (gameState === "playing") shoot();
});

// COLISIÓN
function collision(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.width > b.x &&
    a.y < b.y + b.size &&
    a.y + a.height > b.y
  );
}

// GAME OVER
function endGame() {
  gameState = "gameover";

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }

  document.getElementById("gameOver").style.display = "flex";
  document.getElementById("finalScore").innerText =
    "Puntuación: " + score + " | Récord: " + highScore;

  gameOverMusic.play().catch(()=>{});

  shake = 20;
}

// LOOP
function animate() {
  requestAnimationFrame(animate);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

  if (gameState === "playing") {

    if (moveLeft) player.x -= speed;
    if (moveRight) player.x += speed;

    // 🔫 ARMA FIJA (SIN ROTACIÓN)
    ctx.drawImage(armaImg, player.x - 30, player.y, 60, 60);

    // VIRUS
    for (let i = viruses.length - 1; i >= 0; i--) {
      let v = viruses[i];

      ctx.drawImage(virusImg, v.x, v.y, v.size, v.size);
      v.y += v.speed;

      if (v.y > canvas.height) {
        viruses.splice(i, 1);
        lives--;

        if (lives <= 0) endGame();
      }
    }

    // LASERS
    for (let i = lasers.length - 1; i >= 0; i--) {
      let l = lasers[i];
      l.y -= 10;

      ctx.fillStyle = "cyan";
      ctx.fillRect(l.x, l.y, l.width, l.height);

      if (l.y < 0) {
        lasers.splice(i, 1);
        continue;
      }

      for (let j = viruses.length - 1; j >= 0; j--) {
        let v = viruses[j];

        if (collision(l, v)) {
          explosions.push({ x: v.x, y: v.y, time: 20 });

          explosionSound.currentTime = 0;
          explosionSound.play();

          viruses.splice(j, 1);
          lasers.splice(i, 1);
          score++;

          if (score >= levelScores[level] && level < 10) level++;

          break;
        }
      }
    }

    // EXPLOSIONES
    for (let i = explosions.length - 1; i >= 0; i--) {
      let e = explosions[i];

      ctx.drawImage(explosionImg, e.x, e.y, 60, 60);
      e.time--;

      if (e.time <= 0) explosions.splice(i, 1);
    }

    // ❤️ VIDAS
    for (let i = 0; i < lives; i++) {
      ctx.drawImage(heartImg, 20 + i * 40, 20, 30, 30);
    }

    // UI
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Puntos: " + score, 20, 80);
    ctx.fillText("Nivel: " + level, 20, 110);
    ctx.fillText("Récord: " + highScore, 20, 140);
  }
}

// INICIO
animate();