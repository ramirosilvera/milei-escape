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
        touchInput[btn.id] = true;
      });
      btn.addEventListener('pointerup', () => {
        touchInput[btn.id] = false;
      });
      btn.addEventListener('pointerout', () => {
        touchInput[btn.id] = false;
      });
    });
  }
});

class GameState {
  constructor() {
    this.nivel = 1;
    this.totalDocumentos = 15;
    this.evidencias = {
      documentos: 0,
    };
    this.alertasFBI = 0;
    this.apoyo = 100;
    this.trapHits = 0;
  }
  
  get documentosRestantes() {
    return this.totalDocumentos - this.evidencias.documentos;
  }
}

class AgentIA {
  constructor(sprite) {
    this.sprite = sprite;
    this.states = { PATROL: 0, CHASE: 1, SEARCH: 2 };
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
  const msg = scene.add.dom(400, 50).createFromHTML(`
    <div class="notification-top" style="color: ${color}">
      ${textContent}
    </div>
  `);
  scene.tweens.add({
    targets: msg,
    y: 100,
    alpha: 0,
    duration: 4000,
    ease: 'Power1',
    onComplete: () => msg.destroy()
  });
}

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
    const startContainer = this.add.container(400, 300);
    
    // Texto del título
    const titleText = this.add.text(0, -150, 'Milei vs. El FBI\nLa estafa de Libra', {
      fontSize: '32px',
      fill: '#000',
      align: 'center',
      fontStyle: 'bold',
      lineSpacing: 15
    }).setOrigin(0.5);
    
    // Texto de introducción actualizado
    const introText = this.add.text(0, -50, 
      '40 inversores denunciaron a Milei ante el FBI\npor estafa con la criptomoneda Libra.\n\n¡Ayúdalo a esconder 15 documentos clave\nantes que su popularidad caiga a 0!\n\nEvita a los agentes del FBI y\nmantén el apoyo popular.',
      {
        fontSize: '18px',
        fill: '#444',
        align: 'center',
        lineSpacing: 12
      }
    ).setOrigin(0.5);
    
    // Botón de inicio
    const startButton = this.add.text(0, 100, 'Iniciar Juego', {
      fontSize: '24px',
      fill: '#0f0',
      backgroundColor: '#000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    startButton.on('pointerdown', () => {
      touchInput = { up: false, down: false, left: false, right: false };
      this.sound.play('click');
      this.scene.start('GameScene');
    });
    
