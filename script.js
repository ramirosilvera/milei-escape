// Objeto global para la entrada táctil
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
    this.trapHits = 0;
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
    duration: 4000,
    ease: 'Power1',
    onComplete: () => { msg.destroy(); }
  });
}

// ===================
// SCENA DE INICIO MEJORADA
// ===================
class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }
  
  preload() {
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
    // Fondo animado
    this.add.gradient(0, 0, 800, 600, 0x1a1a1a, 0x4a4a4a).setOrigin(0);
    
    // Panel central
    const panel = this.add.rectangle(400, 300, 700, 500, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff);
    
    // Título animado
    const title = this.add.text(400, 100, 'MILEI vs FBI', {
      fontSize: '48px',
      fill: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: title,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Iconos decorativos
    const icons = this.add.container(400, 300);
    const leftIcon = this.add.image(-300, 0, 'documento').setScale(0.2);
    const rightIcon = this.add.image(300, 0, 'fbi').setScale(0.3);
    icons.add([leftIcon, rightIcon]);
    
    // Texto introductorio con estilo
    const introText = this.add.text(400, 220, [
      '¡La cripto-estafa de $LIBRA ha sido descubierta!\n',
      'Recolecta 15 documentos clasificados del FBI\n',
      'para encubrir tu participación antes de que\n',
      'tu apoyo político se desplome por completo.\n\n',
      '▸ Esquiva agentes del FBI\n',
      '▸ Evita trampas tecnológicas\n',
      '▸ Usa tweets a tu favor\n',
      '▸ Mantén tu apoyo por encima de 0'
    ], {
      fontSize: '20px',
      fill: '#FFFFFF',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);
    
    // Botón de inicio con animación
    const startButton = this.add.text(400, 450, 'INICIAR MISIÓN', {
      fontSize: '32px',
      fill: '#00FF00',
      backgroundColor: '#000000',
      padding: { x: 30, y: 15 },
      borderRadius: 10
    }).setOrigin(0.5).setInteractive();
    
    startButton.on('pointerover', () => {
      startButton.setScale(1.1);
      startButton.setBackgroundColor('#005500');
    });
    
    startButton.on('pointerout', () => {
      startButton.setScale(1);
      startButton.setBackgroundColor('#000000');
    });
    
    startButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('GameScene');
    });
  }
}

