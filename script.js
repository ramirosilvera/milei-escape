document.addEventListener("DOMContentLoaded", function() {
    let canvas = document.getElementById("gameCanvas");
    let ctx = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 400;

    ctx.fillStyle = "blue";
    ctx.fillRect(50, 50, 50, 50); // Dibuja un cuadrado de prueba
});