    startContainer.add([titleText, introText, startButton]);
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.isInvulnerable = false;
  }
  
  create() {
    this.gameState = new GameState();
    this.musica = this.sound.add('musicaFondo').play({ loop: true, volume: 0.5 });
    
    // Contador de documentos
    this.documentCounter = this.add.dom(400, 30).createFromHTML(`
      <div class="document-counter">
        DOCUMENTOS: ${this.gameState.documentosRestantes}/15
      </div>
    `);
    
    // Temporizador de popularidad
    this.apoyoTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameState.apoyo = Math.max(this.gameState.apoyo - 1, 0);
      },
      loop: true
    });
    
    // Creación del jugador
    this.player = this.physics.add.sprite(400, 300, 'milei').setScale(0.3).setCollideWorldBounds(true);
    
    // UI
    this.supportText = this.add.text(10, 10, 'APOYO: ', {
      fontSize: '28px',
      fill: '#000',
      fontStyle: 'bold',
      stroke: '#fff',
      strokeThickness: 3
    });
    
    this.fbiText = this.add.text(650, 10, 'ALERTAS: ', {
      fontSize: '28px',
      fill: '#000',
      fontStyle: 'bold',
      stroke: '#fff',
      strokeThickness: 3
    });
    
    // Grupos de objetos
    this.documents = this.physics.add.group();
    this.tweets = this.physics.add.group();
    this.traps = this.physics.add.group();
    this.agents = this.physics.add.group();
    
    // Spawn inicial
    this.spawnDocument();
    this.spawnTweet();
    this.spawnTrap();
    this.spawnTrap();
    
    // Creación de agentes
    for (let i = 0; i < 2; i++) {
      let agentSprite = this.physics.add.sprite(
        Phaser.Math.Between(100, 700),
        Phaser.Math.Between(100, 500),
        'fbi'
      ).setScale(0.3).setCollideWorldBounds(true).setBounce(0.5);
      agentSprite.ia = new AgentIA(agentSprite);
      this.agents.add(agentSprite);
    }
    
    // Colisiones
    this.physics.add.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.add.overlap(this.player, this.tweets, this.collectTweet, null, this);
    this.physics.add.overlap(this.player, this.traps, this.hitTrap, null, this);
    this.physics.add.overlap(this.player, this.agents, this.onAgentCollision, null, this);
    
    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  
  update() {
    const speed = 200;
    let vx = 0, vy = 0;
    
    if (this.cursors.left.isDown || touchInput.left) vx = -speed;
    if (this.cursors.right.isDown || touchInput.right) vx = speed;
    if (this.cursors.up.isDown || touchInput.up) vy = -speed;
    if (this.cursors.down.isDown || touchInput.down) vy = speed;
    
    this.player.setVelocity(vx, vy);
    
    // Actualizar agentes
    this.agents.getChildren().forEach(agent => agent.ia.update(this.player));
    
    // Actualizar UI
    this.supportText.setText(`APOYO: ${Math.max(this.gameState.apoyo, 0)}`);
    this.fbiText.setText(`ALERTAS: ${this.gameState.alertasFBI}`);
    this.documentCounter.node.innerHTML = 
      `DOCUMENTOS: ${this.gameState.documentosRestantes}/15`;
    
    // Condiciones de fin de juego
    if (this.gameState.evidencias.documentos >= 15) {
      this.endGame(true);
    } else if (this.gameState.apoyo <= 0) {
      this.endGame(false);
    }
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
  
  collectDocument(player, document) {
    document.disableBody(true, true);
    this.gameState.evidencias.documentos++;
    this.sound.play('coin');
    
    // Actualizar contador
    this.documentCounter.node.innerHTML = 
      `DOCUMENTOS: ${this.gameState.documentosRestantes}/15`;
    
    // Feedback visual
    this.tweens.add({
      targets: this.documentCounter,
      scale: 1.2,
      duration: 200,
      yoyo: true
    });
    
    this.spawnDocument();
    this.spawnTrap();
  }
  
  collectTweet(player, tweet) {
    tweet.disableBody(true, true);
    this.sound.play('notification');
    const isPositive = Phaser.Math.Between(0, 1) === 0;
    this.gameState.apoyo += isPositive ? 10 : -10;
    showTempMessage(this, 
      isPositive ? "Ratas inmundas de la casta política" : "No estaba interiorizado...",
      isPositive ? "#0f0" : "#f00"
    );
    this.spawnTweet();
  }
  
  hitTrap(player, trap) {
    trap.disableBody(true, true);
    this.gameState.apoyo = Math.max(this.gameState.apoyo - 15, 0);
    showTempMessage(this, "¡Trampa activada!", "#f80");
    
    this.gameState.trapHits++;
    if (this.gameState.trapHits >= 3) {
      this.gameState.alertasFBI++;
      this.gameState.trapHits = 0;
    }
    this.time.delayedCall(2000, () => this.spawnTrap());
  }
  
  onAgentCollision(player, agent) {
    if (this.isInvulnerable) return;
    this.isInvulnerable = true;
    
    this.sound.play('sirena');
    this.gameState.apoyo = Math.max(this.gameState.apoyo - 10, 0);
    this.gameState.alertasFBI++;
    
    this.time.delayedCall(1000, () => {
      this.isInvulnerable = false;
    });
  }
  
  endGame(win) {
    this.musica.stop();
    this.scene.start('EndScene', { 
      score: this.gameState.evidencias.documentos,
      win: win
    });
  }
}

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
    }).setOrigin(0.5);
    
    const scoreText = this.add.text(0, 0, `Documentos recolectados: ${this.finalScore}`, {
      fontSize: '24px',
      fill: '#000',
      align: 'center'
    }).setOrigin(0.5);
    
    const restartButton = this.add.text(0, 80, 'Reiniciar Juego', {
      fontSize: '24px',
      fill: '#0f0',
      backgroundColor: '#000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    restartButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('StartScene');
    });
    
    endContainer.add([endText, scoreText, restartButton]);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#fff',
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
  scene: [StartScene, GameScene, EndScene],
  input: {
    activePointers: 3,
    touch: { capture: false }
  }
};

new Phaser.Game(config);
