let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
let player, enemies = [], bullets = [], enemyBullets = [], boss;
let gameActive = false;
let alienDirection = 1;

function startGame(difficulty) {
    // Show the canvas and hide the difficulty selection screen
    document.getElementById("difficultySelection").style.display = "none";
    canvas.style.display = "block";

    // Initialize game based on difficulty
    let speedMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
    initGame(speedMultiplier);
    enemies = generateAliens();
    gameLoop();
    setInterval(alienShoot, 2000 / speedMultiplier);

    // Add event listeners for movement and shooting
    document.addEventListener("keydown", movePlayer);
    document.addEventListener("keyup", stopPlayer);
    document.addEventListener("keydown", shootBullet);
}

function initGame(speedMultiplier) {
    // Reset player, bullets, and enemies
    player = { x: 400, y: 450, width: 40, height: 40, health: 100, speed: 4 * speedMultiplier, dx: 0 };
    bullets = [];
    enemyBullets = [];
    boss = null;
    updateHealthDisplay();
    gameActive = true;
}

function generateAliens() {
    let aliens = [];
    for (let i = 0; i < 5; i++) {
        aliens.push({ x: i * 100 + 50, y: 50, width: 40, height: 40, health: 100 });
    }
    return aliens;
}

function drawAliens() {
    ctx.fillStyle = "green";
    enemies.forEach((alien, index) => {
        if (alien.health > 0) { // Only draw living aliens
            ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
            ctx.fillStyle = "white";
            ctx.fillText(`HP: ${alien.health}`, alien.x, alien.y - 5);
            ctx.fillStyle = "green";
        } else {
            // Remove dead aliens from the array
            enemies.splice(index, 1);
        }
    });

    // Spawn boss if all aliens are defeated
    if (enemies.length === 0 && !boss) {
        spawnBoss();
    }
}

function spawnBoss() {
    boss = { 
        x: canvas.width / 2 - 50, 
        y: 50, 
        width: 100, 
        height: 100, 
        health: 300, 
        speed: 2, 
        moveRange: 300, 
        startX: canvas.width / 2 - 50 
    };
}

function moveBoss() {
    if (!boss) return;

    boss.x += boss.speed;
    if (boss.x > boss.startX + boss.moveRange || boss.x < boss.startX - boss.moveRange) {
        boss.speed *= -1; // Reverse direction
    }
}

function drawBoss() {
    if (!boss) return;

    ctx.fillStyle = "red";
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    ctx.fillStyle = "white";
    ctx.fillText(`BOSS HP: ${boss.health}`, boss.x, boss.y - 5);
}

function bossShoot() {
    if (!boss) return;

    // Boss shoots multiple bullets in a spread pattern
    const bulletCount = 5; // Number of bullets in the spread
    for (let i = 0; i < bulletCount; i++) {
        const angle = (i - Math.floor(bulletCount / 2)) * 0.1; // Spread angle
        enemyBullets.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height,
            width: 5,
            height: 10,
            dx: Math.sin(angle) * 3, // Horizontal velocity
            dy: 3 // Vertical velocity
        });
    }
}

function moveAliens() {
    let edgeReached = false;
    enemies.forEach(alien => {
        alien.x += alienDirection * 2;
        if (alien.x <= 0 || alien.x + alien.width >= canvas.width) {
            edgeReached = true;
        }
    });
    if (edgeReached) {
        alienDirection *= -1;
        enemies.forEach(alien => alien.y += 20); // Move aliens down when edge is reached
    }
}

function updateHealthDisplay() {
    document.getElementById("healthDisplay").innerText = `Player HP: ${player.health}`;
}

function movePlayer(event) {
    if (event.key === "ArrowLeft") player.dx = -player.speed;
    if (event.key === "ArrowRight") player.dx = player.speed;
}

function stopPlayer(event) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") player.dx = 0;
}

function shootBullet(event) {
    if (event.key === " ") {
        bullets.push({ x: player.x + 18, y: player.y, width: 5, height: 10 });
    }
}

function drawBullets() {
    ctx.fillStyle = "yellow";
    bullets.forEach((bullet, index) => {
        bullet.y -= 5;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        if (bullet.y < 0) bullets.splice(index, 1);
    });
}

function drawEnemyBullets() {
    ctx.fillStyle = "red";
    enemyBullets.forEach((bullet, index) => {
        bullet.x += bullet.dx || 0; // Apply horizontal velocity if present
        bullet.y += bullet.dy || 3; // Default vertical velocity
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        if (bullet.y > canvas.height) enemyBullets.splice(index, 1);
    });
}

function alienShoot() {
    enemies.forEach(alien => {
        enemyBullets.push({ x: alien.x + 15, y: alien.y + 40, width: 5, height: 10 });
    });
}

function drawPlayer() {
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = "white";
    ctx.fillText(`HP: ${player.health}`, player.x, player.y - 5);
}

function checkCollisions() {
    // Check collisions between player's bullets and aliens
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((alien, alienIndex) => {
            if (
                bullet.x < alien.x + alien.width &&
                bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height &&
                bullet.y + bullet.height > alien.y
            ) {
                alien.health -= 20; // Reduce alien's health
                bullets.splice(bulletIndex, 1); // Remove bullet
            }
        });

        // Check collisions between player's bullets and boss
        if (boss && 
            bullet.x < boss.x + boss.width &&
            bullet.x + bullet.width > boss.x &&
            bullet.y < boss.y + boss.height &&
            bullet.y + bullet.height > boss.y
        ) {
            boss.health -= 10; // Reduce boss's health
            bullets.splice(bulletIndex, 1); // Remove bullet

            if (boss.health <= 0) {
                endGame(true); // Player wins
            }
        }
    });

    // Check collisions between enemy bullets and player
    enemyBullets.forEach((bullet, index) => {
        if (
            bullet.x > player.x &&
            bullet.x < player.x + player.width &&
            bullet.y > player.y &&
            bullet.y < player.y + player.height
        ) {
            player.health -= 5;
            enemyBullets.splice(index, 1);
            updateHealthDisplay();
            if (player.health <= 0) {
                endGame(false); // Player loses
            }
        }
    });
}

function endGame(won) {
    gameActive = false;

    if (won) {
        alert("You defeated the boss! You win!");
    } else {
        alert("Game Over! You lost!");
    }

    // Return to the choice page after 2 seconds
    setTimeout(() => {
        document.getElementById("difficultySelection").style.display = "block"; // Show choice page
        canvas.style.display = "none"; // Hide canvas
        document.getElementById("gameOverMessage").style.display = "none"; // Hide game-over message
    }, 2000); // 2-second delay before returning to the choice page
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.x += player.dx;
    moveAliens();
    moveBoss();
    drawPlayer();
    drawBullets();
    drawAliens();
    drawBoss();
    drawEnemyBullets();
    checkCollisions();

    // Boss shooting every 2 seconds
    if (boss && Math.random() < 0.01) {
        bossShoot();
    }

    requestAnimationFrame(gameLoop);
}
