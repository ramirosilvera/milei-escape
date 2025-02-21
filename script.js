let game;
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
            debug: false,
            gravity: { y: 0 }
        }
    }
};

// Variables globales
let player, cursors, documents, fbiAgents, traps, tweets;
let score = 0, popularity = 100, gameActive = true;
let fbiSpeed = 100, currentFbiCount = 1, fbiSpawnTimer;

// Inicialización del juego
function initializeGame() {
    if(game) game.destroy(true);
    game = new Phaser.Game(config);
    
    // Resetear variables
    score = 0;
    popularity = 100;
    gameActive = true;
    currentFbiCount = 1;
    fbiSpeed = 100;
    document.getElementById('score').textContent = 0;
    document.getElementById('popularity').textContent = 100;
    document.getElementById('restart-btn').style.display = 'none';
    document.getElementById('game-notification').style.display = 'none';
}

// Event listeners
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    initializeGame();
});

document.getElementById('restart-btn').addEventListener('click', initializeGame);

function preload() {
    this.load.image('milei', 'img/milei.png');
    this.load.image('documento', 'img/documento.png');
    this.load.image('fbi', 'img/fbi.png');
    this.load.image('trampa', 'img/trampa.png');
    this.load.image('tweet', 'img/tweet.png');
    this.load.audio('sirena', 'sounds/sirena.wav');
    this.load.audio('positive', 'sounds/positive.wav');
    this.load.audio('negative', 'sounds/negative.wav');
}

function create() {
    // Configuración inicial
    this.sound.play('sirena');
    player = this.physics.add.sprite(400, 300, 'milei').setScale(0.15).setCollideWorldBounds(true);
    
    // Grupos de objetos
    documents = this.physics.add.group();
    tweets = this.physics.add.group();
    traps = this.physics.add.group();
    fbiAgents = this.physics.add.group();

    // Crear elementos del juego
    createCollectibles.call(this, documents, 'documento', 15);
    createCollectibles.call(this, tweets, 'tweet', 10);
    createCollectibles.call(this, traps, 'trampa', 8);
    createPatrollingFBI.call(this);

    // Sistema de colisiones
    this.physics.add.overlap(player, documents, collectDocument, null, this);
    this.physics.add.overlap(player, tweets, collectTweet, null, this);
    this.physics.add.overlap(player, traps, triggerTrap, null, this);
    this.physics.add.collider(player, fbiAgents, endGameLose, null, this);

    // Temporizadores
    this.time.addEvent({
        delay: 1000,
        callback: () => {
            popularity = Phaser.Math.Clamp(popularity - 2, 0, 100);
            updateHUD();
            if(popularity <= 0) endGameLose();
        },
        loop: true
    });

    fbiSpawnTimer = this.time.addEvent({
        delay: 30000,
        callback: () => {
            currentFbiCount++;
            createPatrollingFBI.call(this);
            showNotification(`¡Refuerzos FBI! (${currentFbiCount})`, '#ff0000');
        },
        loop: true
    });

    // Controles
    cursors = this.input.keyboard.createCursorKeys();
    setupTouchControls();
}

function update() {
    if(!gameActive) return;
    
    // Movimiento del jugador
    const speed = 200;
    player.setVelocity(0);
    
    if(cursors.left.isDown || leftPressed) player.setVelocityX(-speed);
    if(cursors.right.isDown || rightPressed) player.setVelocityX(speed);
    if(cursors.up.isDown || upPressed) player.setVelocityY(-speed);
    if(cursors.down.isDown || downPressed) player.setVelocityY(speed);
    
    // Comportamiento del FBI
    fbiAgents.getChildren().forEach(agent => {
        if(Phaser.Math.Between(0, 1) {
            this.physics.moveToObject(agent, player, fbiSpeed);
        } else {
            agent.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
        }
    });
}

// Funciones auxiliares
function createCollectibles(group, texture, count) {
    for(let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(50, 750);
        const y = Phaser.Math.Between(50, 550);
        group.create(x, y, texture)
            .setScale(0.1)
            .setData('active', true)
            .setDepth(1);
    }
}

function createPatrollingFBI() {
    for(let i = 0; i < currentFbiCount; i++) {
        const agent = this.physics.add.sprite(
            Phaser.Math.Between(50, 750),
            Phaser.Math.Between(50, 550),
            'fbi'
        ).setScale(0.15).setCollideWorldBounds(true);
        
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                if(gameActive) agent.setVelocity(
                    Phaser.Math.Between(-100, 100),
                    Phaser.Math.Between(-100, 100)
                );
            },
            loop: true
        });
        
        fbiAgents.add(agent);
    }
}

function collectDocument(player, doc) {
    if(!doc.getData('active')) return;
    
    doc.disableBody(true, true);
    score++;
    updateHUD();
    
    if(score >= 15) endGameWin();
}

function collectTweet(player, tweet) {
    if(!tweet.getData('active')) return;
    
    tweet.disableBody(true, true);
    const effect = Phaser.Math.Between(-20, 30);
    popularity = Phaser.Math.Clamp(popularity + effect, 0, 100);
    showNotification(`Apoyo ${effect >= 0 ? '+' : ''}${effect}%`, effect >= 0 ? '#00ff00' : '#ff0000');
    updateHUD();
    this.sound.play(effect >= 0 ? 'positive' : 'negative');
}

function triggerTrap() {
    fbiSpeed += 50;
    popularity = Phaser.Math.Clamp(popularity - 30, 0, 100);
    showNotification('¡Trampa activada!', '#ff0000');
    updateHUD();
    this.cameras.main.shake(300, 0.02);
    player.setTint(0xff0000);
    this.time.delayedCall(500, () => player.clearTint());
}

function endGameWin() {
    gameActive = false;
    showNotification('¡Evidencia destruida!', '#00ff00', true);
    document.getElementById('restart-btn').style.display = 'block';
    player.disableBody(true, true);
}

function endGameLose() {
    gameActive = false;
    showNotification('¡Capturado por el FBI!', '#ff0000', true);
    document.getElementById('restart-btn').style.display = 'block';
    this.sound.play('sirena');
    player.disableBody(true, true);
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('popularity').textContent = popularity;
    document.getElementById('popularity').classList.toggle('low-popularity', popularity <= 20);
}

function showNotification(text, color, persistent = false) {
    const notification = document.getElementById('game-notification');
    notification.textContent = text;
    notification.style.color = color;
    notification.style.display = 'block';
    
    if(!persistent) {
        setTimeout(() => notification.style.display = 'none', 2000);
    }
}

// Controles táctiles
let upPressed = false, downPressed = false, leftPressed = false, rightPressed = false;

function setupTouchControls() {
    const controls = ['up', 'down', 'left', 'right'];
    controls.forEach(control => {
        const btn = document.getElementById(control);
        btn.ontouchstart = (e) => {
            e.preventDefault();
            if(control === 'up') upPressed = true;
            if(control === 'down') downPressed = true;
            if(control === 'left') leftPressed = true;
            if(control === 'right') rightPressed = true;
        };
        btn.ontouchend = (e) => {
            e.preventDefault();
            if(control === 'up') upPressed = false;
            if(control === 'down') downPressed = false;
            if(control === 'left') leftPressed = false;
            if(control === 'right') rightPressed = false;
        };
    });
}
