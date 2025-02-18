// Objeto global para entrada táctil
let touchInput = {
  up: false,
  down: false,
  left: false,
  right: false
};

document.addEventListener('DOMContentLoaded', function() {
  const controls = document.getElementById('controls');
  if (controls) {
    const btnUp = document.getElementById('up');
    const btnDown = document.getElementById('down');
    const btnLeft = document.getElementById('left');
    const btnRight = document.getElementById('right');

    [btnUp, btnDown, btnLeft, btnRight].forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        if (btn.id === 'up') touchInput.up = true;
        if (btn.id === 'down') touchInput.down = true;
        if (btn.id === 'left') touchInput.left = true;
        if (btn.id === 'right') touchInput.right = true;
      });
      btn.addEventListener('pointerup', () => {
        if (btn.id === 'up') touchInput.up = false;
        if (btn.id === 'down') touchInput.down = false;
        if (btn.id === 'left') touchInput.left = false;
        if (btn.id === 'right') touchInput.right = false;
      });
      btn.addEventListener('pointerout', () => {
        if (btn.id === 'up') touchInput.up = false;
        if (btn.id === 'down') touchInput.down = false;
        if (btn.id === 'left') touchInput.left = false;
        if (btn.id === 'right') touchInput.right = false;
      });
    });
  }
});

// Estado global del juego
class GameState {
  constructor() {
    this.nivel = 1;
    this.evidencias = {
      documentos: 0,
      codigos: 0,
      grabaciones: 0
    };
    this.alertasFBI = 0;
    this.apoyo = 100;
    this.trampasActivas = [];
  }
}

// IA básica para agentes del FBI (sprite reducido)
class AgentIA {
  constructor(sprite) {
    this.sprite = sprite;
    this.states = {
      PATROL: 0,
      CHASE: 1,
      SEARCH: 2
    };
    this.currentState = this.states.PATROL;
  }
  
  update(target) {
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, target.x, target.y
    );
    
    if (distance < 150) {
      this.currentState = this.states.CHASE;
    } else {
      this.currentState = this.states.PATROL;
    }
    
    if (this.currentState === this.states.CHASE) {
      this.sprite.scene.physics.moveToObject(this.sprite, target, 100);
    } else if (this.currentState === this.states.PATROL) {
      if (!this.sprite.patrolTimer || this.sprite.patrolTimer < this.sprite.scene.time.now) {
        const randomAngle = Phaser.Math.Between(0, 360);
        const velocityX = Math.cos(Phaser.Math.DegToRad(randomAngle)) * 50;
        const velocityY = Math.sin(Phaser.Math.DegToRad(randomAngle)) * 50;
        this.sprite.setVelocity(velocityX, velocityY);
        this.sprite.patrolTimer = this.sprite.scene.time.now + 2000;
      }
    }
  }
}

// Función para mostrar mensajes temporales (por ejemplo, de tweets)
function showTempMessage(scene, textContent, color = '#fff') {
  const msg = scene.add.text(400, 550, textContent, {
    fontSize: '20px',
    fill: color,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: { x: 10, y: 5 }
  });
  msg.setOrigin(0.5);
  scene.tweens.add({
    targets: msg,
    alpha: 0,
    duration: 4000, // Duración aumentada a 4000 ms
    ease: 'Power1',
    onComplete: () => { msg.destroy(); }
  });
}

