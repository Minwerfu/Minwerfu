// ============================================================
//  NAVE ESPACIAL VS OLEADAS - Shooter espacial 2D
//  HTML5 Canvas + JavaScript puro (sin dependencias)
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;

// ------- Parámetros clave (según especificación) -------
const MATCH_DURATION = 600;          // 10 minutos en segundos
const PLAYER_SHOT_COOLDOWN = 0.30;   // segundos
const ENEMY_SHOT_COOLDOWN = 0.70;    // segundos (fijo, según spec)
const PLAYER_SPEED = 320;            // px/s
const PLAYER_BULLET_SPEED = 560;     // px/s
const PLAYER_SIZE = 28;

// ------- Estado global del juego -------
let keys = {};
let player, playerBullets, enemies, enemyBullets;
let elapsed = 0;
let lastTimestamp = null;
let gameStarted = false;
let gameOver = false;
let win = false;
let spawnTimer = 0;
let particles = [];

const hudTimer = document.getElementById('timer');
const hudStatus = document.getElementById('status');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySubtitle = document.getElementById('overlay-subtitle');
const restartBtn = document.getElementById('restart-btn');
const startHint = document.getElementById('start-hint');

// ============================================================
//  INICIALIZACIÓN / REINICIO
// ============================================================
function initGame() {
  player = {
    x: CANVAS_W / 2,
    y: CANVAS_H - 60,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    lastShot: -999,
    alive: true
  };
  playerBullets = [];
  enemies = [];
  enemyBullets = [];
  particles = [];
  elapsed = 0;
  spawnTimer = 0;
  lastTimestamp = null;
  gameOver = false;
  win = false;
  overlay.classList.add('hidden');
  updateHud();
}

// ============================================================
//  DIFICULTAD PROGRESIVA (en función del tiempo transcurrido)
// ============================================================
function getSpawnInterval(t) {
  // Empieza en ~1.6s entre spawns y baja hasta un mínimo de 0.3s
  return Math.max(1.6 - t * 0.0022, 0.3);
}

function getEnemySpeed(t) {
  // Velocidad base 70 px/s, sube progresivamente con el tiempo
  return 70 + t * 0.28;
}

function getGlobalSpeedMultiplier(t) {
  // Ligero aumento de la velocidad general de la partida (hasta ~1.4x)
  return 1 + t / 1500;
}

function getHeavyEnemyChance(t) {
  // A partir de los 2 minutos empiezan a aparecer enemigos "pesados" (3 impactos)
  if (t < 120) return 0;
  return Math.min((t - 120) / 900, 0.35);
}

// ============================================================
//  INPUT
// ============================================================
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!gameStarted && !gameOver) {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
      startGame();
    }
  }
  if (e.code === 'Space') e.preventDefault();
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

restartBtn.addEventListener('click', () => {
  initGame();
  startGame();
});

function startGame() {
  gameStarted = true;
  startHint.style.display = 'none';
  requestAnimationFrame(loop);
}

// ============================================================
//  SPAWN DE ENEMIGOS
// ============================================================
function spawnEnemy() {
  const heavyChance = getHeavyEnemyChance(elapsed);
  const isHeavy = Math.random() < heavyChance;

  enemies.push({
    x: 30 + Math.random() * (CANVAS_W - 60),
    y: -30,
    w: isHeavy ? 34 : 26,
    h: isHeavy ? 34 : 26,
    hp: isHeavy ? 3 : 1,
    maxHp: isHeavy ? 3 : 1,
    speed: getEnemySpeed(elapsed) * (isHeavy ? 0.8 : 1),
    lastShot: elapsed + Math.random() * ENEMY_SHOT_COOLDOWN, // desfase inicial
    oscBase: Math.random() * Math.PI * 2,
    oscAmp: 40 + Math.random() * 40,
    heavy: isHeavy
  });
}