// ===================
// SCENA DEL JUEGO CON VISOR DE DOCUMENTOS
// ===================
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }
  
  create() {
    this.gameState = new GameState();
    this.musica = this.sound.add('musicaFondo');
    this.musica.play({ loop: true, volume: 0.5 });
    
    // UI mejorada
    this.createUI();
    
    // Elementos del juego
    this.player = this.physics.add.sprite(400, 300, 'milei').setScale(0.2);
    this.player.setCollideWorldBounds(true);
    
    // Grupos de objetos
    this.createGameObjects();
    
    // Eventos de colisión
    this.setupCollisions();
    
    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  createUI() {
    // Panel superior con estadísticas
    const uiPanel = this.add.rectangle(400, 15, 780, 50, 0x000000, 0.5)
      .setOrigin(0.5, 0);
    
    this.supportText = this.add.text(20, 10, 'APOYO: 100%', {
      fontSize: '24px',
      fill: '#00FF00',
      fontStyle: 'bold'
    });
    
    this.fbiText = this.add.text(650, 10, 'ALERTAS FBI: 0', {
      fontSize: '24px',
      fill: '#FF0000',
      fontStyle: 'bold'
    });
    
    // Visor de documentos con cuenta regresiva
    this.documentCounter = this.add.text(400, 10, 'DOCUMENTOS: 15/15', {
      fontSize: '24px',
      fill: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
  }

  createGameObjects() {
    this.documents = this.physics.add.group();
    this.tweets = this.physics.add.group();
    this.traps = this.physics.add.group();
    this.agents = this.physics.add.group();

    this.spawnDocument();
    this.spawnTweet();
    this.spawnTrap();
    this.spawnTrap();

    for (let i = 0; i < 2; i++) {
      const agent = this.physics.add.sprite(
        Phaser.Math.Between(100, 700),
        Phaser.Math.Between(100, 500),
        'fbi'
      ).setScale(0.3);
      agent.ia = new AgentIA(agent);
      this.agents.add(agent);
    }
  }

  setupCollisions() {
    this.physics.add.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.add.overlap(this.player, this.tweets, this.collectTweet, null, this);
    this.physics.add.overlap(this.player, this.traps, this.hitTrap, null, this);
    this.physics.add.overlap(this.player, this.agents, this.onAgentCollision, null, this);
  }

  update() {
    this.handleMovement();
    this.updateAgents();
    this.updateUI();
    this.checkGameState();
  }

  handleMovement() {
    const speed = 200;
    let vx = 0, vy = 0;
    
    if (this.cursors.left.isDown || touchInput.left) vx = -speed;
    if (this.cursors.right.isDown || touchInput.right) vx = speed;
    if (this.cursors.up.isDown || touchInput.up) vy = -speed;
    if (this.cursors.down.isDown || touchInput.down) vy = speed;
    
    this.player.setVelocity(vx, vy);
  }

  updateAgents() {
    this.agents.children.each(agent => agent.ia.update(this.player));
  }

  updateUI() {
    this.supportText.setText(`APOYO: ${this.gameState.apoyo}%`);
    this.fbiText.setText(`ALERTAS FBI: ${this.gameState.alertasFBI}`);
    const remaining = 15 - this.gameState.evidencias.documentos;
    this.documentCounter.setText(`DOCUMENTOS: ${remaining}/15`);
  }

  checkGameState() {
    if (this.gameState.evidencias.documentos >= 15) {
      this.endGame(true);
    } else if (this.gameState.apoyo <= 0) {
      this.endGame(false);
    }
  }

  endGame(win) {
    this.musica.stop();
    this.scene.start('EndScene', { 
      score: this.gameState.evidencias.documentos,
      win: win
    });
  }

  collectDocument(player, document) {
    document.disableBody(true, true);
    this.gameState.evidencias.documentos++;
    this.sound.play('coin');
    this.spawnDocument();
    this.spawnTrap();
  }

  collectTweet(player, tweet) {
    tweet.disableBody(true, true);
    const effect = Phaser.Math.Between(0, 1) ? 10 : -10;
    this.gameState.apoyo = Phaser.Math.Clamp(
      this.gameState.apoyo + effect,
      0, 100
    );
    showTempMessage(this, 
      effect > 0 ? "¡Libertad avanza!" : "¡Error en los datos!",
      effect > 0 ? "#0F0" : "#F00"
    );
    this.spawnTweet();
  }

  hitTrap(player, trap) {
    trap.disableBody(true, true);
    this.gameState.apoyo = Math.max(this.gameState.apoyo - 15, 0);
    this.gameState.trapHits++;
    
    if (this.gameState.trapHits >= 3) {
      this.gameState.alertasFBI++;
      this.gameState.trapHits = 0;
    }
    
    showTempMessage(this, "¡TRAMPA ACTIVADA!", "#FFA500");
    this.time.delayedCall(2000, () => this.spawnTrap());
  }

  onAgentCollision() {
    this.sound.play('sirena');
    this.gameState.apoyo = Math.max(this.gameState.apoyo - 10, 0);
    this.gameState.alertasFBI++;
  }

  spawnDocument() {
    this.documents.create(
      Phaser.Math.Between(50, 750),
      Phaser.Math.Between(50, 550),
      'documento'
    ).setScale(0.3);
  }

  spawnTweet() {
    this.tweets.create(
      Phaser.Math.Between(50, 750),
      Phaser.Math.Between(50, 550),
      'tweet'
    ).setScale(0.3);
  }

  spawnTrap() {
    this.traps.create(
      Phaser.Math.Between(50, 750),
      Phaser.Math.Between(50, 550),
      'trampa'
    ).setScale(0.3);
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
    this.add.gradient(400, 300, 800, 600, 0x1a1a1a, 0x4a4a4a);
    
    const title = this.win ? '¡MISIÓN CUMPLIDA!' : '¡CAPTURADO!';
    const color = this.win ? '#0F0' : '#F00';
    
    this.add.text(400, 200, title, {
      fontSize: '48px',
      fill: color,
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.add.text(400, 300, `Documentos obtenidos: ${this.finalScore}`, {
      fontSize: '32px',
      fill: '#FFF'
    }).setOrigin(0.5);
    
    const restart = this.add.text(400, 400, 'Jugar de nuevo', {
      fontSize: '24px',
      fill: '#FF0',
      backgroundColor: '#000',
      padding: 10
    }).setOrigin(0.5).setInteractive();
    
    restart.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('StartScene');
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [StartScene, GameScene, EndScene]
};

new Phaser.Game(config);