// ===================
// SCENA DE INICIO
// ===================
class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }
  
  preload() {
    // Carga de assets
    this.load.image('milei', 'img/milei.png');
    this.load.image('documento', 'img/documento.png');
    this.load.image('fbi', 'img/fbi.png');
    this.load.image('moneda', 'img/moneda.png');
    this.load.image('trampa', 'img/trampa.png');
    this.load.image('tweet', 'img/tweet.png');
    
    this.load.audio('click', 'sounds/click.wav');
    this.load.audio('coin', 'sounds/coin.wav');
    this.load.audio('musicaFondo', 'sounds/musica-fondo.wav');
    this.load.audio('notification', 'sounds/notification.wav');
    this.load.audio('sirena', 'sounds/sirena.wav');
  }
  
  create() {
    // No se dibuja fondo desde Phaser (se usa CSS)
    const startContainer = this.add.container(400, 300);
    
    const titleText = this.add.text(0, -100, 'LIBRA Escape - La Conspiración KIP', {
      fontSize: '28px',
      fill: '#000',
      align: 'center'
    });
    titleText.setOrigin(0.5);
    
    const startButton = this.add.text(0, 0, 'Iniciar Juego', {
      fontSize: '24px',
      fill: '#0f0',
      backgroundColor: '#000',
      padding: { x: 20, y: 10 }
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });
    startButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('GameScene');
    });
    
    startContainer.add([titleText, startButton]);
  }
}

