// Objeto global para controlar la entrada táctil
let touchInput = {
  up: false,
  down: false,
  left: false,
  right: false
};

// Una vez cargado el DOM, se asocian los botones táctiles
document.addEventListener('DOMContentLoaded', function() {
  const controls = document.getElementById('controls');
  if (controls) {
    controls.style.display = 'flex';
    const btnUp = document.getElementById('up');
    const btnDown = document.getElementById('down');
    const btnLeft = document.getElementById('left');
    const btnRight = document.getElementById('right');

    btnUp.addEventListener('pointerdown', () => touchInput.up = true);
    btnUp.addEventListener('pointerup', () => touchInput.up = false);
    btnDown.addEventListener('pointerdown', () => touchInput.down = true);
    btnDown.addEventListener('pointerup', () => touchInput.down = false);
    btnLeft.addEventListener('pointerdown', () => touchInput.left = true);
    btnLeft.addEventListener('pointerup', () => touchInput.left = false);
    btnRight.addEventListener('pointerdown', () => touchInput.right = true);
    btnRight.addEventListener('pointerup', () => touchInput.right = false);
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
    // Se cargan los assets necesarios para todo el juego
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
    // Fondo y título de la pantalla de inicio
    this.add.image(400, 300, 'fondo');
    
    const titleText = this.add.text(400, 150, 'LIBRA Escape - La Conspiración KIP', {
      fontSize: '28px',
      fill: '#fff'
    });
    titleText.setOrigin(0.5);
    
    // Botón para iniciar el juego
    const startButton = this.add.text(400, 300, 'Iniciar Juego', {
      fontSize: '24px',
      fill: '#0f0',
      backgroundColor: '#000',
      padding: { x: 10, y: 5 }
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });
    
    startButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('GameScene');
    });
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
    // Inicializa el estado del juego
    this.gameState = new GameState();
    
    // Fondo y música
    this.add.image(400, 300, 'fondo');
    this.musica = this.sound.add('musicaFondo');
    this.musica.play({ loop: true, volume: 0.5 });
    
    // Jugador
    this.player = this.physics.add.sprite(400, 300, 'milei');
    this.player.setCollideWorldBounds(true);
    
    // Controles de teclado
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Grupo de documentos (coleccionables)
    this.documents = this.physics.add.group();
    this.documents.create(200, 200, 'documento');
    
    // Grupo de agentes del FBI
    this.agents = this.physics.add.group();
    for (let i = 0; i < 3; i++) {
      let x = Phaser.Math.Between(100, 700);
      let y = Phaser.Math.Between(100, 500);
      let agentSprite = this.physics.add.sprite(x, y, 'fbi');
      agentSprite.ia = new AgentIA(agentSprite);
      this.agents.add(agentSprite);
    }
    
    // Detección de colisiones e interacciones
    this.physics.add.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.add.overlap(this.player, this.agents, this.onAgentCollision, null, this);
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
    
    // Entrada táctil (flechas en pantalla)
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
    
    // Actualiza la IA de los agentes
    this.agents.children.iterate((agent) => {
      if (agent.ia) {
        agent.ia.update(this.player);
      }
    });
    
    // Condición de fin de juego (por ejemplo, cuando el apoyo llega a 0)
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
    // Fondo y textos finales
    this.add.image(400, 300, 'fondo');
    
    const endText = this.add.text(400, 200, 'Juego Terminado', {
      fontSize: '32px',
      fill: '#fff'
    });
    endText.setOrigin(0.5);
    
    const scoreText = this.add.text(400, 260, `Documentos recolectados: ${this.finalScore}`, {
      fontSize: '24px',
      fill: '#fff'
    });
    scoreText.setOrigin(0.5);
    
    // Botón para reiniciar
    const restartButton = this.add.text(400, 350, 'Reiniciar Juego', {
      fontSize: '24px',
      fill: '#0f0',
      backgroundColor: '#000',
      padding: { x: 10, y: 5 }
    });
    restartButton.setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });
    
    restartButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('StartScene');
    });
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
