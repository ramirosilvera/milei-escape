// script.js
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#333333',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

let game = new Phaser.Game(config);
let player, cursors, documents, fbiAgents, traps, tweets;
let score = 0, popularity = 100, gameActive = true;
let fbiSpeed = 100;

function preload() {
    this.load.image('milei', 'img/milei.png');
    this.load.image('documento', 'img/documento.png');
    this.load.image('fbi', 'img/fbi.png');
    this.load.image('trampa', 'img/trampa.png');
    this.load.image('tweet', 'img/tweet.png');
}

function create() {
    // Jugador
    player = this.physics.add.sprite(400, 300, 'milei').setScale(0.15);
    player.setCollideWorldBounds(true);
    
    // Documentos
    documents = this.physics.add.group();
    createCollectibles.call(this, documents, 'documento', 15);
    
    // Tweets
    tweets = this.physics.add.group();
    createCollectibles.call(this, tweets, 'tweet', 10);
    
    // Trampas
    traps = this.physics.add.group();
    createCollectibles.call(this, traps, 'trampa', 8);
    
    // Agentes FBI
    fbiAgents = this.physics.add.group();
    createFBI.call(this, 6);
    
    // Colisiones
    this.physics.add.overlap(player, documents, collectDocument);
    this.physics.add.overlap(player, tweets, collectTweet);
    this.physics.add.overlap(player, traps, triggerTrap);
    this.physics.add.collider(player, fbiAgents, endGameLose);
    
    // Controles
    cursors = this.input.keyboard.createCursorKeys();
    setupTouchControls();
    
    // Temporizador de popularidad
    this.time.addEvent({
        delay: 1000,
        callback: decreasePopularity,
        callbackScope: this,
        loop: true
    });
}

function update() {
    if (!gameActive) return;
    
    // Movimiento del jugador
    let speed = 200;
    player.setVelocity(0);
    
    if (cursors.left.isDown || leftPressed) player.setVelocityX(-speed);
    if (cursors.right.isDown || rightPressed) player.setVelocityX(speed);
    if (cursors.up.isDown || upPressed) player.setVelocityY(-speed);
    if (cursors.down.isDown || downPressed) player.setVelocityY(speed);
    
    // Movimiento FBI
    fbiAgents.getChildren().forEach(agent => {
        this.physics.moveToObject(agent, player, fbiSpeed);
    });
}

function createCollectibles(group, texture, count) {
    for (let i = 0; i < count; i++) {
        let x = Phaser.Math.Between(50, 750);
        let y = Phaser.Math.Between(50, 550);
        group.create(x, y, texture).setScale(0.1).setData('active', true);
    }
}

function createFBI(count) {
    for (let i = 0; i < count; i++) {
        let x = Phaser.Math.Between(50, 750);
        let y = Phaser.Math.Between(50, 550);
        let agent = this.physics.add.sprite(x, y, 'fbi').setScale(0.15);
        agent.setCollideWorldBounds(true);
        fbiAgents.add(agent);
    }
}

function collectDocument(player, doc) {
    if (!doc.getData('active')) return;
    
    doc.disableBody(true, true);
    score++;
    updateHUD();
    
    if (score >= 15) {
        endGameWin();
    }
}

function collectTweet(player, tweet) {
    if (!tweet.getData('active')) return;
    
    tweet.disableBody(true, true);
    let effect = Phaser.Math.Between(-20, 30);
    popularity = Phaser.Math.Clamp(popularity + effect, 0, 100);
    showNotification(`Apoyo ${effect >= 0 ? '+' : ''}${effect}%`, effect >= 0 ? '#00ff00' : '#ff0000');
    updateHUD();
}

function triggerTrap(player, trap) {
    if (!trap.getData('active')) return;
    
    trap.disableBody(true, true);
    fbiSpeed += 50;
    popularity = Phaser.Math.Clamp(popularity - 30, 0, 100);
    showNotification('¡Trampa activada! FBI más rápido', '#ff0000');
    updateHUD();
}

function decreasePopularity() {
    popularity = Phaser.Math.Clamp(popularity - 2, 0, 100);
    updateHUD();
    
    if (popularity <= 0) {
        endGameLose();
    }
}

function endGameWin() {
    gameActive = false;
    showNotification('¡Victoria! Evidencia recolectada', '#00ff00', true);
    player.disableBody(true, true);
}

function endGameLose() {
    gameActive = false;
    showNotification('¡Derrota! Capturado por el FBI', '#ff0000', true);
    player.disableBody(true, true);
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('popularity').textContent = popularity;
}

function showNotification(text, color, persistent = false) {
    const notification = document.getElementById('game-notification');
    notification.textContent = text;
    notification.style.color = color;
    notification.style.display = 'block';
    
    if (!persistent) {
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }
}

// Controles táctiles
let upPressed = false;
let downPressed = false;
let leftPressed = false;
let rightPressed = false;

function setupTouchControls() {
    const controls = ['up', 'down', 'left', 'right'];
    controls.forEach(control => {
        const btn = document.getElementById(control);
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (control === 'up') upPressed = true;
            if (control === 'down') downPressed = true;
            if (control === 'left') leftPressed = true;
            if (control === 'right') rightPressed = true;
        });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (control === 'up') upPressed = false;
            if (control === 'down') downPressed = false;
            if (control === 'left') leftPressed = false;
            if (control === 'right') rightPressed = false;
        });
    });
}
