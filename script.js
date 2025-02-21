let game;
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#222222',
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

let player, cursors, documents, fbiAgents, traps, tweets;
let score = 0, popularity = 100, gameActive = true;
let fbiSpeed = 80, currentFbiCount = 1, fbiSpawnTimer;
let upPressed = false, downPressed = false, leftPressed = false, rightPressed = false;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        initializeGame();
    });
});

function initializeGame() {
    if(game) {
        game.destroy(true);
        game = null;
    }
    
    score = 0;
    popularity = 100;
    gameActive = true;
    currentFbiCount = 1;
    fbiSpeed = 80;
    upPressed = downPressed = leftPressed = rightPressed = false;
    
    document.getElementById('score').textContent = 0;
    document.getElementById('popularity').textContent = 100;
    document.getElementById('end-screen').style.display = 'none';
    
    game = new Phaser.Game(config);
}

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
    this.sound.play('sirena');
    
    player = this.physics.add.sprite(400, 300, 'milei')
        .setScale(0.2)
        .setCollideWorldBounds(true)
        .setDepth(2);

    documents = this.physics.add.group();
    tweets = this.physics.add.group();
    traps = this.physics.add.group();
    fbiAgents = this.physics.add.group();

    createCollectibles.call(this, documents, 'documento', 10);
    createCollectibles.call(this, tweets, 'tweet', 6);
    createCollectibles.call(this, traps, 'trampa', 2);
    createPatrollingFBI.call(this);

    this.physics.add.overlap(player, documents, collectDocument, null, this);
    this.physics.add.overlap(player, tweets, collectTweet, null, this);
    this.physics.add.overlap(player, traps, triggerTrap, null, this);
    this.physics.add.collider(player, fbiAgents, () => endGameLose.call(this));

    this.time.addEvent({
        delay: 1000,
        callback: () => {
            popularity = Phaser.Math.Clamp(popularity - 3, 0, 100);
            updateHUD();
            if(popularity <= 0) endGameLose.call(this);
        },
        loop: true
    });

    fbiSpawnTimer = this.time.addEvent({
        delay: 25000,
        callback: () => {
            currentFbiCount++;
            createPatrollingFBI.call(this);
            showNotification(`¡REFUERZOS FBI! (${currentFbiCount})`, '#ff0000');
        },
        loop: true
    });

    cursors = this.input.keyboard.createCursorKeys();
    setupTouchControls();
}

function update() {
    if(!gameActive) return;
    
    const speed = 150;
    player.setVelocity(0);
    
    if(cursors.left.isDown || leftPressed) player.setVelocityX(-speed);
    if(cursors.right.isDown || rightPressed) player.setVelocityX(speed);
    if(cursors.up.isDown || upPressed) player.setVelocityY(-speed);
    if(cursors.down.isDown || downPressed) player.setVelocityY(speed);
    
    fbiAgents.getChildren().forEach(agent => {
        this.physics.moveToObject(agent, player, fbiSpeed);
    });
}

function createCollectibles(group, texture, count) {
    for(let i = 0; i < count; i++) {
        group.create(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(100, 500),
            texture
        )
        .setScale(0.15)
        .setData('active', true)
        .setDepth(1);
    }
}

function createPatrollingFBI() {
    for(let i = 0; i < currentFbiCount; i++) {
        const agent = this.physics.add.sprite(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(100, 500),
            'fbi'
        )
        .setScale(0.2)
        .setCollideWorldBounds(true)
        .setDepth(1);
        
        fbiAgents.add(agent);
    }
}

function collectDocument(player, doc) {
    if(!doc.getData('active')) return;
    
    doc.disableBody(true, true);
    score++;
    updateHUD();
    
    if(score >= 10) endGameWin.call(this);
}

function collectTweet(player, tweet) {
    if(!tweet.getData('active')) return;
    
    tweet.disableBody(true, true);
    const effect = Phaser.Math.Between(-25, 35);
    popularity = Phaser.Math.Clamp(popularity + effect, 0, 100);
    
    let message = effect >= 0 
        ? '¡Ratas inmundas de la casta política! +' + effect + '%'
        : 'No estaba interiorizado... ' + effect + '%';
        
    showNotification(message, effect >= 0 ? '#00ff00' : '#ff0000');
    this.sound.play(effect >= 0 ? 'positive' : 'negative');
    updateHUD();
}

function triggerTrap() {
    fbiSpeed += 60;
    popularity = Phaser.Math.Clamp(popularity - 5, 0, 100);
    showNotification('¡TRAMPA ACTIVADA! FBI +VELOC', '#ff0000');
    updateHUD();
    this.cameras.main.shake(500, 0.03);
    player.setTint(0xff0000);
    this.time.delayedCall(500, () => player.clearTint());
}

function endGameWin() {
    gameActive = false;
    showEndScreen(
        '¡FRAUDE ÉPICO!',
        `Milei escapó a Paraguay con $15 millones en Dogecoin.\n\nEn su canal de YouTube, declaró: "Fue un experimento social libertario".\n\nLos inversores quedaron en bancarrota mientras él compra verificado en Twitter.`
    );
}

function endGameLose() {
    gameActive = false;
    showEndScreen(
        '¡CAÍDA DEL MESÍAS!',
        `Extraditado a EE.UU. tras juicio relámpago.\n\nCondena: 30 años en Guantánamo por estafa interestatal.\n\nSus seguidores ahora minan Bitcoin para pagar su fianza fallida.`
    );
    this.sound.play('sirena');
}

function showEndScreen(title, description) {
    document.getElementById('game-container').style.display = 'none';
    const endScreen = document.getElementById('end-screen');
    endScreen.style.display = 'block';
    document.getElementById('end-title').textContent = title;
    document.getElementById('end-description').textContent = description;
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('popularity').textContent = popularity;
    document.getElementById('popularity').classList.toggle('low-popularity', popularity <= 20);
}

function showNotification(text, color) {
    const notification = document.getElementById('game-notification');
    notification.textContent = text;
    notification.style.color = color;
    notification.style.display = 'block';
    setTimeout(() => notification.style.display = 'none', 2500);
}

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
