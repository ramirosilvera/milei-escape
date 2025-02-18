// Configuración del Juego
const config = {
    niveles: [
        { agentes: 2, objetos: 5, tiempo: 60 },
        { agentes: 3, objetos: 7, tiempo: 45 },
        { agentes: 4, objetos: 10, tiempo: 30 }
    ],
    velocidadAgentes: 1000,
    radioDeteccion: 150,
    tamañoMapa: { ancho: 800, alto: 500 }
};

// Estado del Juego
let juego = {
    nivelActual: 0,
    apoyo: 100,
    pistasFBI: 0,
    posicionMilei: { x: 50, y: 50 },
    agentes: [],
    objetos: [],
    intervalos: [],
    activo: false
};

// Elementos del DOM
const elementos = {
    apoyo: document.getElementById('apoyo-popular'),
    pistas: document.getElementById('pistas-fbi'),
    nivel: document.getElementById('nivel-actual'),
    barraProgreso: document.getElementById('progreso-fbi'),
    contenedorJuego: document.getElementById('game-container'),
    milei: document.getElementById('milei'),
    pantallaInicio: document.getElementById('pantalla-inicio'),
    pantallaJuego: document.getElementById('juego'),
    pantallaFin: document.getElementById('pantalla-fin')
};

// Sonidos
const sonidos = {
    recolectar: new Audio('sounds/coin.wav'),
    alerta: new Audio('sounds/sirena.wav'),
    movimiento: new Audio('sounds/click.wav')
};

// Funciones principales
function iniciarJuego() {
    elementos.pantallaInicio.classList.add('oculto');
    elementos.pantallaJuego.classList.remove('oculto');
    juego.activo = true;
    cargarNivel(config.niveles[juego.nivelActual]);
    iniciarLoopJuego();
}

function cargarNivel(nivel) {
    // Reiniciar estado
    juego.agentes.forEach(agente => agente.remove());
    juego.objetos.forEach(objeto => objeto.remove());
    juego.agentes = [];
    juego.objetos = [];

    // Configurar nuevo nivel
    elementos.nivel.textContent = juego.nivelActual + 1;
    crearAgentes(nivel.agentes);
    crearObjetos(nivel.objetos);
    posicionarElemento(elementos.milei, juego.posicionMilei);
}

function crearAgentes(cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const agente = document.createElement('img');
        agente.src = 'img/fbi.png';
        agente.className = 'agente-fbi';
        posicionarElemento(agente);
        juego.agentes.push(agente);
        elementos.contenedorJuego.appendChild(agente);
    }
}

function crearObjetos(cantidad) {
    const tipos = ['moneda', 'documento', 'trampa'];
    for (let i = 0; i < cantidad; i++) {
        const objeto = document.createElement('img');
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        objeto.src = `img/${tipo}.png`;
        objeto.className = 'objeto';
        objeto.dataset.tipo = tipo;
        posicionarElemento(objeto);
        juego.objetos.push(objeto);
        elementos.contenedorJuego.appendChild(objeto);
    }
}

function posicionarElemento(elemento, posicion = null) {
    if (!posicion) {
        posicion = {
            x: Math.random() * (config.tamañoMapa.ancho - 50),
            y: Math.random() * (config.tamañoMapa.alto - 50)
        };
    }
    elemento.style.left = `${posicion.x}px`;
    elemento.style.top = `${posicion.y}px`;
}

function moverAgentes() {
    juego.agentes.forEach(agente => {
        const posAgente = {
            x: parseInt(agente.style.left),
            y: parseInt(agente.style.top)
        };
        
        // Movimiento inteligente hacia Milei
        const dx = juego.posicionMilei.x - posAgente.x;
        const dy = juego.posicionMilei.y - posAgente.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia < config.radioDeteccion) {
            const velocidad = 3;
            const angulo = Math.atan2(dy, dx);
            agente.style.left = `${posAgente.x + Math.cos(angulo) * velocidad}px`;
            agente.style.top = `${posAgente.y + Math.sin(angulo) * velocidad}px`;
        } else {
            // Movimiento aleatorio
            agente.style.left = `${posAgente.x + (Math.random() * 6 - 3)}px`;
            agente.style.top = `${posAgente.y + (Math.random() * 6 - 3)}px`;
        }

        mantenerEnMapa(agente);
        verificarColision(agente);
    });
}

function mantenerEnMapa(elemento) {
    const x = Math.max(0, Math.min(parseInt(elemento.style.left), config.tamañoMapa.ancho - 50));
    const y = Math.max(0, Math.min(parseInt(elemento.style.top), config.tamañoMapa.alto - 50));
    elemento.style.left = `${x}px`;
    elemento.style.top = `${y}px`;
}

