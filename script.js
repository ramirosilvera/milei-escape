// Definir variables
let canvas, ctx;
let milei, fbiAgents, monedas, trampas, documentos;
let imgMilei, imgFBI, imgMoneda, imgTrampa, imgDocumento, imgFondo;
let sonidoClick, sonidoMoneda, sonidoMusica, sonidoNotificacion, sonidoSirena;

// Configuración inicial
const CONFIG = {
    velocidadMilei: 5,
    velocidadFBI: 2,
    cantidadFBI: 3,
    cantidadMonedas: 5,
    cantidadTrampas: 2,
    cantidadDocumentos: 3
};

// Función para cargar recursos (imágenes y sonidos)
function cargarRecursos() {
    imgMilei = new Image();
    imgMilei.src = "img/milei.png";

    imgFBI = new Image();
    imgFBI.src = "img/fbi.png";

    imgMoneda = new Image();
    imgMoneda.src = "img/moneda.png";

    imgTrampa = new Image();
    imgTrampa.src = "img/trampa.png";

    imgDocumento = new Image();
    imgDocumento.src = "img/documento.png";

    imgFondo = new Image();
    imgFondo.src = "img/fondo.png";

    sonidoClick = new Audio("sounds/click.wav");
    sonidoMoneda = new Audio("sounds/coin.wav");
    sonidoMusica = new Audio("sounds/musica-fondo.wav");
    sonidoNotificacion = new Audio("sounds/notification.wav");
    sonidoSirena = new Audio("sounds/sirena.wav");

    sonidoMusica.loop = true; // La música de fondo se repite en bucle
}

// Función para iniciar el juego
function iniciarJuego() {
    document.getElementById("pantalla-inicio").style.display = "none";
    document.getElementById("juego").style.display = "block";
    
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 500;

    // Reproducir música de fondo
    sonidoMusica.play();

    // Crear objetos del juego
    milei = { x: 400, y: 250, ancho: 50, alto: 50 };
    fbiAgents = [];
    monedas = [];
    trampas = [];
    documentos = [];

    for (let i = 0; i < CONFIG.cantidadFBI; i++) {
        fbiAgents.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    }

    for (let i = 0; i < CONFIG.cantidadMonedas; i++) {
        monedas.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    }

    for (let i = 0; i < CONFIG.cantidadTrampas; i++) {
        trampas.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    }

    for (let i = 0; i < CONFIG.cantidadDocumentos; i++) {
        documentos.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    }

    // Iniciar el bucle del juego
    requestAnimationFrame(actualizarJuego);
}

// Función para actualizar el juego
function actualizarJuego() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo
    ctx.drawImage(imgFondo, 0, 0, canvas.width, canvas.height);

    // Dibujar Milei
    ctx.drawImage(imgMilei, milei.x, milei.y, milei.ancho, milei.alto);

    // Dibujar FBI
    fbiAgents.forEach(agent => {
        ctx.drawImage(imgFBI, agent.x, agent.y, 50, 50);
        moverFBI(agent);
    });

    // Dibujar monedas
    monedas.forEach(moneda => {
        ctx.drawImage(imgMoneda, moneda.x, moneda.y, 30, 30);
    });

    // Dibujar trampas
    trampas.forEach(trampa => {
        ctx.drawImage(imgTrampa, trampa.x, trampa.y, 40, 40);
    });

    // Dibujar documentos
    documentos.forEach(doc => {
        ctx.drawImage(imgDocumento, doc.x, doc.y, 40, 40);
    });

    requestAnimationFrame(actualizarJuego);
}

// Función para mover FBI
function moverFBI(agent) {
    let dx = milei.x - agent.x;
    let dy = milei.y - agent.y;
    let distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < 200) { // Si Milei está cerca, el FBI lo persigue
        agent.x += (dx / distancia) * CONFIG.velocidadFBI;
        agent.y += (dy / distancia) * CONFIG.velocidadFBI;
    }

    if (distancia < 30) {
        sonidoSirena.play();
        terminarJuego(false);
    }
}

// Función para mover a Milei
function mover(direccion) {
    sonidoClick.play();
    if (direccion === "up" && milei.y > 0) milei.y -= CONFIG.velocidadMilei;
    if (direccion === "down" && milei.y < canvas.height - milei.alto) milei.y += CONFIG.velocidadMilei;
    if (direccion === "left" && milei.x > 0) milei.x -= CONFIG.velocidadMilei;
    if (direccion === "right" && milei.x < canvas.width - milei.ancho) milei.x += CONFIG.velocidadMilei;
}

// Función para finalizar el juego
function terminarJuego(gano) {
    document.getElementById("juego").style.display = "none";
    document.getElementById("pantalla-fin").style.display = "block";
    document.getElementById("resultado").innerText = gano ? "¡Escapaste del FBI!" : "Te atraparon 😱";
    sonidoMusica.pause();
}

// Función para reiniciar el juego
function reiniciar() {
    location.reload();
}

// Cargar imágenes y sonidos antes de empezar
cargarRecursos();
