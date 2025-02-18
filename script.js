const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Crear el objeto Milei
const milei = new Image();
milei.src = "https://ramirosilvera.github.io/milei-escape/milei.png";

// Posición inicial de Milei
let mileiX = 50;
let mileiY = 50;
const velocidad = 5; // Velocidad de movimiento

// Dibujar el personaje en el canvas
milei.onload = function () {
    ctx.drawImage(milei, mileiX, mileiY, 50, 50);
};

// Detectar teclas presionadas
document.addEventListener("keydown", function (event) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas

    if (event.key === "ArrowRight") {
        mileiX += velocidad;
    } else if (event.key === "ArrowLeft") {
        mileiX -= velocidad;
    } else if (event.key === "ArrowUp") {
        mileiY -= velocidad;
    } else if (event.key === "ArrowDown") {
        mileiY += velocidad;
    }

    // Volver a dibujar a Milei en la nueva posición
    ctx.drawImage(milei, mileiX, mileiY, 50, 50);
});
