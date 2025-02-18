// Configuración del Juego
const config = {
    niveles: [
        { agentes: 2, objetos: 5, tiempo: 60 },
        { agentes: 3, objetos: 7, tiempo: 45 },
        { agentes: 4, objetos: 10, tiempo: 30 }
    ],
    velocidadAgentes: 1500,
    radioDeteccion: 150
};

// Estado del Juego
let juego = {
    nivelActual: 0,
    apoyo: 100,
    pistasFBI: 0,
    posicionMilei: { x: 50, y: 50 },
    agentes: [],
    objetos: [],
    intervaloAgentes: null,
    intervaloEventos: null
};

// Elementos del DOM
const elementos = {
    apoyo: document.getElementById('apoyo-popular'),
    pistas: document.getElementById('pistas-fbi'),
    nivel: document.getElementById('nivel-actual'),
    barraProgreso: document.getElementById('progreso-fbi'),
    contenedorJuego: document.getElementById('game-container')
};

// Sonidos
const sonidos = {
    recolectar: new Audio('sounds/coin.wav'),
    alerta: new Audio('sounds/sirena.wav'),
    movimiento: new Audio('sounds/click.wav')
};

// Inicialización del Juego
function iniciarJuego() {
    document.getElementById('pantalla-inicio').classList.add('oculto');
    document.getElementById('juego').classList.remove('oculto');
    cargarNivel(config.niveles[juego.nivelActual]);
}

// Sistema de Niveles
function cargarNivel(nivel) {
    // Limpiar nivel anterior
    juego.agentes.forEach(agente => agente.remove());
    juego.objetos.forEach(objeto => objeto.remove());

    // Crear nuevos elementos
    crearAgentes(nivel.agentes);
    crearObjetos(nivel.objetos);
    actualizarUI();

    // Lógica de agentes
    juego.intervaloAgentes = setInterval(moverAgentes, config.velocidadAgentes);
    juego.intervaloEventos = setInterval(generarEvento, 10000);
}

// Inteligencia de Agentes (Algoritmo de persecución mejorado)
function moverAgentes() {
    juego.agentes.forEach(agente => {
        const objetivo = Math.random() < 0.7 ? juego.posicionMilei : posicionAleatoria();
        const dx = objetivo.x - parseInt(agente.style.left);
        const dy = objetivo.y - parseInt(agente.style.top);
        
        agente.style.left = (parseInt(agente.style.left) + (dx/Math.abs(dx)*10) + 'px';
        agente.style.top = (parseInt(agente.style.top) + (dy/Math.abs(dy)*10) + 'px';

        verificarColision(agente);
    });
}

// Sistema de Objetos y Eventos
function crearObjetos(cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const objeto = document.createElement('img');
        objeto.src = Math.random() < 0.7 ? 'img/moneda.png' : 'img/documento.png';
        objeto.className = 'objeto';
        posicionarElemento(objeto);
        objeto.onclick = () => recolectarObjeto(objeto);
        juego.objetos.push(objeto);
        elementos.contenedorJuego.appendChild(objeto);
    }
}

// Sistema de Colisiones
function verificarColision(elemento) {
    const rectMilei = document.getElementById('milei').getBoundingClientRect();
    const rectElemento = elemento.getBoundingClientRect();

    if (rectMilei.left < rectElemento.right &&
        rectMilei.right > rectElemento.left &&
        rectMilei.top < rectElemento.bottom &&
        rectMilei.bottom > rectElemento.top) {
        
        if (elemento.classList.contains('agente-fbi')) {
            manejarColisionAgente();
        }
    }
}

// Sistema de Eventos Aleatorios
function generarEvento() {
    const eventos = [
        { tipo: 'noticia', mensaje: "📰 Nueva filtración en Twitter!", efecto: -15 },
        { tipo: 'ayuda', mensaje: "🦉 Laje viene a ayudar!", efecto: +20 },
        { tipo: 'trampa', mensaje: "⚠️ Activaron una trampa!", efecto: -30 }
    ];

    const evento = eventos[Math.floor(Math.random() * eventos.length)];
    juego.apoyo += evento.efecto;
    mostrarMensaje(evento.mensaje);
    actualizarUI();
}

// Sistema de Fin del Juego
function terminarJuego(victoria) {
    clearInterval(juego.intervaloAgentes);
    clearInterval(juego.intervaloEventos);
    
    const pantallaFin = document.getElementById('pantalla-fin');
    pantallaFin.classList.remove('oculto');
    document.getElementById('titulo-fin').textContent = victoria ? "¡Escape Exitoso!" : "¡Capturado!";
    document.getElementById('mensaje-fin').textContent = victoria ? 
        "Lograste escapar con la evidencia" : 
        "El FBI acumuló demasiadas pistas";
}

// Funciones Auxiliares
function posicionAleatoria() {
    return {
        x: Math.random() * (elementos.contenedorJuego.offsetWidth - 50),
        y: Math.random() * (elementos.contenedorJuego.offsetHeight - 50)
    };
}

function actualizarUI() {
    elementos.apoyo.textContent = juego.apoyo;
    elementos.pistas.textContent = juego.pistasFBI;
    elementos.barraProgreso.style.width = (juego.pistasFBI * 10) + '%';
}
