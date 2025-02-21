class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Carga de imágenes
    this.load.image('milei', 'img/milei.png');
    this.load.image('documento', 'img/documento.png');
    this.load.image('fbi', 'img/fbi.png');
    this.load.image('trampa', 'img/trampa.png');
    this.load.image('tweet', 'img/tweet.png');

    // Carga de audios
    this.load.audio('click', 'sounds/click.wav');
    this.load.audio('coin', 'sounds/coin.wav');
    this.load.audio('musicaFondo', 'sounds/musica-fondo.wav');
    this.load.audio('notification', 'sounds/notification.wav');
    this.load.audio('sirena', 'sounds/sirena.wav');
  }

  create() {
    // Música de fondo
    this.music = this.sound.add('musicaFondo', { loop: true, volume: 0.5 });
    this.music.play();

    // Variables del juego
    this.popularity = 100;  // Apoyo inicial
    this.documentCount = 0; // Documentos recolectados

    // Mostrar estado del juego
    this.popularityText = this.add.text(10, 10, 'Apoyo: ' + this.popularity, { fontSize: '20px', fill: '#fff' });
    this.documentText = this.add.text(10, 40, 'Documentos: ' + this.documentCount + '/15', { fontSize: '20px', fill: '#fff' });

    // Creación del jugador y sus propiedades
    this.player = this.physics.add.sprite(400, 300, 'milei');
    this.player.setCollideWorldBounds(true);

    // Grupos de elementos del juego
    this.documents = this.physics.add.group();
    this.fbis = this.physics.add.group();
    this.traps = this.physics.add.group();
    this.tweets = this.physics.add.group();

    // Generar 15 documentos en posiciones aleatorias
    for (let i = 0; i < 15; i++) {
      let x = Phaser.Math.Between(50, 750);
      let y = Phaser.Math.Between(50, 550);
      let doc = this.documents.create(x, y, 'documento');
      doc.setImmovable(true);
    }

    // Generar algunos agentes del FBI
    for (let i = 0; i < 3; i++) {
      let x = Phaser.Math.Between(50, 750);
      let y = Phaser.Math.Between(50, 550);
      let agent = this.fbis.create(x, y, 'fbi');
      agent.setCollideWorldBounds(true);
      agent.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
      agent.setBounce(1);
    }

    // Generar trampas
    for (let i = 0; i < 5; i++) {
      let x = Phaser.Math.Between(50, 750);
      let y = Phaser.Math.Between(50, 550);
      let trap = this.traps.create(x, y, 'trampa');
      trap.setImmovable(true);
    }

    // Generar tweets (pueden sumar o restar apoyo)
    for (let i = 0; i < 5; i++) {
      let x = Phaser.Math.Between(50, 750);
      let y = Phaser.Math.Between(50, 550);
      let tweet = this.tweets.create(x, y, 'tweet');
      tweet.setImmovable(true);
    }

    // Colisiones y solapamientos
    this.physics.add.overlap(this.player, this.documents, this.collectDocument, null, this);
    this.physics.add.overlap(this.player, this.tweets, this.collectTweet, null, this);
    this.physics.add.overlap(this.player, this.traps, this.hitTrap, null, this);
    this.physics.add.overlap(this.player, this.fbis, this.caughtByFBI, null, this);

    // Controles de teclado
    this.cursors = this.input.keyboard.createCursorKeys();

    // Configuración de controles táctiles (HTML)
    this.setupTouchControls();

    // Temporizador para decrementar el apoyo con el tiempo
    this.time.addEvent({
      delay: 1000,
      callback: this.decreasePopularity,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    // Reinicia la velocidad del jugador
    this.player.setVelocity(0);

    // Controles de teclado
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    }
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-200);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(200);
    }

    // Controles táctiles
    if (this.touchInput) {
      if (this.touchInput.left) {
        this.player.setVelocityX(-200);
      } else if (this.touchInput.right) {
        this.player.setVelocityX(200);
      }
      if (this.touchInput.up) {
        this.player.setVelocityY(-200);
      } else if (this.touchInput.down) {
        this.player.setVelocityY(200);
      }
    }
  }

  // Función para recolectar un documento
  collectDocument(player, document) {
    document.destroy();
    this.sound.play('coin');
    this.documentCount++;
    this.documentText.setText('Documentos: ' + this.documentCount + '/15');

    // Verifica condición de victoria
    if (this.documentCount >= 15) {
      this.winGame();
    }
  }

  // Función para recolectar un tweet
  collectTweet(player, tweet) {
    tweet.destroy();
    // Modificación aleatoria del apoyo
    let change = Phaser.Math.Between(-10, 10);
    this.popularity += change;
    this.sound.play('notification');
    if (change >= 0) {
      this.showMessage('¡Tweet positivo! +' + change + ' apoyo');
    } else {
      this.showMessage('¡Tweet negativo! ' + change + ' apoyo');
    }
    this.popularityText.setText('Apoyo: ' + this.popularity);
    if (this.popularity <= 0) {
      this.gameOver();
    }
  }

  // Función al activar una trampa
  hitTrap(player, trap) {
    trap.destroy();
    this.sound.play('sirena');
    this.popularity -= 20;
    this.popularityText.setText('Apoyo: ' + this.popularity);
    this.showMessage('¡Trampa activada! -20 apoyo');

    // Aumenta la velocidad de los agentes del FBI temporalmente
    this.fbis.children.iterate(function(agent) {
      agent.setVelocity(agent.body.velocity.x * 1.5, agent.body.velocity.y * 1.5);
    });

    if (this.popularity <= 0) {
      this.gameOver();
    }
  }

  // Función que se dispara si el FBI atrapa al jugador
  caughtByFBI(player, fbi) {
    this.gameOver();
  }

  // Disminuye el apoyo con el tiempo
  decreasePopularity() {
    this.popularity -= 1;
    this.popularityText.setText('Apoyo: ' + this.popularity);
    if (this.popularity <= 0) {
      this.gameOver();
    }
  }

  // Muestra mensajes temporales con animación
  showMessage(message) {
    let msgText = this.add.text(400, 300, message, { fontSize: '24px', fill: '#ff0' }).setOrigin(0.5);
    this.tweens.add({
      targets: msgText,
      alpha: 0,
      duration: 2000,
      ease: 'Linear',
      onComplete: () => {
        msgText.destroy();
      }
    });
  }

  // Condiciones de victoria y derrota
  winGame() {
    this.music.stop();
    this.add.text(400, 300, '¡Ganaste!', { fontSize: '48px', fill: '#0f0' }).setOrigin(0.5);
    this.physics.pause();
  }

  gameOver() {
    this.music.stop();
    this.add.text(400, 300, '¡Perdiste!', { fontSize: '48px', fill: '#f00' }).setOrigin(0.5);
    this.physics.pause();
  }

  // Configuración de controles táctiles a través de botones HTML
  setupTouchControls() {
    this.touchInput = { up: false, down: false, left: false, right: false };

    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    // Eventos para dispositivos táctiles
    btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchInput.up = true; });
    btnUp.addEventListener('touchend', (e) => { e.preventDefault(); this.touchInput.up = false; });

    btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchInput.down = true; });
    btnDown.addEventListener('touchend', (e) => { e.preventDefault(); this.touchInput.down = false; });

    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchInput.left = true; });
    btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); this.touchInput.left = false; });

    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchInput.right = true; });
    btnRight.addEventListener('touchend', (e) => { e.preventDefault(); this.touchInput.right = false; });

    // Eventos para mouse (para uso en escritorio)
    btnUp.addEventListener('mousedown', () => { this.touchInput.up = true; });
    btnUp.addEventListener('mouseup', () => { this.touchInput.up = false; });
    btnDown.addEventListener('mousedown', () => { this.touchInput.down = true; });
    btnDown.addEventListener('mouseup', () => { this.touchInput.down = false; });
    btnLeft.addEventListener('mousedown', () => { this.touchInput.left = true; });
    btnLeft.addEventListener('mouseup', () => { this.touchInput.left = false; });
    btnRight.addEventListener('mousedown', () => { this.touchInput.right = true; });
    btnRight.addEventListener('mouseup', () => { this.touchInput.right = false; });
  }
}

// Configuración de Phaser y escalado responsive
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: MainScene
};

// Inicializa el juego
const game = new Phaser.Game(config);
