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
    // Aseguramos que los botones respondan a pointer events
    const btnUp = document.getElementById('up');
    const btnDown = document.getElementById('down');
    const btnLeft = document.getElementById('left');
    const btnRight = document.getElementById('right');

    btnUp.addEventListener('pointerdown', () => touchInput.up = true);
    btnUp.addEventListener('pointerup', () => touchInput.up = false);
    btnUp.addEventListener('pointerout', () => touchInput.up = false);

    btnDown.addEventListener('pointerdown', () => touchInput.down = true);
    btnDown.addEventListener('pointerup', () => touchInput.down = false);
    btnDown.addEventListener('pointerout', () => touchInput.down = false);

    btnLeft.addEventListener('pointerdown', () => touchInput.left = true);
    btnLeft.addEventListener('pointerup', () => touchInput.left = false);
    btnLeft.addEventListener('pointerout', () => touchInput.left = false);

    btnRight.addEventListener('pointerdown', () => touchInput.right = true);
    btnRight.addEventListener('pointerup', () => touchInput.right = false);
    btnRight.addEventListener('pointerout', () => touchInput.right = false);
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

// IA básica para los agentes del FBI
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

// ===================
// SCENA DE INICIO
// ===================
class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }
  
  preload() {
    // Carga de assets
    this.load.image('fondo', 'img/fondo.jpeg');
    this.load.image('milei', 'img/milei.png');
    this.load.image('documento', 'img/documento.png');
    this.load.image('fbi', 'img/fbi.png');
    this.load.image('moneda', 'img/moneda.png');
    this.load.image('trampa', 'img/trampa.png');
    
    this.load.audio('click', 'sounds/click.wav');
    this.load.audio('coin', 'sounds/coin.wav');
    this.load.audio('musicaFondo', 'sounds/musica-fondo.wav');
    this.load.audio('notification', 'sounds/notification.wav');
    this.load.audio('sirena', 'sounds/sirena.wav');
  }
  
  create() {
    // Fondo
    this.add.image(400, 300, 'fondo').setScale(0.8);
    
    // Contenedor de elementos de la pantalla de inicio
    const startContainer = this.add.container(400, 300);
    
    // Título
    const titleText = this.add.text(0, -100, 'LIBRA Escape - La Conspiración KIP', {
      fontSize: '28px',
      fill: '#fff',
      align: 'center'
    });
    titleText.setOrigin(0.5);
    
    // Botón de inicio
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
    // Estado del juego
    this.gameState = new GameState();
    
    // Fondo
    this.add.image(400, 300, 'fondo').setScale(0.8);
    
    // Música de fondo
    this.musica = this.sound.add('musicaFondo');
    this.musica.play({ loop: true, volume: 0.5 });
    
    // Contenedor para objetos del juego
    this.gameContainer = this.add.container(0, 0);
    
    // Jugador (con tamaño reducido y en contenedor)
    this.player = this.physics.add.sprite(400, 300, 'milei').setScale(0.5);
    this.player.setCollideWorldBounds(true);
    this.gameContainer.add(this.player);
    
    // UI: Visor de apoyo popular (arriba a la izquierda)
    this.supportText = this.add.text(10, 10, 'Apoyo: ' + this.gameState.apoyo, {
      fontSize: '18px',
      fill: '#fff'
    });
    this.supportText.setScrollFactor(0);
    
    // UI: Indicador de alertas FBI (arriba a la derecha)
    this.fbiText = this.add.text(650, 10, 'FBI: ' + this.gameState.alertasFBI, {
      fontSize: '18px',
      fill: '#fff'
    });
    this.fbiText.setScrollFactor(0);
    
    // Documentos (coleccionable) en un contenedor
    this.documents = this.physics.add.group();
    let doc = this.documents.create(200, 200, 'documento').setScale(0.5);
    
    // Agentes del FBI
    this.agents = this.physics.add.group();
    for (let i = 0; i < 3; i++) {
      let x = Phaser.Math.Between(100, 700);
      let y = Phaser.Math.Between(100, 500);
      let agentSprite = this.physics.add.sprite(x, y, 'fbi').setScale(0.5);
      agentSprite.ia = new AgentIA(agentSprite);
      this.agents.add(agentSprite);
    }
    
    // Colisiones e interacciones
    this.physics.add.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.add.overlap(this.player, this.agents, this.onAgentCollision, null, this);
    
    // Controles por teclado
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  
  update() {
    const speed = 200;
    let vx = 0, vy = 0;
    
    // Entrada por teclado
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
    
    // Entrada táctil (botones en pantalla)
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
    
    // Actualiza IA de cada agente
    this.agents.children.iterate((agent) => {
      if (agent.ia) {
        agent.ia.update(this.player);
      }
    });
    
    // Actualiza el visor de apoyo y alertas FBI
    this.supportText.setText('Apoyo: ' + this.gameState.apoyo);
    this.fbiText.setText('FBI: ' + this.gameState.alertasFBI);
    
    // Condición de fin de juego (apoyo se agota)
    if (this.gameState.apoyo <= 0) {
      this.musica.stop();
      this.scene.start('EndScene', { score: this.gameState.evidencias.documentos });
    }
  }
  
  collectDocument(player, document) {
    document.disableBody(true, true);
    this.gameState.evidencias.documentos += 1;
    this.sound.play('coin');
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
  }
  
  create() {
    this.add.image(400, 300, 'fondo').setScale(0.8);
    
    // Contenedor para la pantalla final
    const endContainer = this.add.container(400, 300);
    
    const endText = this.add.text(0, -80, 'Juego Terminado', {
      fontSize: '32px',
      fill: '#fff',
      align: 'center'
    });
    endText.setOrigin(0.5);
    
    const scoreText = this.add.text(0, 0, `Documentos recolectados: ${this.finalScore}`, {
      fontSize: '24px',
      fill: '#fff',
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
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [StartScene, GameScene, EndScene]
};

const game = new Phaser.Game(config);
