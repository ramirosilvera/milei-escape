// Clase que mantiene el estado global del juego.
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

// Clase para la IA básica de los agentes del FBI.
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
    // Lógica simple de IA:
    // Si el agente está en estado PATROL, se mueve de forma aleatoria.
    // Si el agente detecta al jugador (target) a cierta distancia, cambia a CHASE.
    
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, target.x, target.y
    );
    
    if (distance < 150) {
      this.currentState = this.states.CHASE;
    } else {
      this.currentState = this.states.PATROL;
    }
    
    if (this.currentState === this.states.CHASE) {
      // Movimiento hacia el jugador
      this.sprite.scene.physics.moveToObject(this.sprite, target, 100);
    } else if (this.currentState === this.states.PATROL) {
      // Movimiento aleatorio (puedes ampliar con un pathfinding más complejo)
      if (!this.sprite.patrolTimer || this.sprite.patrolTimer < this.sprite.scene.time.now) {
        const randomAngle = Phaser.Math.Between(0, 360);
        const velocityX = Math.cos(Phaser.Math.DegToRad(randomAngle)) * 50;
        const velocityY = Math.sin(Phaser.Math.DegToRad(randomAngle)) * 50;
        this.sprite.setVelocity(velocityX, velocityY);
        // Cambia dirección cada 2 segundos
        this.sprite.patrolTimer = this.sprite.scene.time.now + 2000;
      }
    }
  }
}

// Escena principal del juego
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }
  
  preload() {
    // Carga de imágenes
    this.load.image('fondo', 'img/fondo.jpeg');
    this.load.image('milei', 'img/milei.png');
    this.load.image('documento', 'img/documento.png');
    this.load.image('fbi', 'img/fbi.png');
    this.load.image('moneda', 'img/moneda.png');
    this.load.image('trampa', 'img/trampa.png');
    
    // Carga de sonidos
    this.load.audio('click', 'sounds/click.wav');
    this.load.audio('coin', 'sounds/coin.wav');
    this.load.audio('musicaFondo', 'sounds/musica-fondo.wav');
    this.load.audio('notification', 'sounds/notification.wav');
    this.load.audio('sirena', 'sounds/sirena.wav');
  }
  
  create() {
    // Agregar fondo (se centra en la mitad del canvas)
    this.add.image(400, 300, 'fondo');
    
    // Música de fondo
    let musica = this.sound.add('musicaFondo');
    musica.play({ loop: true, volume: 0.5 });
    
    // Crear al jugador con el sprite de Milei
    this.player = this.physics.add.sprite(400, 300, 'milei');
    this.player.setCollideWorldBounds(true);
    
    // Inicializar controles del teclado
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Inicializar el estado global del juego
    this.gameState = new GameState();
    
    // Grupo de documentos (coleccionables)
    this.documents = this.physics.add.group();
    let documento = this.documents.create(200, 200, 'documento');
    
    // Grupo de agentes del FBI
    this.agents = this.physics.add.group();
    for (let i = 0; i < 3; i++) {
      let x = Phaser.Math.Between(100, 700);
      let y = Phaser.Math.Between(100, 500);
      let agentSprite = this.physics.add.sprite(x, y, 'fbi');
      agentSprite.ia = new AgentIA(agentSprite);
      this.agents.add(agentSprite);
    }
    
    // Colisiones e interacciones
    this.physics.add.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.add.overlap(this.player, this.agents, this.onAgentCollision, null, this);
    
    // (Opcional) Podrías agregar más grupos de coleccionables, trampas, monedas, etc.
  }
  
  update() {
    // Movimiento del jugador en 8 direcciones
    let speed = 200;
    this.player.setVelocity(0);
    
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    }
    if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    }
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    }
    if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }
    
    // Actualizar la IA de cada agente
    this.agents.children.iterate((agent) => {
      if (agent.ia) {
        agent.ia.update(this.player);
      }
    });
    
    // Aquí se pueden incluir otros elementos del update:
    // - Gestión de la barra de apoyo político
    // - Verificación de colisiones con trampas
    // - Eventos narrativos (cambio de niveles, mini-juegos, etc.)
  }
  
  // Función al recoger un documento
  collectDocument(player, document) {
    document.disableBody(true, true);
    this.gameState.evidencias.documentos += 1;
    this.sound.play('coin');
    
    // Aquí podrías agregar efectos visuales (p. ej., un tween que simule un glitch)
  }
  
  // Función al chocar con un agente del FBI
  onAgentCollision(player, agent) {
    this.sound.play('sirena');
    // Reducir apoyo político, aumentar alertas, etc.
    this.gameState.apoyo = Math.max(this.gameState.apoyo - 10, 0);
    
    // Mostrar feedback visual o notificación en pantalla
  }
}

// Configuración del juego utilizando Phaser
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: GameScene
};

// Inicialización del juego
const game = new Phaser.Game(config);
