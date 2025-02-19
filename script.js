const config = {
    niveles: 3,
    velocidadBaseFBI: 0.5,
    radioDeteccion: 150,
    tamañoCanvas: { ancho: 800, alto: 500 }
};

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

DOM.ctx = DOM.canvas.getContext('2d');
DOM.canvas.width = config.tamañoCanvas.ancho;
DOM.canvas.height = config.tamañoCanvas.alto;

function iniciarJuego() {
    DOM.inicio.style.display = 'none';
    DOM.juego.style.display = 'block';
    DOM.fin.style.display = 'none';

    juego.activo = true;
    juego.pistasFBI = 0;
    juego.apoyo = 100;
    juego.nivel = 1;

    cargarNivel();
    actualizarUI();
    loopJuego();
}

function cargarNivel() {
    juego.agentes = [];
    juego.objetos = [];

    for (let i = 0; i < juego.nivel; i++) {
        let posX, posY;
        do {
            posX = Math.random() * DOM.canvas.width;
            posY = Math.random() * DOM.canvas.height;
        } while (Math.abs(posX - juego.posX) < 100 && Math.abs(posY - juego.posY) < 100);

        juego.agentes.push({ x: posX, y: posY, velocidad: config.velocidadBaseFBI + juego.nivel * 0.2 });
    }
}

function loopJuego() {
    if (!juego.activo) return;

    DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);

    juego.agentes.forEach(agente => {
        DOM.ctx.fillStyle = 'red';
        DOM.ctx.fillRect(agente.x, agente.y, 50, 50);
        moverAgente(agente);
        verificarColision(agente);
    });

    DOM.ctx.fillStyle = 'blue';
    DOM.ctx.fillRect(juego.posX, juego.posY, 50, 50);

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
    }
}

function verificarColision(agente) {
    if (Math.abs(juego.posX - agente.x) < 50 && Math.abs(juego.posY - agente.y) < 50) {
        terminarJuego(false);
    }
}

function mover(direccion) {
    const paso = 20;
    if (direccion === 'up') juego.posY = Math.max(0, juego.posY - paso);
    if (direccion === 'down') juego.posY = Math.min(DOM.canvas.height - 50, juego.posY + paso);
    if (direccion === 'left') juego.posX = Math.max(0, juego.posX - paso);
    if (direccion === 'right') juego.posX = Math.min(DOM.canvas.width - 50, juego.posX + paso);
}

function terminarJuego(victoria) {
    juego.activo = false;
    DOM.juego.style.display = 'none';
    DOM.fin.style.display = 'block';
    DOM.resultado.textContent = victoria ? '¡Ganaste!' : '¡Capturado!';
}

function reiniciar() {
    location.reload();
}