// ===================
// SCENA DEL JUEGO
// ===================
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }
  
  create() {
    this.gameState = new GameState();
    
    // No se agrega fondo en Phaser; el fondo es vía CSS
    this.musica = this.sound.add('musicaFondo');
    this.musica.play({ loop: true, volume: 0.5 });
    
    this.gameContainer = this.add.container(0, 0);
    
    // Jugador: Milei (escala 0.6)
    this.player = this.physics.add.sprite(400, 300, 'milei').setScale(0.6);
    this.player.setCollideWorldBounds(true);
    this.gameContainer.add(this.player);
    
    // UI: Visor de Apoyo y alertas FBI
    this.supportText = this.add.text(10, 10, 'Apoyo: ' + this.gameState.apoyo, {
      fontSize: '18px',
      fill: '#000'
    });
    this.fbiText = this.add.text(650, 10, 'FBI: ' + this.gameState.alertasFBI, {
      fontSize: '18px',
      fill: '#000'
    });
    
    // Grupo de documentos (coleccionable, escala 0.5)
    this.documents = this.physics.add.group();
    this.spawnDocument();
    
    // Grupo de tweets (escala 0.5)
    this.tweets = this.physics.add.group();
    this.spawnTweet();
    
    // Grupo de trampas (escala 0.5)
    this.traps = this.physics.add.group();
    this.spawnTrap();
    this.spawnTrap();
    
    // Grupo de agentes del FBI (2 agentes, escala 0.3)
    this.agents = this.physics.add.group();
    for (let i = 0; i < 2; i++) {
      let x = Phaser.Math.Between(100, 700);
      let y = Phaser.Math.Between(100, 500);
      let agentSprite = this.physics.add.sprite(x, y, 'fbi').setScale(0.3);
      agentSprite.ia = new AgentIA(agentSprite);
      this.agents.add(agentSprite);
    }
    
    // Colisiones e interacciones
    this.physics.add.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.add.overlap(this.player, this.tweets, this.collectTweet, null, this);
    this.physics.add.overlap(this.player, this.traps, this.hitTrap, null, this);
    this.physics.add.overlap(this.player, this.agents, this.onAgentCollision, null, this);
    
    // Controles por teclado
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  
  update() {
    const speed = 200;
    let vx = 0, vy = 0;
    
    if (this.cursors.left.isDown) {
      vx = -speed;
    } else if (this.cursors.right.isDown) {
      vx = speed;
    }
    if (this.cursors.up.isDown) {
      vy = -speed;
    } else if (this.cursors.down.isDown) {
      vy = speed;
    }
    
    if (touchInput.left) {
      vx = -speed;
    } else if (touchInput.right) {
      vx = speed;
    }
    if (touchInput.up) {
      vy = -speed;
    } else if (touchInput.down) {
      vy = speed;
    }
    
    this.player.setVelocity(vx, vy);
    
    this.agents.children.iterate((agent) => {
      if (agent.ia) {
        agent.ia.update(this.player);
      }
    });
    
    this.supportText.setText('Apoyo: ' + this.gameState.apoyo);
    this.fbiText.setText('FBI: ' + this.gameState.alertasFBI);
    
    // Objetivo: 15 documentos recolectados antes de agotar el apoyo
    if (this.gameState.evidencias.documentos >= 15) {
      this.musica.stop();
      this.scene.start('EndScene', { score: this.gameState.evidencias.documentos, win: true });
    } else if (this.gameState.apoyo <= 0) {
      this.musica.stop();
      this.scene.start('EndScene', { score: this.gameState.evidencias.documentos, win: false });
    }
  }
  
  spawnDocument() {
    const x = Phaser.Math.Between(50, 750);
    const y = Phaser.Math.Between(50, 550);
    this.documents.create(x, y, 'documento').setScale(0.5);
  }
  
  spawnTweet() {
    const x = Phaser.Math.Between(50, 750);
    const y = Phaser.Math.Between(50, 550);
    this.tweets.create(x, y, 'tweet').setScale(0.5);
  }
  
  spawnTrap() {
    const x = Phaser.Math.Between(50, 750);
    const y = Phaser.Math.Between(50, 550);
    this.traps.create(x, y, 'trampa').setScale(0.5);
  }
  
  collectDocument(player, document) {
    document.disableBody(true, true);
    this.gameState.evidencias.documentos += 1;
    this.sound.play('coin');
    // Re-spawnea un documento y una trampa cada vez que se recoge uno
    this.spawnDocument();
    this.spawnTrap();
  }
  
  collectTweet(player, tweet) {
    tweet.disableBody(true, true);
    this.sound.play('notification');
    const isPositive = Phaser.Math.Between(0, 1) === 0;
    if (isPositive) {
      this.gameState.apoyo += 10;
      showTempMessage(this, "Ratas inmundas de la casta política", "#0f0");
    } else {
      this.gameState.apoyo = Math.max(this.gameState.apoyo - 10, 0);
      showTempMessage(this, "No estaba interiorizado de los pormenores del proyecto", "#f00");
    }
    this.spawnTweet();
  }
  
  hitTrap(player, trap) {
    trap.disableBody(true, true);
    this.gameState.apoyo = Math.max(this.gameState.apoyo - 5, 0);
    showTempMessage(this, "¡Trampa activada!", "#f80");
    this.time.delayedCall(2000, () => { this.spawnTrap(); });
  }
  
  onAgentCollision(player, agent) {
    this.sound.play('sirena');
    this.gameState.apoyo = Math.max(this.gameState.apoyo - 10, 0);
    this.gameState.alertasFBI += 1;
  }
}

// ===================
// SCENA DE FIN
// ===================
class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }
  
  init(data) {
    this.finalScore = data.score || 0;
    this.win = data.win || false;
  }
  
  create() {
    const endContainer = this.add.container(400, 300);
    
    const title = this.win ? "¡Ganaste!" : "Juego Terminado";
    const endText = this.add.text(0, -80, title, {
      fontSize: '32px',
      fill: '#000',
      align: 'center'
    });
    endText.setOrigin(0.5);
    
    const scoreText = this.add.text(0, 0, `Documentos recolectados: ${this.finalScore}`, {
      fontSize: '24px',
      fill: '#000',
      align: 'center'
    });
    scoreText.setOrigin(0.5);
    
    const restartButton = this.add.text(0, 80, 'Reiniciar Juego', {
      fontSize: '24px',
      fill: '#0f0',
      backgroundColor: '#000',
      padding: { x: 20, y: 10 }
    });
    restartButton.setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('StartScene');
    });
    
    endContainer.add([endText, scoreText, restartButton]);
  }
}

// ===================
// CONFIGURACIÓN DE PHASER
// ===================
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#fff', // Canvas blanco
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [StartScene, GameScene, EndScene]
};

const game = new Phaser.Game(config);
