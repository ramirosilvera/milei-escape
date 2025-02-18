// Variables del juego
let apoyoPopular = 100;  // Comienza con un apoyo del 100%
let pistasFBI = 0;
let mileiPosition = { x: 50, y: 10 };  // Posición inicial de Milei

// Función para actualizar el apoyo popular
function actualizarApoyo(cantidad) {
    apoyoPopular += cantidad;
    if (apoyoPopular > 100) apoyoPopular = 100;
    if (apoyoPopular < 0) apoyoPopular = 0;
    document.getElementById("apoyo-popular").innerText = "Apoyo Popular: " + apoyoPopular + "%";
}

// Función para agregar pistas del FBI
function agregarPista() {
    pistasFBI++;
    document.getElementById("pistas-fbi").innerText = "Pistas del FBI: " + pistasFBI;
    reproducirSonido('sounds/sirena.wav'); // Sonido de sirena al agregar una pista

    // Verificar si el jugador pierde
    if (pistasFBI >= 10) {
        finDelJuego("Captura");
    }
}

// Función para mover a Milei
function mover(direccion) {
    const distancia = 10;  // Distancia en píxeles
    const gameContainer = document.getElementById("game-container");
    const milei = document.getElementById("milei");

    switch (direccion) {
        case 'up':
            if (mileiPosition.y > 0) mileiPosition.y -= distancia;
            break;
        case 'down':
            if (mileiPosition.y < gameContainer.offsetHeight - milei.offsetHeight) mileiPosition.y += distancia;
            break;
        case 'left':
            if (mileiPosition.x > 0) mileiPosition.x -= distancia;
            break;
        case 'right':
            if (mileiPosition.x < gameContainer.offsetWidth - milei.offsetWidth) mileiPosition.x += distancia;
            break;
    }

    milei.style.top = mileiPosition.y + "px";
    milei.style.left = mileiPosition.x + "px";
    reproducirSonido('sounds/click.wav'); // Sonido de clic al mover a Milei
}

// Función para publicar un tweet defensivo
function tweetDefensivo() {
    actualizarApoyo(5);  // Aumenta el apoyo en 5%
    agregarPista();  // Añade una pista del FBI
    mostrarMensaje("Has publicado un tweet defensivo. ¡El apoyo popular aumenta!");
    reproducirSonido('sounds/notification.wav'); // Sonido de notificación
}

// Función para publicar un tweet controversial
function tweetControversial() {
    actualizarApoyo(-10);  // Disminuye el apoyo en 10%
    agregarPista();  // Añade una pista del FBI
    mostrarMensaje("Has publicado un tweet controversial. ¡El apoyo popular disminuye!");
    reproducirSonido('sounds/notification.wav'); // Sonido de notificación
}

// Función para manejar eventos aleatorios
function eventoAleatorio() {
    const eventos = [
        { mensaje: "¡Reunión sospechosa detectada!", apoyo: -5, pistas: 1 },
        { mensaje: "Protestas de inversores en aumento.", apoyo: -10, pistas: 0 },
        { mensaje: "Aliado clave te apoya públicamente.", apoyo: 10, pistas: -1 }
    ];

    const evento = eventos[Math.floor(Math.random() * eventos.length)];
    actualizarApoyo(evento.apoyo);
    pistasFBI += evento.pistas;
    mostrarMensaje(evento.mensaje);
    reproducirSonido('sounds/coin.wav'); // Sonido de moneda
}

// Función para mostrar mensajes en pantalla
function mostrarMensaje(mensaje) {
    const mensajesDiv = document.getElementById("mensajes");
    mensajesDiv.innerText = mensaje;
    mensajesDiv.style.display = "block"; // Mostrar el mensaje

    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
        mensajesDiv.style.display = "none";
    }, 3000);
}

// Función para reproducir sonidos
function reproducirSonido(src) {
    const audio = new Audio(src);
    audio.play().catch(error => {
        console.error("Error al reproducir el sonido:", error);
    });
}

// Función para finalizar el juego
function finDelJuego(resultado) {
    if (resultado === "Captura") {
        mostrarMensaje("¡Has sido capturado por el FBI! Game Over.");
        reproducirSonido('sounds/sirena.wav'); // Sonido de sirena al ser capturado
    } else if (resultado === "Escape Exitoso") {
        mostrarMensaje("¡Lograste escapar! ¡Felicidades!");
        reproducirSonido('sounds/coin.wav'); // Sonido de moneda al escapar
    }
    // Reiniciar el juego o mostrar opciones...
}
