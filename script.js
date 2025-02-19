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

    const handleTouchEvent = (event) => {
      event.preventDefault(); // Prevenir comportamiento por defecto
      const btn = event.target.closest('.arrow-btn');
      if (!btn) return;
      
      const action = btn.id;
      if (event.type === 'touchstart') {
        touchInput[action] = true;
      } else {
        touchInput[action] = false;
      }
    };

    // Eventos táctiles
    controls.addEventListener('touchstart', handleTouchEvent, { passive: false });
    controls.addEventListener('touchend', handleTouchEvent);
    controls.addEventListener('touchcancel', handleTouchEvent);

    // Eventos mouse para desktop
    [btnUp, btnDown, btnLeft, btnRight].forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touchInput[btn.id] = true;
      });
      
      btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        touchInput[btn.id] = false;
      });
      
      btn.addEventListener('mouseleave', (e) => {
        e.preventDefault();
        touchInput[btn.id] = false;
      });
    });
  }
});

class GameState {
  constructor() {
    this.totalDocumentos = 15;
    this.evidencias = { documentos: 0 };
    this.alertasFBI = 0;
    this.apoyo = 100;
    this.trapHits = 0;
    this.caught = false;
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
    
    this.currentState = distance < 150 ? this.states.CHASE : this.states.PATROL;
    
    if (this.currentState === this.states.CHASE) {
      this.sprite.scene.physics.moveToObject(this.sprite, target, 100);
    } else if (!this.sprite.patrolTimer || this.sprite.patrolTimer < this.sprite.scene.time.now) {
      const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));
      this.sprite.setVelocity(
        Math.cos(angle) * 50,
        Math.sin(angle) * 50
      );
      this.sprite.patrolTimer = this.sprite.scene.time.now + 2000;
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
    
    const background = this.add.rectangle(0, 0, 600, 400, 0xffffff, 0.95)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x000000);
    
    const titleText = this.add.text(0, -120, 'Milei vs. El FBI\nLa estafa de Libra', {
      fontSize: '36px',
      fill: '#2c3e50',
      align: 'center',
      fontStyle: 'bold',
      lineSpacing: 20
    }).setOrigin(0.5);

    const introText = this.add.text(0, -20, 
      '40 inversores denunciaron a Milei ante el FBI\npor estafa con la criptomoneda Libra.\n\n¡Ayúdalo a esconder 15 documentos clave\nantes que su popularidad caiga a 0!\n\nEvita a los agentes del FBI y\nmantén el apoyo popular.',
      {
        fontSize: '18px',
        fill: '#34495e',
        align: 'center',
        lineSpacing: 12,
        wordWrap: { width: 500 }
      }
    ).setOrigin(0.5);

    const startButton = this.add.text(0, 140, 'Iniciar Juego', {
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

    startContainer.add([background, titleText, introText, startButton]);
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
    
    // UI
    this.uiContainer = this.add.container(0, 0);
    
    this.documentCounter = this.add.text(20, 20, 'DOCUMENTOS: 15/15', {
      fontSize: '24px',
      fill: '#2c3e50',
      fontStyle: 'bold',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: { x: 15, y: 10 }
    }).setOrigin(0);
    
    this.supportText = this.add.text(20, 60, 'APOYO: 100', {
      fontSize: '24px',
      fill: '#27ae60',
      fontStyle: 'bold',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: { x: 15, y: 10 }
    }).setOrigin(0);
    
    this.fbiText = this.add.text(20, 100, 'ALERTAS: 0', {
      fontSize: '24px',
      fill: '#c0392b',
      fontStyle: 'bold',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: { x: 15, y: 10 }
    }).setOrigin(0);
    
    this.uiContainer.add([this.documentCounter, this.supportText, this.fbiText]);
    
    // Jugador
    this.player = this.physics.add.sprite(400, 300, 'milei')
      .setScale(0.3)
      .setCollideWorldBounds(true);
    
    // Objetos del juego
    this.documents = this.physics.add.group();
    this.tweets = this.physics.add.group();
    this.traps = this.physics.add.group();
    this.agents = this.physics.add.group();
    
    // Spawn inicial
    this.spawnDocument();
    this.spawnTweet();
    this.spawnTrap();
    this.spawnTrap();
    
    // Agentes del FBI
    for (let i = 0; i < 2; i++) {
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
    
    // Colisiones
    this.physics.add.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.add.overlap(this.player, this.tweets, this.collectTweet, null, this);
    this.physics.add.overlap(this.player, this.traps, this.hitTrap, null, this);
    this.physics.add.overlap(this.player, this.agents, this.onAgentCollision, null, this);
    
    // Temporizador de popularidad
    this.apoyoTimer = this.time.addEvent({
      delay: 1000,
      callback: () => this.gameState.apoyo = Math.max(this.gameState.apoyo - 1, 0),
      loop: true
    });
    
    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  
  update() {
    if (this.gameState.caught) return;
    
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
    this.documentCounter.setText(`DOCUMENTOS: ${this.gameState.documentosRestantes}/15`);
    this.supportText.setText(`APOYO: ${Math.max(this.gameState.apoyo, 0)}`);
    this.fbiText.setText(`ALERTAS: ${this.gameState.alertasFBI}`);
    
    // Condiciones de fin
    if (this.gameState.evidencias.documentos >= 15) this.endGame(true);
    if (this.gameState.apoyo <= 0) this.endGame(false);
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
      isPositive ? "¡La casta política nos quiere frenar!" : "¡Fake news en redes sociales!",
      isPositive ? "#0f0" : "#f00"
    );
    this.spawnTweet();
  }
  
  hitTrap(player, trap) {
    trap.disableBody(true, true);
    this.gameState.apoyo = Math.max(this.gameState.apoyo - 15, 0);
    
    // Sonido de sirena por 2 segundos
    const sirena = this.sound.add('sirena');
    sirena.play();
    this.time.delayedCall(2000, () => sirena.stop());
    
    showTempMessage(this, "¡Trampa activada!", "#f80");
    
    this.gameState.trapHits++;
    if (this.gameState.trapHits >= 3) {
      this.gameState.alertasFBI++;
      this.gameState.trapHits = 0;
    }
    this.time.delayedCall(2000, () => this.spawnTrap());
  }
  
  onAgentCollision(player, agent) {
    if (this.isInvulnerable || this.gameState.caught) return;
    this.isInvulnerable = true;
    this.gameState.caught = true;
    
    this.sound.play('sirena');
    this.gameState.apoyo = 0;
    showTempMessage(this, "¡Fuiste atrapado por el FBI!", "#ff0000");
    
    this.time.delayedCall(2000, () => {
      this.scene.start('EndScene', { 
        score: this.gameState.evidencias.documentos,
        win: false,
        caught: true
      });
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
    
    const scoreText = this.add.text(0, 80, `Documentos recolectados: ${this.finalScore}`, {
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
  }
};

new Phaser.Game(config);
