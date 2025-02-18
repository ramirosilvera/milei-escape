let apoyoPopular = 100;  // Comienza con un apoyo del 100%
let pistasFBI = 0;
let mileiPosition = { x: 50, y: 10 };  // Posición inicial de Milei

function actualizarApoyo(cantidad) {
    apoyoPopular += cantidad;
    if (apoyoPopular > 100) apoyoPopular = 100;
    if (apoyoPopular < 0) apoyoPopular = 0;
    document.getElementById("apoyo-popular").innerText = "Apoyo Popular: " + apoyoPopular + "%";
}

function agregarPista() {
    pistasFBI++;
    document.getElementById("pistas-fbi").innerText = "Pistas del FBI: " + pistasFBI;
}

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
}

function tweetDefensivo() {
    actualizarApoyo(5);  // Aumenta el apoyo en 5%
    // Código adicional para el tweet defensivo...
}

function tweetControversial() {
    actualizarApoyo(-10);  // Disminuye el apoyo en 10%
    // Código adicional para el tweet controversial...
}

function eventoAleatorio() {
    const evento = Math.floor(Math.random() * 3);  // Elegir entre 3 eventos aleatorios

    switch (evento) {
        case 0:
            // Encuentro con un aliado
            agregarPista();
            break;
        case 1:
            // Protestas de inversores
            actualizarApoyo(-5);  // Disminuye el apoyo
            break;
        case 2:
            // Nota de prensa negativa
            agregarPista();
            break;
    }
}
