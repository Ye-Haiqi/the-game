// JavaScript
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOver");
const winScreen = document.getElementById("winScreen");
let gameRunning = false;
let keys = {};
let bullets = [];
let bossBullets = [];
let floorY = 340;

// Track whether a bullet has been fired for each player
let player1Fired = false; // Tracks if Player 1 has fired a bullet
let player2Fired = false; // Tracks if Player 2 has fired a bullet

// Respawn timers (in frames, 60 frames ≈ 1 second)
let player1RespawnTimer = 0; // Timer for Player 1 respawn
let player2RespawnTimer = 0; // Timer for Player 2 respawn

const gravity = 0.5;

function createPlayer(x, color) {
    return { x: x, y: floorY, width: 40, height: 60, color: color, speed: 4, velocityY: 0, grounded: true, alive: true, health: 100 };
}

let player1 = createPlayer(100, "blue");
let player2 = createPlayer(200, "green");

// Boss properties
let boss = { 
    x: 600, 
    y: floorY, 
    width: 80, 
    height: 120, 
    color: "red", 
    speed: 1, 
    moveRange: 50, 
    startX: 600, 
    health: 200,
    firingInterval: 0, // Tracks the firing interval for the mini-gun
    burstCount: 0, // Tracks the number of bullets in the current burst
    burstLimit: 5, // Number of bullets per burst
    burstCooldown: 0 // Cooldown between bursts
};

function startGame() {
    gameRunning = true;
    player1 = createPlayer(100, "blue");
    player2 = createPlayer(200, "green");
    boss = { 
        x: 600, 
        y: floorY, 
        width: 80, 
        height: 120, 
        color: "red", 
        speed: 1, 
        moveRange: 50, 
        startX: 600, 
        health: 200,
        firingInterval: 0,
        burstCount: 0,
        burstLimit: 5,
        burstCooldown: 0
    };
    bullets = [];
    bossBullets = [];
    player1RespawnTimer = 0;
    player2RespawnTimer = 0;
    updateHealthBars();
    menu.classList.add("hidden"); // Hide main menu
    gameOverScreen.classList.add("hidden"); // Hide game-over screen
    winScreen.classList.add("hidden"); // Hide win screen
    updateGame(); // Start the game loop
}

function restartGame() {
    startGame(); // Restart the game
}

function updateHealthBars() {
    player1.health = Math.max(0, Math.min(100, player1.health));
    player2.health = Math.max(0, Math.min(100, player2.health));
    boss.health = Math.max(0, Math.min(200, boss.health));

    document.getElementById("player1Health").style.width = player1.health + "%";
    document.getElementById("player2Health").style.width = player2.health + "%";
    document.getElementById("bossHealth").style.width = (boss.health / 2) + "%";

    // Check if both players are dead
    if (player1.health <= 0 && player2.health <= 0 && player1RespawnTimer === 0 && player2RespawnTimer === 0) {
        endGame(false); // Game Over (Players lose)
    }

    // Check if the boss is defeated
    if (boss.health <= 0) {
        endGame(true); // Players win
    }
}

function endGame(won) {
    gameRunning = false;

    if (won) {
        // Show "You Win" screen
        winScreen.classList.remove("hidden");
    } else {
        // Show "Game Over" screen
        gameOverScreen.classList.remove("hidden");
    }

    // Return to the main menu after 2 seconds
    setTimeout(() => {
        menu.classList.remove("hidden"); // Show main menu
        gameOverScreen.classList.add("hidden"); // Hide game-over screen
        winScreen.classList.add("hidden"); // Hide win screen
    }, 2000); // 2-second delay before returning to the main menu
}

function handleMovement() {
    if (player1.alive && keys["ArrowLeft"] && player1.x > 0) player1.x -= player1.speed;
    if (player1.alive && keys["ArrowRight"] && player1.x < canvas.width - player1.width) player1.x += player1.speed;
    if (player1.alive && keys["ArrowUp"] && player1.grounded) { player1.velocityY = -10; player1.grounded = false; }

    if (player2.alive && keys["a"] && player2.x > 0) player2.x -= player2.speed;
    if (player2.alive && keys["d"] && player2.x < canvas.width - player2.width) player2.x += player2.speed;
    if (player2.alive && keys["w"] && player2.grounded) { player2.velocityY = -10; player2.grounded = false; }
}

function shootBullets(player, firedRef) {
    if (!firedRef && player.alive) { // Only fire if no bullet has been fired yet and the player is alive
        bullets.push({ x: player.x + player.width / 2, y: player.y + player.height / 2, speed: 10 });
        firedRef = true; // Mark that a bullet has been fired
    }
    return firedRef;
}

function moveBullets() {
    bullets = bullets.filter(bullet => bullet.x < canvas.width);
    bullets.forEach(bullet => bullet.x += bullet.speed);

    bossBullets = bossBullets.filter(bullet => bullet.x > 0);
    bossBullets.forEach(bullet => bullet.x += bullet.speed);
}