// ============================================================
//  ACTUALIZACIÓN (UPDATE)
// ============================================================
function update(dt) {
  elapsed += dt;

  if (elapsed >= MATCH_DURATION) {
    endGame(true);
    return;
  }

  const speedMult = getGlobalSpeedMultiplier(elapsed);

  // --- Movimiento del jugador ---
  let dx = 0, dy = 0;
  if (keys['KeyW']) dy -= 1;
  if (keys['KeyS']) dy += 1;
  if (keys['KeyA']) dx -= 1;
  if (keys['KeyD']) dx += 1;
  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  player.x += dx * PLAYER_SPEED * dt;
  player.y += dy * PLAYER_SPEED * dt;
  player.x = Math.max(player.w / 2, Math.min(CANVAS_W - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(CANVAS_H - player.h / 2, player.y));

  // --- Disparo del jugador ---
  if (keys['Space'] && elapsed - player.lastShot >= PLAYER_SHOT_COOLDOWN) {
    player.lastShot = elapsed;
    playerBullets.push({
      x: player.x,
      y: player.y - player.h / 2,
      vx: 0,
      vy: -PLAYER_BULLET_SPEED * speedMult
    });
  }

  // --- Spawn de enemigos ---
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = getSpawnInterval(elapsed);
  }

  // --- Actualizar balas del jugador ---
  playerBullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; });
  playerBullets = playerBullets.filter(b => b.y > -20);

  // --- Actualizar enemigos ---
  enemies.forEach(en => {
    en.speed = getEnemySpeed(elapsed) * (en.heavy ? 0.8 : 1);
    en.y += en.speed * speedMult * dt;
    en.x += Math.sin(elapsed * 1.5 + en.oscBase) * 0.6;

    // Disparo enemigo cada ENEMY_SHOT_COOLDOWN segundos
    if (elapsed - en.lastShot >= ENEMY_SHOT_COOLDOWN && en.y > 0) {
      en.lastShot = elapsed;
      const dirX = player.x - en.x;
      const dirY = player.y - en.y;
      const len = Math.hypot(dirX, dirY) || 1;
      const bulletSpeed = (220 + elapsed * 0.15) * speedMult;
      enemyBullets.push({
        x: en.x,
        y: en.y,
        vx: (dirX / len) * bulletSpeed,
        vy: (dirY / len) * bulletSpeed
      });
    }
  });
  enemies = enemies.filter(en => en.y < CANVAS_H + 60);

  // --- Actualizar balas enemigas ---
  enemyBullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; });
  enemyBullets = enemyBullets.filter(b =>
    b.x > -20 && b.x < CANVAS_W + 20 && b.y > -20 && b.y < CANVAS_H + 20
  );

  // --- Colisiones: balas jugador vs enemigos ---
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    for (let j = playerBullets.length - 1; j >= 0; j--) {
      const b = playerBullets[j];
      if (Math.abs(b.x - en.x) < en.w / 2 && Math.abs(b.y - en.y) < en.h / 2) {
        playerBullets.splice(j, 1);
        en.hp -= 1;
        if (en.hp <= 0) {
          spawnExplosion(en.x, en.y);
          enemies.splice(i, 1);
        }
        break;
      }
    }
  }

  // --- Colisiones: balas enemigas vs jugador ---
  if (player.alive) {
    for (let k = enemyBullets.length - 1; k >= 0; k--) {
      const b = enemyBullets[k];
      if (Math.abs(b.x - player.x) < player.w / 2 && Math.abs(b.y - player.y) < player.h / 2) {
        enemyBullets.splice(k, 1);
        player.alive = false;
        spawnExplosion(player.x, player.y);
        endGame(false);
        return;
      }
    }
    // --- Colisión directa: enemigo choca contra el jugador ---
    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];
      if (Math.abs(en.x - player.x) < (en.w + player.w) / 2.4 &&
          Math.abs(en.y - player.y) < (en.h + player.h) / 2.4) {
        player.alive = false;
        spawnExplosion(player.x, player.y);
        endGame(false);
        return;
      }
    }
  }

  // --- Partículas de explosión ---
  particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
  particles = particles.filter(p => p.life > 0);

  updateHud();
}

function spawnExplosion(x, y) {
  for (let i = 0; i < 10; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 60 + Math.random() * 120;
    particles.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 0.4 + Math.random() * 0.3
    });
  }
}

// ============================================================
//  RENDER
// ============================================================
function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Fondo estrellado simple
  drawStars();

  // Jugador
  if (player.alive) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = '#7fd7ff';
    ctx.shadowColor = '#7fd7ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -player.h / 2);
    ctx.lineTo(player.w / 2, player.h / 2);
    ctx.lineTo(0, player.h / 3);
    ctx.lineTo(-player.w / 2, player.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Balas del jugador
  ctx.fillStyle = '#baffc9';
  ctx.shadowColor = '#baffc9';
  ctx.shadowBlur = 6;
  playerBullets.forEach(b => {
    ctx.fillRect(b.x - 2, b.y - 8, 4, 14);
  });
  ctx.shadowBlur = 0;

  // Enemigos
  enemies.forEach(en => {
    ctx.fillStyle = en.heavy ? '#ff9c4a' : '#ff5c5c';
    ctx.save();
    ctx.translate(en.x, en.y);
    ctx.beginPath();
    ctx.moveTo(0, en.h / 2);
    ctx.lineTo(en.w / 2, -en.h / 2);
    ctx.lineTo(-en.w / 2, -en.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Barra de vida para enemigos "pesados"
    if (en.heavy) {
      ctx.fillStyle = '#222';
      ctx.fillRect(en.x - 18, en.y - en.h / 2 - 10, 36, 4);
      ctx.fillStyle = '#6dffb0';
      ctx.fillRect(en.x - 18, en.y - en.h / 2 - 10, 36 * (en.hp / en.maxHp), 4);
    }
  });

  // Balas enemigas
  ctx.fillStyle = '#ffd15c';
  enemyBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Partículas
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  });
}

let stars = null;
function drawStars() {
  if (!stars) {
    stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        r: Math.random() * 1.6 + 0.3,
        s: Math.random() * 30 + 10
      });
    }
  }
  ctx.fillStyle = '#ffffff';
  stars.forEach(s => {
    s.y += s.s * (1 / 60);
    if (s.y > CANVAS_H) s.y = 0;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ============================================================
//  HUD Y FIN DE PARTIDA
// ============================================================
function updateHud() {
  const remaining = Math.max(MATCH_DURATION - elapsed, 0);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(Math.floor(remaining % 60)).padStart(2, '0');
  hudTimer.textContent = `Tiempo restante: ${mm}:${ss}`;
  hudStatus.textContent = `Vida: ${player.alive ? '❤️' : '💀'}`;
}

function endGame(didWin) {
  gameOver = true;
  win = didWin;
  overlayTitle.textContent = 'GAME OVER';
  overlayTitle.classList.toggle('win', didWin);
  overlaySubtitle.textContent = didWin ? 'YOU WIN' : '';
  overlay.classList.remove('hidden');
}

// ============================================================
//  BUCLE PRINCIPAL
// ============================================================
function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05); // clamp para evitar saltos
  lastTimestamp = timestamp;

  if (!gameOver) {
    update(dt);
  }
  draw();

  if (!gameOver) {
    requestAnimationFrame(loop);
  }
}

// ------- Arranque inicial (pantalla de espera) -------
initGame();
draw();
