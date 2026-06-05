document.addEventListener('DOMContentLoaded', () => {
    const contenedorReloj = document.getElementById('reloj-digital');
    const contenedorClima = document.getElementById('clima-digital');

    
    function actualizarReloj() {
        const tiempoActual = new Date();
        const hora = String(tiempoActual.getHours()).padStart(2, '0');
        const minutos = String(tiempoActual.getMinutes()).padStart(2, '0');
        
        contenedorReloj.textContent = `${hora}:${minutos}`;
    }


    function actualizarClima() {

        contenedorClima.textContent = "22°C Despejado";
    }

    actualizarReloj();
    actualizarClima();


    setInterval(actualizarReloj, 1000);
});