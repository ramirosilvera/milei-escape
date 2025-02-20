let touchInput = {
  up: false,
  down: false,
  left: false,
  right: false
};

document.addEventListener('DOMContentLoaded', function() {
  const controls = document.getElementById('controls');
  if (controls) {
    const handleTouchEvent = (event) => {
      event.preventDefault();
      const btn = event.target.closest('.arrow-btn');
      if (!btn) return;
      
      const action = btn.id;
      touchInput[action] = (event.type === 'touchstart');
    };

    controls.addEventListener('touchstart', handleTouchEvent, { passive: false });
    controls.addEventListener('touchend', handleTouchEvent);
    controls.addEventListener('touchcancel', handleTouchEvent);

    ['mousedown', 'mouseup', 'mouseleave'].forEach(eventType => {
      controls.addEventListener(eventType, (e) => {
        e.preventDefault();
        const btn = e.target.closest('.arrow-btn');
        if (!btn) return;
        
        touchInput[btn.id] = (eventType === 'mousedown');
      });
    });
  }
});

class GameState {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.totalDocumentos = 15;
    this.evidencias = { documentos: 0 };
    this.alertasFBI = 0;
    this.apoyo = 100;
    this.trapHits = 0;
    this.caught = false;
    // Iniciamos con 1 agente (FBI) y se incrementará conforme aumenten las alertas.
    this.agentCount = 1;
  }
  
  get documentosRestantes() {
    return this.totalDocumentos - this.evidencias.documentos;
  }
  
  aumentarDificultad() {
    // Máximo 6 agentes
    this.agentCount = Math.min(6, this.agentCount + 1);
  }
}

class AgentIA {
  constructor(sprite) {
    this.sprite = sprite;
    this.states = { PATROL: 0, CHASE: 1 };
    this.currentState = this.states.PATROL;
    this.baseSpeed = 100;
  }
  
  update(target) {
    // Durante los primeros 5 segundos, los agentes solo patrullan.
    if (this.sprite.scene.time.now < this.sprite.scene.chaseEnabledTime) {
      if (!this.sprite.patrolTimer || this.sprite.patrolTimer < this.sprite.scene.time.now) {
        const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));
        this.sprite.setVelocity(
          Math.cos(angle) * 50,
          Math.sin(angle) * 50
        );
        this.sprite.patrolTimer = this.sprite.scene.time.now + 2000;
      }
      return;
    }
    
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, target.x, target.y
    );
    
    this.currentState = distance < 200 ? this.states.CHASE : this.states.PATROL;
    
    if (this.currentState === this.states.CHASE) {
      const speed = this.baseSpeed + (this.sprite.scene.gameState.alertasFBI * 10);
      this.sprite.scene.physics.moveToObject(this.sprite, target, speed);
    } else {
      if (!this.sprite.patrolTimer || this.sprite.patrolTimer < this.sprite.scene.time.now) {
        const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));
        this.sprite.setVelocity(
          Math.cos(angle) * 50,
          Math.sin(angle) * 50
        );
        this.sprite.patrolTimer = this.sprite.scene.time.now + 2000;
      }
    }
  }
}

