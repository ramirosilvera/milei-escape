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

// ... (clases y funciones auxiliares sin cambios) ...

class StartScene extends Phaser.Scene {
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

    startContainer.add([background, titleText, introText, startButton]);
    
    // ... (interacción del botón sin cambios) ...
  }
}

class GameScene extends Phaser.Scene {
  create() {
    this.gameState = new GameState();
    this.musica = this.sound.add('musicaFondo').play({ loop: true, volume: 0.5 });
    
    // UI mejorada
    this.uiContainer = this.add.container(0, 0);
    
    // Panel de documentos
    this.documentCounter = this.add.text(20, 20, 'DOCUMENTOS: 15/15', {
      fontSize: '24px',
      fill: '#2c3e50',
      fontStyle: 'bold',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: { x: 15, y: 10 }
    }).setOrigin(0);
    
    // Panel de apoyo
    this.supportText = this.add.text(20, 60, 'APOYO: 100', {
      fontSize: '24px',
      fill: '#27ae60',
      fontStyle: 'bold',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: { x: 15, y: 10 }
    }).setOrigin(0);
    
    // Panel de alertas
    this.fbiText = this.add.text(20, 100, 'ALERTAS: 0', {
      fontSize: '24px',
      fill: '#c0392b',
      fontStyle: 'bold',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: { x: 15, y: 10 }
    }).setOrigin(0);
    
    this.uiContainer.add([this.documentCounter, this.supportText, this.fbiText]);
    
    // ... (resto de la creación del juego sin cambios) ...
  }

  update() {
    if (this.gameState.caught) return;
    
    // Actualizar UI
    this.documentCounter.setText(`DOCUMENTOS: ${this.gameState.documentosRestantes}/15`);
    this.supportText.setText(`APOYO: ${Math.max(this.gameState.apoyo, 0)}`);
    this.fbiText.setText(`ALERTAS: ${this.gameState.alertasFBI}`);
    
    // ... (resto del código de update sin cambios) ...
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

  // ... (resto de métodos sin cambios) ...
}

class EndScene extends Phaser.Scene {
  create() {
    const endContainer = this.add.container(400, 300);
    
    const background = this.add.rectangle(0, 0, 600, 400, 0xffffff, 0.95)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x000000);
    
    let titleText, messageText;
    
    if (this.gameState.caught) {
      titleText = "¡Fuiste atrapado!";
      messageText = "El FBI te capturó con las manos en la masa.\nTu popularidad cayó a 0.";
    } else if (this.win) {
      titleText = "¡Victoria!";
      messageText = "Lograste esconder las evidencias y engañar\n al FBI y al pueblo.";
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
