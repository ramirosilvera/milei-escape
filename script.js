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
    // Contador para impactos de trampas
    this.trapHits = 0;
    this.documentosRestantes = 15; // Contador de documentos restantes
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
    duration: 4000, // Mensajes duran 4000 ms
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
    // Contenedor central para agrupar elementos en la pantalla de inicio
    const startContainer = this.add.container(400, 300);
    
    // Título del juego
    const titleText = this.add.text(0, -150, 'Milei vs. El FBI: La estafa de Libra', {
      fontSize: '32px',
      fill: '#000',
      align: 'center',
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5);
    
    // Introducción y explicación del objetivo
    const introText = "En este juego, interpretas a Javier Milei, denunciado al FBI por la difusión de la fallida cripto $LIBRA.\n" +
                        "Tu objetivo es robar 15 documentos para engañar al FBI e impedir que demuestren tu culpabilidad\n" +
                        "mientras esquivas agentes del FBI, evitas trampas y aprovechas tweets que pueden aumentar o reducir tu apoyo.\n" +
                        "¡Si tu apoyo llega a 0 perderás!";
    
    const intro = this.add.text(0, -50, introText, {
      fontSize: '20px',
      fill: '#000',
      align: 'center',
      wordWrap: { width: 700 }
    });
    intro.setOrigin(0.5);
    
    // Botón para iniciar el juego
    const startButton = this.add.text(0, 100, 'Iniciar Juego', {
      fontSize: '26px',
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
    
    // Se agregan los elementos al contenedor central
    startContainer.add([titleText, intro, startButton]);
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
    
    // El fondo se muestra vía CSS; la música se reproduce en bucle
    this.musica = this.sound.add('musicaFondo');
    this.musica.play({ loop: true, volume: 0.5 });
    
    this.gameContainer = this.add.container(0, 0);
    
    // Jugador: Milei (escala 0.2)
    this.player = this.physics.add.sprite(400, 300, 'milei').setScale(0.2);
    this.player.setCollideWorldBounds(true);
    this.gameContainer.add(this.player);
    
    // UI: Visor de Apoyo y alertas FBI (con estilo llamativo)
    this.supportText = this.add.text(10, 10, 'Apoyo: ' + this.gameState.apoyo, {
      fontSize: '28px',
      fill: '#000',
      fontStyle: 'bold',
      stroke: '#fff',
      strokeThickness: 3
    });
    this.fbiText = this.add.text(650, 10, 'FBI: ' + this.gameState.alertasFBI, {
      fontSize: '28px',
      fill: '#000',
      fontStyle: 'bold',
      stroke: '#fff',
      strokeThickness: 3
    });

    // Visor de documentos con cuenta regresiva
    this.documentCounterText = this.add.text(400, 50, 'Documentos: ' + this.gameState.documentosRestantes, {
      fontSize: '28px',
      fill: '#000',
      fontStyle: 'bold',
      stroke: '#fff',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Grupo de documentos (escala 0.3)
    this.documents = this.physics.add.group();
    this.spawnDocument();
    
    // Grupo de tweets (escala 0.3)
    this.tweets = this.physics.add.group();
    this.spawnTweet();
    
    // Grupo de trampas (escala 0.3)
    this.traps = this.physics.add.group();
    this.spawnTrap();

    // Configurar el movimiento del jugador
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'ArrowUp') this.player.setVelocityY(-100);
      else if (event.key === 'ArrowDown') this.player.setVelocityY(100);
      else if (event.key === 'ArrowLeft') this.player.setVelocityX(-100);
      else if (event.key === 'ArrowRight') this.player.setVelocityX(100);
    });
    this.input.keyboard.on('keyup', (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') this.player.setVelocityY(0);
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') this.player.setVelocityX(0);
    });
    
    // Lógica para la actualización de las alertas del FBI y la cuenta regresiva
    this.time.addEvent({
      delay: 5000,
      callback: () => {
        this.gameState.alertasFBI += 1;
        if (this.gameState.documentosRestantes > 0) {
          this.gameState.documentosRestantes--;
          this.documentCounterText.setText('Documentos: ' + this.gameState.documentosRestantes);
        }
      },
      loop: true
    });
  }

  // Función para crear documentos
  spawnDocument() {
    this.documents.create(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 500), 'documento').setScale(0.3);
  }

  // Función para crear tweets
  spawnTweet() {
    this.tweets.create(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 500), 'tweet').setScale(0.3);
  }

  // Función para crear trampas
  spawnTrap() {
    this.traps.create(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 500), 'trampa').setScale(0.3);
  }

  update() {
    // Verifica si Milei ha tocado algún documento
    this.physics.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.overlap(this.player, this.traps, this.hitTrap, null, this);
    this.physics.overlap(this.player, this.tweets, this.collectTweet, null, this);
  }

  collectDocument(player, document) {
    document.destroy();
    this.gameState.documentosRestantes--;
    this.documentCounterText.setText('Documentos: ' + this.gameState.documentosRestantes);
    if (this.gameState.documentosRestantes <= 0) {
      this.gameState.apoyo += 10;
    }
  }

  hitTrap(player, trap) {
    trap.destroy();
    this.gameState.apoyo -= 10;
    this.gameState.trapHits++;
    if (this.gameState.apoyo <= 0) {
      this.gameOver();
    }
  }

  collectTweet(player, tweet) {
    tweet.destroy();
    const chance = Phaser.Math.Between(0, 1);
    if (chance > 0.5) {
      this.gameState.apoyo += 20;
    } else {
      this.gameState.apoyo -= 20;
    }
  }

  gameOver() {
    this.musica.stop();
    this.scene.start('StartScene');
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [StartScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

const game = new Phaser.Game(config);
