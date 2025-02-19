const config = {
    velocidadMilei: 5,
    velocidadFBI: 1,
    radioDeteccion: 150,
    tamañoCanvas: { ancho: 800, alto: 500 }
};

let juego = {
    activo: false,
    nivel: 1,
    apoyo: 100,
    pistasFBI: 0,
    milei: { x: 400, y: 250 },
    agentes: []
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
    ctx: document.getElementById('game-canvas').getContext('2d')
};

DOM.canvas.width = config.tamañoCanvas.ancho;
DOM.canvas.height = config.tamañoCanvas.alto;

function iniciarJuego() {
    DOM.inicio.style.display = 'none';
    DOM.juego.style.display = 'block';
    DOM.fin.style.display = 'none';

    juego.activo = true;
    juego.nivel = 1;
    juego.pistasFBI = 0;
    juego.apoyo = 100;
    juego.milei = { x: 400, y: 250 };
    juego.agentes = [];

    cargarAgentes();
    actualizarUI();
    loopJuego();
}

function cargarAgentes() {
    for (let i = 0; i < juego.nivel + 2; i++) {
        let posX, posY;
        do {
            posX = Math.random() * DOM.canvas.width;
            posY = Math.random() * DOM.canvas.height;
        } while (Math.abs(posX - juego.milei.x) < 100 && Math.abs(posY - juego.milei.y) < 100);

        juego.agentes.push({ x: posX, y: posY });
    }
}

function loopJuego() {
    if (!juego.activo) return;

    DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);

    // Dibujar Milei
    DOM.ctx.fillStyle = 'blue';
    DOM.ctx.fillRect(juego.milei.x, juego.milei.y, 50, 50);

    // Dibujar agentes
    DOM.ctx.fillStyle = 'red';
    juego.agentes.forEach(agente => {
        DOM.ctx.fillRect(agente.x, agente.y, 50, 50);
        moverAgente(agente);
        verificarColision(agente);
    });

    requestAnimationFrame(loopJuego);
}

function moverAgente(agente) {
    const dx = juego.milei.x - agente.x;
    const dy = juego.milei.y - agente.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < config.radioDeteccion) {
        agente.x += (dx / distancia) * config.velocidadFBI;
        agente.y += (dy / distancia) * config.velocidadFBI;
    }
}

function verificarColision(agente) {
    if (Math.abs(juego.milei.x - agente.x) < 50 && Math.abs(juego.milei.y - agente.y) < 50) {
        terminarJuego(false);
    }
}

function mover(direccion) {
    const paso = config.velocidadMilei;
    if (direccion === 'up') juego.milei.y = Math.max(0, juego.milei.y - paso);
    if (direccion === 'down') juego.milei.y = Math.min(DOM.canvas.height - 50, juego.milei.y + paso);
    if (direccion === 'left') juego.milei.x = Math.max(0, juego.milei.x - paso);
    if (direccion === 'right') juego.milei.x = Math.min(DOM.canvas.width - 50, juego.milei.x + paso);
}

function terminarJuego() {
    juego.activo = false;
    DOM.juego.style.display = 'none';
    DOM.fin.style.display = 'block';
}

function reiniciar() {
    location.reload();
}