function verificarColision(agente) {
    const rectMilei = elementos.milei.getBoundingClientRect();
    const rectAgente = agente.getBoundingClientRect();

    if (rectMilei.left < rectAgente.right &&
        rectMilei.right > rectAgente.left &&
        rectMilei.top < rectAgente.bottom &&
        rectMilei.bottom > rectAgente.top) {
        manejarColisionAgente();
    }
}

function manejarColisionAgente() {
    juego.pistasFBI += 2;
    sonidos.alerta.play();
    actualizarUI();
    mostrarMensaje("¡Agente del FBI te ha detectado!", 2000);
    
    if (juego.pistasFBI >= 10) {
        terminarJuego(false);
    }
}

function iniciarLoopJuego() {
    const loop = setInterval(() => {
        if (!juego.activo) return;
        
        // Verificar objetos
        juego.objetos.forEach((objeto, index) => {
            const rectObjeto = objeto.getBoundingClientRect();
            const rectMilei = elementos.milei.getBoundingClientRect();

            if (rectMilei.left < rectObjeto.right &&
                rectMilei.right > rectObjeto.left &&
                rectMilei.top < rectObjeto.bottom &&
                rectMilei.bottom > rectObjeto.top) {
                manejarObjeto(objeto, index);
            }
        });

        // Actualizar UI
        actualizarUI();
    }, 100);

    juego.intervalos.push(loop);
}

function manejarObjeto(objeto, index) {
    const tipo = objeto.dataset.tipo;
    sonidos.recolectar.play();

    switch(tipo) {
        case 'moneda':
            juego.apoyo = Math.min(100, juego.apoyo + 15);
            break;
        case 'documento':
            juego.pistasFBI = Math.max(0, juego.pistasFBI - 1);
            break;
        case 'trampa':
            juego.apoyo = Math.max(0, juego.apoyo - 20);
            break;
    }

    objeto.remove();
    juego.objetos.splice(index, 1);
    actualizarUI();
}

function actualizarUI() {
    elementos.apoyo.textContent = juego.apoyo;
    elementos.pistas.textContent = juego.pistasFBI;
    elementos.barraProgreso.style.width = `${juego.pistasFBI * 10}%`;

    if (juego.apoyo <= 0) {
        terminarJuego(false);
    }
}

function terminarJuego(victoria) {
    juego.activo = false;
    juego.intervalos.forEach(clearInterval);
    elementos.pantallaFin.classList.remove('oculto');
    elementos.pantallaJuego.classList.add('oculto');
    
    document.getElementById('titulo-fin').textContent = victoria ? 
        "¡Escape Exitoso!" : "¡Capturado!";
    document.getElementById('mensaje-fin').textContent = victoria ?
        "Lograste escapar con la evidencia" :
        "Demasiadas pistas acumuladas por el FBI";
}

function reiniciarJuego() {
    elementos.pantallaFin.classList.add('oculto');
    juego = {
        ...juego,
        nivelActual: 0,
        apoyo: 100,
        pistasFBI: 0,
        agentes: [],
        objetos: [],
        intervalos: [],
        activo: false
    };
    iniciarJuego();
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
    juego.intervalos.push(setInterval(moverAgentes, 100));
});

// Movimiento del jugador
function mover(direccion) {
    if (!juego.activo) return;

    const velocidad = 20;
    switch(direccion) {
        case 'up':
            juego.posicionMilei.y = Math.max(0, juego.posicionMilei.y - velocidad);
            break;
        case 'down':
            juego.posicionMilei.y = Math.min(config.tamañoMapa.alto - 50, juego.posicionMilei.y + velocidad);
            break;
        case 'left':
            juego.posicionMilei.x = Math.max(0, juego.posicionMilei.x - velocidad);
            break;
        case 'right':
            juego.posicionMilei.x = Math.min(config.tamañoMapa.ancho - 50, juego.posicionMilei.x + velocidad);
            break;
    }
    elementos.milei.style.left = `${juego.posicionMilei.x}px`;
    elementos.milei.style.top = `${juego.posicionMilei.y}px`;
    sonidos.movimiento.play();
}

function mostrarMensaje(texto, duracion = 2000) {
    const mensaje = document.createElement('div');
    mensaje.className = 'mensaje-flotante';
    mensaje.textContent = texto;
    elementos.contenedorJuego.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.remove();
    }, duracion);
}
