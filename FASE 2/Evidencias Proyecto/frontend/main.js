// main.js

// Configuración de la app (si es necesario)
const app = {
    init: function() {
        this.bindEvents();
    },
    
    bindEvents: function() {
        // Aquí puedes asociar eventos como clics o interacciones con elementos de la UI
        document.getElementById("myButton").addEventListener("click", this.handleClick);
    },
    
    handleClick: function() {
        alert("¡Botón presionado!");
    }
};

// Iniciar la app
app.init();
