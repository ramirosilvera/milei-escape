// Configuración del Juego
const config = {
    niveles: 3,
    velocidadAgentes: 1.5,
    radioDeteccion: 150,
    tamañoCanvas: { ancho: 800, alto: 500 }
};

// Estado del Juego
let juego = {
    nivel: 1,
    apoyo: 100,
    pistasFBI: 0,
    posX: 400,
    posY: 250,
    agentes: [],
    objetos: [],
    activo: false
};

// Elementos DOM
const DOM = {
    inicio: document.getElementById('pantalla-inicio'),
    juego: document.getElementById('juego'),
    fin: document.getElementById('pantalla-fin'),
    nivel: document.getElementById('nivel'),
    apoyo: document.getElementById('apoyo'),
    pistas: document.getElementById('pistas'),
    resultado: document.getElementById('resultado'),
    canvas: document.getElementById('game-canvas'),
    ctx: null
};

// Inicializar Canvas
DOM.ctx = DOM.canvas.getContext('2d');
DOM.canvas.width = config.tamañoCanvas.ancho;
DOM.canvas.height = config.tamañoCanvas.alto;

// Cargar imágenes
const imagenes = {
    milei: cargarImagen('milei.png'),
    fbi: cargarImagen('fbi.png'),
    documento: cargarImagen('documento.png'),
    moneda: cargarImagen('moneda.png'),
    trampa: cargarImagen('trampa.png')
};

// Cargar sonidos
const sonidos = {
    movimiento: new Audio('sounds/click.wav'),
    alerta: new Audio('sounds/sirena.wav'),
    moneda: new Audio('sounds/coin.wav'),
    musica: new Audio('sounds/musica-fondo.wav')
};

sonidos.musica.loop = true;

function iniciarJuego() {
    DOM.inicio.style.display = 'none';
    DOM.juego.style.display = 'block';
    juego.activo = true;
    cargarNivel(juego.nivel);
    sonidos.musica.play();
    loopJuego();
}

function cargarNivel(nivel) {
    juego.agentes = [];
    for (let i = 0; i < nivel + 1; i++) {
        juego.agentes.push({
            x: Math.random() * DOM.canvas.width,
            y: Math.random() * DOM.canvas.height,
            velocidad: config.velocidadAgentes
        });
    }
}

function loopJuego() {
    if (!juego.activo) return;

    DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    DOM.ctx.drawImage(imagenes.milei, juego.posX, juego.posY, 60, 60);

    juego.agentes.forEach(agente => {
        DOM.ctx.drawImage(imagenes.fbi, agente.x, agente.y, 50, 50);
    });

    requestAnimationFrame(loopJuego);
}

function mover(direccion) {
    if (!juego.activo) return;

    const paso = 20;
    switch(direccion) {
        case 'up': juego.posY = Math.max(0, juego.posY - paso); break;
        case 'down': juego.posY = Math.min(DOM.canvas.height - 60, juego.posY + paso); break;
        case 'left': juego.posX = Math.max(0, juego.posX - paso); break;
        case 'right': juego.posX = Math.min(DOM.canvas.width - 60, juego.posX + paso); break;
    }
    sonidos.movimiento.play();
}

function reiniciar() {
    location.reload();
}

function cargarImagen(nombre) {
    const img = new Image();
    img.src = `img/${nombre}`;
    return img;
}
