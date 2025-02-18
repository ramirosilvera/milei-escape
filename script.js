// Configuración del Juego
const config = {
    niveles: 3,
    velocidadAgentes: 1.5,
    radioDeteccion: 150
};

// Estado del Juego
let juego = {
    nivel: 1,
    apoyo: 100,
    pistasFBI: 0,
    posX: 50,
    posY: 50,
    agentes: [],
    objetos: [],
    activo: false
};

// Elementos DOM
const DOM = {
    inicio: document.getElementById('pantalla-inicio'),
    juego: document.getElementById('juego'),
    fin: document.getElementById('pantalla-fin'),
    milei: document.getElementById('milei'),
    nivel: document.getElementById('nivel'),
    apoyo: document.getElementById('apoyo'),
    pistas: document.getElementById('pistas'),
    resultado: document.getElementById('resultado')
};

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
}

function cargarNivel(nivel) {
    // Crear agentes
    for (let i = 0; i < nivel + 1; i++) {
        const agente = document.createElement('img');
        agente.src = 'img/fbi.png';
        agente.className = 'agente-fbi';
        agente.style.left = Math.random() * 700 + 'px';
        agente.style.top = Math.random() * 400 + 'px';
        DOM.gameContainer.appendChild(agente);
        juego.agentes.push(agente);
    }
    
    // Crear objetos
    const tipos = ['moneda', 'documento', 'trampa'];
    for (let i = 0; i < nivel * 3; i++) {
        const objeto = document.createElement('img');
        objeto.src = `img/${tipos[i % 3]}.png`;
        objeto.className = 'objeto';
        objeto.style.left = Math.random() * 750 + 'px';
        objeto.style.top = Math.random() * 450 + 'px';
        objeto.onclick = () => recolectarObjeto(objeto);
        DOM.gameContainer.appendChild(objeto);
        juego.objetos.push(objeto);
    }
}

function mover(direccion) {
    if (!juego.activo) return;
    
    const paso = 20;
    switch(direccion) {
        case 'up': juego.posY = Math.max(0, juego.posY - paso); break;
        case 'down': juego.posY = Math.min(440, juego.posY + paso); break;
        case 'left': juego.posX = Math.max(0, juego.posX - paso); break;
        case 'right': juego.posX = Math.min(740, juego.posX + paso); break;
    }
    
    DOM.milei.style.left = juego.posX + 'px';
    DOM.milei.style.top = juego.posY + 'px';
    sonidos.movimiento.play();
    verificarColisiones();
}

function verificarColisiones() {
    // Colisión con agentes
    juego.agentes.forEach(agente => {
        const rectAgente = agente.getBoundingClientRect();
        const rectMilei = DOM.milei.getBoundingClientRect();
        
        if (rectAgente.left < rectMilei.right && 
            rectAgente.right > rectMilei.left && 
            rectAgente.top < rectMilei.bottom && 
            rectAgente.bottom > rectMilei.top) {
            manejarColisionAgente();
        }
    });
}

function manejarColisionAgente() {
    juego.pistasFBI += 2;
    sonidos.alerta.play();
    actualizarUI();
    
    if (juego.pistasFBI >= 10) {
        terminarJuego(false);
    }
}

function recolectarObjeto(objeto) {
    const tipo = objeto.src.split('/').pop().replace('.png', '');
    
    switch(tipo) {
        case 'moneda':
            juego.apoyo = Math.min(100, juego.apoyo + 15);
            sonidos.moneda.play();
            break;
        case 'documento':
            juego.pistasFBI = Math.max(0, juego.pistasFBI - 1);
            break;
        case 'trampa':
            juego.apoyo = Math.max(0, juego.apoyo - 20);
            break;
    }
    
    objeto.remove();
    actualizarUI();
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
