const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Crear el objeto Milei
const milei = new Image();
milei.src = "https://ramirosilvera.github.io/milei-escape/milei.png";

// Posición inicial de Milei
let mileiX = 50;
let mileiY = 50;
const velocidad = 5; // Velocidad de movimiento

// Tamaño de la imagen de Milei
const mileiWidth = 50;
const mileiHeight = 50;

// Dibujar el personaje en el canvas
milei.onload = function () {
    ctx.drawImage(milei, mileiX, mileiY, mileiWidth, mileiHeight);
};

// Funciones para mover a Milei
function moverIzquierda() {
    if (mileiX > 0) {
        mileiX -= velocidad;
        actualizarPosicion();
    }
}

function moverDerecha() {
    if (mileiX < canvas.width - mileiWidth) {
        mileiX += velocidad;
        actualizarPosicion();
    }
}

function moverArriba() {
    if (mileiY > 0) {
        mileiY -= velocidad;
        actualizarPosicion();
    }
}

function moverAbajo() {
    if (mileiY < canvas.height - mileiHeight) {
        mileiY += velocidad;
        actualizarPosicion();
    }
}

// Función para actualizar la posición
function actualizarPosicion() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas
    ctx.drawImage(milei, mileiX, mileiY, mileiWidth, mileiHeight); // Volver a dibujar a Milei en la nueva posición
}

// Asignar eventos a los botones
document.getElementById("leftBtn").addEventListener("click", moverIzquierda);
document.getElementById("rightBtn").addEventListener("click", moverDerecha);
document.getElementById("upBtn").addEventListener("click", moverArriba);
document.getElementById("downBtn").addEventListener("click", moverAbajo);