function showTempMessage(scene, textContent, color = '#fff') {
  const x = scene.cameras.main.centerX;
  const msg = scene.add.dom(x, 50).createFromHTML(`
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
    // Cargamos todos los assets necesarios para todas las escenas.
    this.load.image('milei', 'img/milei.png');
    this.load.image('documento', 'img/documento.png');
    this.load.image('fbi', 'img/fbi.png');
    this.load.image('trampa', 'img/trampa.png');
    this.load.image('tweet', 'img/tweet.png');
    this.load.audio('click', 'sounds/click.wav');
    this.load.audio('coin', 'sounds/coin.wav');
    this.load.audio('musicaFondo', 'sounds/musica-fondo.wav');
    this.load.audio('notification', 'sounds/notification.wav');
    this.load.audio('sirena', 'sounds/sirena.wav');
  }
  
  create() {
    // Desbloquea el audio en móviles tras el primer toque.
    this.input.once('pointerdown', () => {
      if (this.sound.context.state !== 'running') {
        this.sound.context.resume();
      }
    });
    
    // Fondo de la pantalla de inicio.
    this.add.rectangle(400, 300, 600, 400, 0xffffff, 0.95)
      .setStrokeStyle(2, 0x000000);
    
    // Título (más pequeño y separado de la intro).
    this.add.text(400, 140, 'Milei vs. El FBI', {
      fontSize: '32px',
      fill: '#2c3e50',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Subtítulo o "tagline".
    this.add.text(400, 190, 'La estafa de Libra', {
      fontSize: '24px',
      fill: '#2c3e50',
      align: 'center'
    }).setOrigin(0.5);
    
    // Introducción (con espacio suficiente).
    this.add.text(400, 260, 
      '40 inversores denunciaron a Milei ante el FBI\npor estafa con la shitcoin de Libra.\n\n¡Ayúdalo a esconder 15 evidencias clave\nantes de que su popularidad caiga a 0!\n\nEvita a los agentes del FBI y\nmantén el apoyo popular.',
      {
        fontSize: '18px',
        fill: '#34495e',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 550 }
      }
    ).setOrigin(0.5);
    
    // Botón para iniciar el juego.
    const startButton = this.add.text(400, 360, 'Iniciar Juego', {
      fontSize: '28px',
      fill: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 30, y: 15 },
      borderRadius: 15
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    startButton.on('pointerover', () => startButton.setBackgroundColor('#219a52'));
    startButton.on('pointerout', () => startButton.setBackgroundColor('#27ae60'));
    startButton.on('pointerdown', () => {
      touchInput = { up: false, down: false, left: false, right: false };
      this.sound.play('click');
      this.scene.start('GameScene');
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.isInvulnerable = false;
    this.gameEnded = false;
  }
  
  create() {
    this.gameState = new GameState();
    // Música de fondo con volumen reducido.
    this.musica = this.sound.add('musicaFondo').play({ loop: true, volume: 0.3 });
    
    this.createUI();
    this.createPlayer();
    
    // Durante los primeros 5 segundos los agentes no persiguen y el jugador es invulnerable.
    this.chaseEnabledTime = this.time.now + 5000;
    this.isInvulnerable = true;
    this.time.delayedCall(5000, () => {
      this.isInvulnerable = false;
    });
    
    this.initGroups();
    this.spawnInitialObjects();
    this.setupCollisions();
    this.setupTimers();
  }
  
  createUI() {
    this.uiContainer = this.add.container(0, 0);
    
    const style = {
      fontSize: '24px',
      fontStyle: 'bold',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: { x: 15, y: 10 }
    };
    
    this.documentCounter = this.add.text(20, 20, 'EVIDENCIAS: 15/15', {
      ...style,
      fill: '#2c3e50'
    }).setOrigin(0);
    
    this.supportText = this.add.text(20, 60, 'POPULARIDAD: 100', {
      ...style,
      fill: '#27ae60'
    }).setOrigin(0);
    
    this.fbiText = this.add.text(20, 100, 'ALERTAS: 0', {
      ...style,
      fill: '#c0392b'
    }).setOrigin(0);
    
    this.uiContainer.add([this.documentCounter, this.supportText, this.fbiText]);
  }
  
  createPlayer() {
    this.player = this.physics.add.sprite(400, 300, 'milei')
      .setScale(0.3)
      .setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  
  initGroups() {
    this.documents = this.physics.add.group();
    this.tweets = this.physics.add.group();
    this.traps = this.physics.add.group();
    this.agents = this.physics.add.group();
    
    // Crear agentes según gameState.agentCount (inicialmente 1).
    for (let i = 0; i < this.gameState.agentCount; i++) {
      this.createAgent();
    }
  }
  
  createAgent() {
    const agent = this.physics.add.sprite(
      Phaser.Math.Between(100, 700),
      Phaser.Math.Between(100, 500),
      'fbi'
    )
    .setScale(0.3)
    .setCollideWorldBounds(true)
    .setBounce(0.5);
    
    agent.ia = new AgentIA(agent);
    this.agents.add(agent);
  }
  
  spawnInitialObjects() {
    this.spawnDocument();
    this.spawnTweet();
    this.spawnTrap();
    this.spawnTrap();
  }
  
  setupCollisions() {
    this.physics.add.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.add.overlap(this.player, this.tweets, this.collectTweet, null, this);
    this.physics.add.overlap(this.player, this.traps, this.hitTrap, null, this);
    this.physics.add.overlap(this.player, this.agents, this.onAgentCollision, null, this);
  }
  
  setupTimers() {
    this.apoyoTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameState.apoyo = Math.max(this.gameState.apoyo - 1, 0);
        this.updateUI();
        if (!this.gameEnded && this.gameState.apoyo <= 0) {
          this.endGame(false);
        }
      },
      loop: true
    });
  }
  
  update() {
    if (this.gameEnded) return;
    
    const speed = 200;
    let vx = 0, vy = 0;
    
    if (this.cursors.left.isDown || touchInput.left) vx = -speed;
    if (this.cursors.right.isDown || touchInput.right) vx = speed;
    if (this.cursors.up.isDown || touchInput.up) vy = -speed;
    if (this.cursors.down.isDown || touchInput.down) vy = speed;
    
    this.player.setVelocity(vx, vy);
    this.agents.getChildren().forEach(agent => agent.ia.update(this.player));
    
    if (!this.gameEnded && this.gameState.evidencias.documentos >= 15) {
      this.endGame(true);
    }
  }
  
  updateUI() {
    this.documentCounter.setText(`DOCUMENTOS: ${this.gameState.documentosRestantes}/15`);
    this.supportText.setText(`APOYO: ${Math.max(this.gameState.apoyo, 0)}`);
    this.fbiText.setText(`ALERTAS: ${this.gameState.alertasFBI}`);
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
    
    this.tweens.add({
      targets: this.documentCounter,
      scale: 1.2,
      duration: 200,
      yoyo: true
    });
    
    this.spawnDocument();
    this.spawnTrap();
    this.updateUI();
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
    this.updateUI();
  }
  
  hitTrap(player, trap) {
    trap.disableBody(true, true);
    this.gameState.apoyo = Math.max(this.gameState.apoyo - 15, 0);
    
    const sirena = this.sound.add('sirena');
    sirena.play();
    this.time.delayedCall(2000, () => sirena.stop());
    
    this.gameState.trapHits++;
    if (this.gameState.trapHits >= 3) {
      this.gameState.alertasFBI++;
      this.gameState.trapHits = 0;
      this.gameState.aumentarDificultad();
      this.createAgent();
      showTempMessage(this, "¡Refuerzos del FBI!", "#ff0000");
    }
    
    this.time.delayedCall(2000, () => this.spawnTrap());
    this.updateUI();
  }
  
  onAgentCollision(player, agent) {
    if (this.isInvulnerable || this.gameEnded) return;
    
    // Pausar la física para evitar bloqueos y marcar el fin del juego.
    this.gameEnded = true;
    this.physics.pause();
    this.gameState.caught = true;
    this.sound.play('sirena');
    this.musica.stop();
    
    showTempMessage(this, "¡Fuiste atrapado por el FBI!", "#ff0000");
    
    this.time.delayedCall(1500, () => {
      this.scene.start('EndScene', { 
        score: this.gameState.evidencias.documentos,
        win: false,
        caught: true
      });
    });
  }
  
  endGame(win) {
    if (this.gameEnded) return;
    this.gameEnded = true;
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
    this.caught = data.caught || false;
  }
  
  create() {
    const endContainer = this.add.container(400, 300);
    
    const background = this.add.rectangle(0, 0, 600, 400, 0xffffff, 0.95)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x000000);
    
    let titleText, messageText;
    if (this.caught) {
      titleText = "¡Fuiste atrapado!";
      messageText = "El FBI te capturó con las manos en la masa.\nTu popularidad cayó a 0.";
    } else if (this.win) {
      titleText = "¡Victoria!";
      messageText = "Lograste esconder las evidencias y engañar\nal FBI y al pueblo.";
    } else {
      titleText = "¡Derrota!";
      messageText = "Tu popularidad cayó a 0 antes de que\npudieras esconder todos los documentos.";
    }
    
    const title = this.add.text(0, -80, titleText, {
      fontSize: '36px',
      fill: '#2c3e50',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const message = this.add.text(0, 0, messageText, {
      fontSize: '24px',
      fill: '#34495e',
      align: 'center',
      lineSpacing: 15
    }).setOrigin(0.5);
    
    const scoreText = this.add.text(0, 80, `Evidencias escondidas: ${this.finalScore}`, {
      fontSize: '24px',
      fill: '#34495e',
      align: 'center'
    }).setOrigin(0.5);
    
    const restartButton = this.add.text(0, 140, 'Jugar de nuevo', {
      fontSize: '28px',
      fill: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 30, y: 15 },
      borderRadius: 15
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    restartButton.on('pointerover', () => restartButton.setBackgroundColor('#219a52'));
    restartButton.on('pointerout', () => restartButton.setBackgroundColor('#27ae60'));
    restartButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('StartScene');
    });

    endContainer.add([background, title, message, scoreText, restartButton]);
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
    arcade: { 
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: [StartScene, GameScene, EndScene],
  input: {
    activePointers: 3,
    touch: { 
      capture: false 
    }
  },
  // Habilitar el contenedor DOM para notificaciones (tweets)
  dom: {
    createContainer: true
  }
};

new Phaser.Game(config);
