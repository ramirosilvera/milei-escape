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

// Sistema de Sonido
const sonidos = {
    movimiento: new Audio('sounds/click.wav'),
    alerta: new Audio('sounds/sirena.wav'),
    moneda: new Audio('sounds/coin.wav')
};

// Funciones Principales
function iniciarJuego() {
    DOM.inicio.style.display = 'none';
    DOM.juego.style.display = 'block';
    juego.activo = true;
    cargarNivel(juego.nivel);
    actualizarUI();
    loopJuego();
}

function cargarNivel(nivel) {
    // Limpiar nivel anterior
    juego.agentes = [];
    juego.objetos = [];

    // Crear agentes
    for (let i = 0; i < nivel + 1; i++) {
        juego.agentes.push({
            x: Math.random() * DOM.canvas.width,
            y: Math.random() * DOM.canvas.height,
            velocidad: config.velocidadAgentes
        });
    }

    // Crear objetos
    const tipos = ['moneda', 'documento', 'trampa'];
    for (let i = 0; i < nivel * 3; i++) {
        juego.objetos.push({
            x: Math.random() * DOM.canvas.width,
            y: Math.random() * DOM.canvas.height,
            tipo: tipos[i % 3]
        });
    }
}

function loopJuego() {
    if (!juego.activo) return;

    // Limpiar canvas
    DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);

    // Dibujar Milei
    DOM.ctx.drawImage(cargarImagen('milei'), juego.posX, juego.posY, 60, 60);

    // Dibujar agentes
    juego.agentes.forEach(agente => {
        DOM.ctx.drawImage(cargarImagen('fbi'), agente.x, agente.y, 50, 50);
        moverAgente(agente);
        verificarColision(agente);
    });

    // Dibujar objetos
    juego.objetos.forEach(objeto => {
        DOM.ctx.drawImage(cargarImagen(objeto.tipo), objeto.x, objeto.y, 35, 35);
    });

    // Siguiente frame
    requestAnimationFrame(loopJuego);
}

function moverAgente(agente) {
    const dx = juego.posX - agente.x;
    const dy = juego.posY - agente.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < config.radioDeteccion) {
        const angulo = Math.atan2(dy, dx);
        agente.x += Math.cos(angulo) * agente.velocidad;
        agente.y += Math.sin(angulo) * agente.velocidad;
    } else {
        agente.x += (Math.random() - 0.5) * 2;
        agente.y += (Math.random() - 0.5) * 2;
    }

    // Mantener dentro del canvas
    agente.x = Math.max(0, Math.min(DOM.canvas.width - 50, agente.x));
    agente.y = Math.max(0, Math.min(DOM.canvas.height - 50, agente.y));
}

function verificarColision(agente) {
    const distancia = Math.sqrt((juego.posX - agente.x) ** 2 + (juego.posY - agente.y) ** 2);
    if (distancia < 50) {
        manejarColisionAgente();
    }
}

function manejarColisionAgente() {
    juego.pistasFBI += 2;
    sonidos.alerta.play();
    actualizarUI();

    if (juego.pistasFBI >= 10) {
        terminarJuego(false);
    }
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

function actualizarUI() {
    DOM.nivel.textContent = juego.nivel;
    DOM.apoyo.textContent = juego.apoyo;
    DOM.pistas.textContent = juego.pistasFBI;

    if (juego.apoyo <= 0) terminarJuego(false);
}

function terminarJuego(victoria) {
    juego.activo = false;
    DOM.juego.style.display = 'none';
    DOM.fin.style.display = 'block';
    DOM.resultado.textContent = victoria ? '¡Escape Exitoso!' : '¡Capturado!';
}

function reiniciar() {
    location.reload();
}

// Cargar imágenes
function cargarImagen(nombre) {
    const img = new Image();
    img.src = `img/${nombre}.png`;
    return img;
}
