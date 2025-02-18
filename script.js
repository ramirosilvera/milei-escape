document.addEventListener("DOMContentLoaded", function() {
    let canvas = document.getElementById("gameCanvas");
    let ctx = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 400;

    let milei = new Image();
    milei.src = "milei.png"; // Asegúrate de que el nombre coincida con la imagen que subiste

    milei.onload = function() {
        ctx.drawImage(milei, 50, 50, 64, 64); // Dibuja la imagen en la pantalla
    };
});
