document.getElementById('miFormulario').addEventListener('submit', function (event) {
    event.preventDefault();

    const formulario = this;
    const datos = new FormData(formulario);
    const cartel = document.getElementById('cartelExito');

    fetch(formulario.action, {
        method: 'POST',
        body: datos,
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                cartel.style.display = 'block';
                formulario.reset();
            } else {
                alert('Hubo un problema al enviar el formulario. Inténtalo de nuevo.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocurrió un error de red. Inténtalo más tarde.');
        });
});