function applyGravity(player) {
    if (player.alive) {
        player.y += player.velocityY;
        player.velocityY += gravity;
        if (player.y >= floorY) { player.y = floorY; player.grounded = true; }
    }
}

function moveBoss() {
    boss.x += boss.speed;
    if (boss.x > boss.startX + boss.moveRange || boss.x < boss.startX - boss.moveRange) {
        boss.speed *= -1;
    }
}

function shootBossMiniGun() {
    if (boss.burstCooldown <= 0) {
        if (boss.firingInterval <= 0 && boss.burstCount < boss.burstLimit) {
            // Fire a bullet
            const bulletOffset = Math.random() * 20 - 10; // Random offset for spread effect
            bossBullets.push({ x: boss.x, y: boss.y + boss.height / 2 + bulletOffset, speed: -7 });
            boss.firingInterval = 5; // Reset firing interval (in frames)
            boss.burstCount++;
        } else {
            boss.firingInterval--;
        }

        if (boss.burstCount >= boss.burstLimit) {
            boss.burstCooldown = 60; // Cooldown between bursts (1 second)
            boss.burstCount = 0;
        }
    } else {
        boss.burstCooldown--;
    }
}

function checkCollisions() {
    // Player bullets hitting boss
    bullets = bullets.filter(bullet => {
        if (bullet.x < boss.x + boss.width && bullet.x + 5 > boss.x &&
            bullet.y < boss.y + boss.height && bullet.y + 5 > boss.y) {
            boss.health -= 2; // Sniper bullets deal 2 damage
            return false; // Remove bullet
        }
        return true;
    });

    // Boss bullets hitting players
    bossBullets = bossBullets.filter(bullet => {
        let hitPlayer1 = false, hitPlayer2 = false;

        if (player1.alive &&
            bullet.x < player1.x + player1.width && bullet.x + 5 > player1.x &&
            bullet.y < player1.y + player1.height && bullet.y + 5 > player1.y) {
            player1.health -= 10;
            hitPlayer1 = true;
        }

        if (player2.alive &&
            bullet.x < player2.x + player2.width && bullet.x + 5 > player2.x &&
            bullet.y < player2.y + player2.height && bullet.y + 5 > player2.y) {
            player2.health -= 10;
            hitPlayer2 = true;
        }

        // Handle player death and respawn timer
        if (player1.health <= 0 && player1RespawnTimer === 0) {
            player1.alive = false;
            player1RespawnTimer = 300; // 5 seconds (300 frames)
        }

        if (player2.health <= 0 && player2RespawnTimer === 0) {
            player2.alive = false;
            player2RespawnTimer = 300; // 5 seconds (300 frames)
        }

        return !(hitPlayer1 || hitPlayer2); // Remove bullet if it hits a player
    });
}

function drawCharacter(character) {
    ctx.fillStyle = character.color;
    ctx.fillRect(character.x, character.y, character.width, character.height);
}

function drawBullets() {
    ctx.fillStyle = "yellow";
    bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, 3, 3)); // Smaller sniper bullets
    ctx.fillStyle = "orange";
    bossBullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, 5, 5));
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    ctx.font = "24px Arial";
    ctx.fillText("Returning to Main Menu...", canvas.width / 2, canvas.height / 2 + 50);
}

function drawWinScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2);

    ctx.font = "24px Arial";
    ctx.fillText("Returning to Main Menu...", canvas.width / 2, canvas.height / 2 + 50);
}

function updateGame() {
    if (!gameRunning) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update respawn timers
    if (player1RespawnTimer > 0) {
        player1RespawnTimer--;
        if (player1RespawnTimer === 0) {
            player1 = createPlayer(100, "blue"); // Respawn Player 1
        }
    }

    if (player2RespawnTimer > 0) {
        player2RespawnTimer--;
        if (player2RespawnTimer === 0) {
            player2 = createPlayer(200, "green"); // Respawn Player 2
        }
    }

    handleMovement();

    // Shoot bullets only on key press
    if (keys[" "] && !player1Fired) player1Fired = shootBullets(player1, player1Fired);
    if (keys["s"] && !player2Fired) player2Fired = shootBullets(player2, player2Fired);

    moveBoss();
    applyGravity(player1);
    applyGravity(player2);
    moveBullets();
    shootBossMiniGun(); // Boss shoots mini-gun bullets
    checkCollisions();
    updateHealthBars();
    drawCharacter(player1);
    drawCharacter(player2);
    drawCharacter(boss); // Draw the boss
    drawBullets();
    requestAnimationFrame(updateGame);
}

window.addEventListener("keydown", (e) => {
    keys[e.key] = true;

    // Restart game when 'R' is pressed
    if (e.key === "r" && !gameRunning) {
        startGame();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key] = false;

    // Reset fired state when the key is released
    if (e.key === " ") player1Fired = false;
    if (e.key === "s") player2Fired = false;
});
