// 1. BASE DE DATOS DE EMPLEADORES
const listadoInicialPersonal = {
    "12345678": { nombre: "Juan Carlos Pérez", codigo: "EST-9942", dni: "12345678", jerarquia: "Supervisor de Turnos", profesion: "Enfermero" },
    "87654321": { nombre: "María Lorena Gómez", codigo: "EST-1158", dni: "87654321", jerarquia: "Coordinadora General", profesion: "Médico" },
    "11223344": { nombre: "Carlos Alberto Rodríguez", codigo: "EST-4421", dni: "11223344", jerarquia: "Administrativo", profesion: "Enfermero" },
    "55667788": { nombre: "Ana Beatriz López", codigo: "EST-5566", dni: "55667788", jerarquia: "Personal de Planta", profesion: "Enfermero" }
};

// 2. INICIALIZAR LOCALSTORAGE
if (!localStorage.getItem('baseDatosPersonal')) {
    localStorage.setItem('baseDatosPersonal', JSON.stringify(listadoInicialPersonal));
}
if (!localStorage.getItem('registroAsistencias')) {
    localStorage.setItem('registroAsistencias', JSON.stringify({}));
}

// 3. CAPTURA DE ELEMENTOS HTML
const inputDni = document.getElementById('buscar-dni');
const btnBuscar = document.getElementById('btn-buscar');

const infoNombre = document.getElementById('info-nombre');
const infoDni = document.getElementById('info-dni');
const infoCodigo = document.getElementById('info-codigo');
const infoJerarquia = document.getElementById('info-jerarquia');
const infoProfesion = document.getElementById('info-profesion');
const divMisDias = document.getElementById('mis-dias-guardados');

const formDias = document.getElementById('form-dias');
const cuerpoTablaPublica = document.getElementById('cuerpo-tabla-publica');
const btnSubsanar = document.getElementById('btn-subsanar');

// Restringir calendarios para no permitir fechas pasadas
const hoy = new Date().toISOString().split('T');
document.querySelectorAll('.fecha-registro-individual').forEach(input => {
    input.min = hoy[0];
});

// Cargar la tabla de vista pública apenas se abre la página
actualizarTablaPublica();

// 4. LÓGICA DE BÚSQUEDA POR DNI
btnBuscar.addEventListener('click', (evento) => {
    evento.preventDefault();
    const dniIngresado = inputDni.value.trim();
    const baseDatos = JSON.parse(localStorage.getItem('baseDatosPersonal'));
    const registroAsistencias = JSON.parse(localStorage.getItem('registroAsistencias'));

    if (baseDatos[dniIngresado]) {
        const empleado = baseDatos[dniIngresado];

        infoNombre.textContent = empleado.nombre;
        infoDni.textContent = empleado.dni;
        infoCodigo.textContent = empleado.codigo;
        infoJerarquia.textContent = empleado.jerarquia;
        infoProfesion.textContent = empleado.profesion;

        if (registroAsistencias[dniIngresado] && registroAsistencias[dniIngresado].turnos.length > 0) {
            const listado = registroAsistencias[dniIngresado].turnos.map(t => `${t.fechaFormateada} - ${t.dia} (${t.turno})`);
            divMisDias.innerHTML = `Tus turnos guardados actualmente:<br>• ${listado.join('<br>• ')}`;
        } else {
            divMisDias.textContent = "Aún no tienes turnos registrados en el sistema.";
        }

        formDias.reset();
    } else {
        alert("DNI no registrado en el sistema.");
        limpiarFicha();
    }
});

// 5. LÓGICA DE REGISTRO CON SELECTORES INDIVIDUALES
formDias.addEventListener('submit', (e) => {
    e.preventDefault();

    const dniActual = infoDni.textContent;
    const profesionActual = infoProfesion.textContent;

    if (dniActual === "-") {
        alert("Por favor, primero ingrese y busque su DNI.");
        return;
    }

    const checkboxesMarcados = document.querySelectorAll('input[name="dia-check"]:checked');
    if (checkboxesMarcados.length === 0) {
        alert("Debe marcar la casilla 'Asistir' del día que desea agendar.");
        return;
    }

    const registroAsistencias = JSON.parse(localStorage.getItem('registroAsistencias'));
    const baseDatos = JSON.parse(localStorage.getItem('baseDatosPersonal'));

    let turnosDelEmpleado = registroAsistencias[dniActual]?.turnos || [];

    for (let checkbox of checkboxesMarcados) {
        const diaNombre = checkbox.value;
        const inputFechaIndividual = document.querySelector(`.fecha-registro-individual[data-dia="${diaNombre}"]`);

        if (!inputFechaIndividual.value) {
            alert(`Por favor, seleccione una fecha en el calendario para el día ${diaNombre}.`);
            return;
        }

        // Conversión correcta de formato YYYY-MM-DD a DD/MM/YYYY
        const partesFecha = inputFechaIndividual.value.split('-');
        const fechaRealFormateada = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`;

        const selectorAsociado = document.querySelector(`.turno-select[data-dia="${diaNombre}"]`);
        const turnoElegido = selectorAsociado.value;

        // VALIDACIÓN 1: Evitar duplicados del mismo empleado
        const yaTieneEseTurno = turnosDelEmpleado.some(t => t.fechaFormateada === fechaRealFormateada && t.turno === turnoElegido);
        if (yaTieneEseTurno) {
            alert(`Ya te encuentras registrado para la fecha ${fechaRealFormateada} en el turno [${turnoElegido}].`);
            return;
        }

        // VALIDACIÓN 2: Máximo 2 profesionales por área, fecha y turno
        let contadorProfesionales = 0;

        for (let dniKey in registroAsistencias) {
            if (dniKey === dniActual) continue;

            const datosOtro = registroAsistencias[dniKey];
            const profesionOtro = baseDatos[dniKey]?.profesion;

            if (profesionOtro === profesionActual) {
                const coincideFechaYTurno = datosOtro.turnos.some(t => t.fechaFormateada === fechaRealFormateada && t.turno === turnoElegido);
                if (coincideFechaYTurno) {
                    contadorProfesionales++;
                }
            }
        }

        if (contadorProfesionales >= 3) {
            alert(`Cupo completo para la fecha ${fechaRealFormateada} en el turno [${turnoElegido}]. Ya se encuentran anotados 2 profesionales de la categoría: ${profesionActual}.`);
            return;
        }

        turnosDelEmpleado.push({
            dia: diaNombre,
            fechaFormateada: fechaRealFormateada,
            turno: turnoElegido
        });
    }

    registroAsistencias[dniActual] = {
        nombre: infoNombre.textContent,
        turnos: turnosDelEmpleado,
        ultimoRegistro: new Date().toLocaleDateString()
    };

    localStorage.setItem('registroAsistencias', JSON.stringify(registroAsistencias));

    alert("¡Agenda guardada e incorporada con éxito!");

    formDias.reset();
    limpiarFicha();
    inputDni.value = "";

    // REFRESCAR LA VISTA PÚBLICA INMEDIATAMENTE
    actualizarTablaPublica();
});

// 6. FUNCIÓN PARA CARGAR LA TABLA DE SOLO VISTA
function actualizarTablaPublica() {
    cuerpoTablaPublica.innerHTML = ""; // Limpiamos la tabla anterior

    const registroAsistencias = JSON.parse(localStorage.getItem('registroAsistencias')) || {};
    const baseDatos = JSON.parse(localStorage.getItem('baseDatosPersonal')) || {};

    let hayRegistros = false;

    // Recorremos los datos guardados en LocalStorage
    for (let dniKey in registroAsistencias) {
        const registroAgente = registroAsistencias[dniKey];
        const profesionAgente = baseDatos[dniKey]?.profesion || "No definida";

        if (registroAgente.turnos && registroAgente.turnos.length > 0) {
            hayRegistros = true;

            // Creamos una fila en la tabla por cada turno individual que tenga el empleado
            registroAgente.turnos.forEach(turno => {
                const fila = document.createElement('tr');

                fila.innerHTML = `
                    <td><strong>${registroAgente.nombre}</strong></td>
                    <td>${profesionAgente}</td>
                    <td>${turno.dia}</td>
                    <td>${turno.fechaFormateada}</td>
                    <td><span style="background: #e1f5fe; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #0288d1;">${turno.turno}</span></td>
                `;

                cuerpoTablaPublica.appendChild(fila);
            });
        }
    }

    // Si la base de datos de asistencias está vacía, mostramos un mensaje informativo
    if (!hayRegistros) {
        cuerpoTablaPublica.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #7f8c8d; padding: 20px;">
                    Ningún empleado ha registrado turnos para esta semana todavía.
                </td>
            </tr>
        `;
    }
}

function limpiarFicha() {
    infoNombre.textContent = "-";
    infoDni.textContent = "-";
    infoCodigo.textContent = "-";
    infoJerarquia.textContent = "-";
    infoProfesion.textContent = "-";
    divMisDias.textContent = "";
}

// 7. LÓGICA DEL BOTÓN EXPORTAR A EXCEL
document.getElementById('btn-excel').addEventListener('click', () => {
    const registroAsistencias = JSON.parse(localStorage.getItem('registroAsistencias')) || {};
    const baseDatos = JSON.parse(localStorage.getItem('baseDatosPersonal')) || {};
    
    if (Object.keys(registroAsistencias).length === 0) {
        alert("No hay datos registrados para exportar en este momento.");
        return;
    }

    // Estructuramos una tabla HTML real especificando codificación UTF-8 explícita para Microsoft
    let htmlExcel = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://w3.org">
    <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>Turnos Semanales</x:Name>
                        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
        </xml>
        <![endif]-->
    </head>
    <body>
        <table border="1">
            <thead>
                <tr style="background-color: #2c3e50; color: white; font-weight: bold;">
                    <th>Empleado</th>
                    <th>Profesión</th>
                    <th>Día de la Semana</th>
                    <th>Fecha Elegida</th>
                    <th>Turno Asignado</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Recorremos los datos del almacenamiento para rellenar las celdas
    for (let dniKey in registroAsistencias) {
        const registroAgente = registroAsistencias[dniKey];
        const profesionAgente = baseDatos[dniKey]?.profesion || "No definida";

        if (registroAgente.turnos && registroAgente.turnos.length > 0) {
            registroAgente.turnos.forEach(turno => {
                htmlExcel += `
                    <tr>
                        <td>${registroAgente.nombre}</td>
                        <td>${profesionAgente}</td>
                        <td>${turno.dia}</td>
                        <td>${turno.fechaFormateada}</td>
                        <td>${turno.turno}</td>
                    </tr>
                `;
            });
        }
    }

    htmlExcel += `
            </tbody>
        </table>
    </body>
    </html>
    `;

    // Convertimos el contenido estructurado en un archivo binario descargable tipo XLS
    const blob = new Blob([htmlExcel], {
        type: 'application/vnd.ms-excel;charset=utf-8;'
    });
    
    const url = URL.createObjectURL(blob);
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = url;
    
    // Al guardarlo como .xls, Excel activará su motor de importación integrado
    enlaceDescarga.download = `Planilla_Turnos_${new Date().toLocaleDateString().replace(/\//g, '-')}.xls`;
    
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    document.body.removeChild(enlaceDescarga);
});
// 8. LÓGICA DEL BOTÓN REINICIAR SEMANA (Con doble confirmación de seguridad)
document.getElementById('btn-reiniciar').addEventListener('click', () => {
    const primeraConfirmacion = confirm("⚠️ ¿Está seguro de que desea borrar todos los turnos registrados?\nEsta acción no se puede deshacer.");
    
    if (primeraConfirmacion) {
        const segundaConfirmacion = confirm("🚨 ¡Atención! Se eliminará el historial completo de la semana actual en el navegador. ¿Desea continuar de todas formas?");
        
        if (segundaConfirmacion) {
            // Vaciamos el objeto de asistencias pero MANTENEMOS la base de datos de los empleados
            localStorage.setItem('registroAsistencias', JSON.stringify({}));
            
            // Refrescamos la interfaz
            actualizarTablaPublica();
            alert("Sheduler reiniciado con éxito. El sistema quedó en cero listo para una nueva semana.");
        }
    }
});

// 9. LÓGICA INTERACTIVA PARA SUBSANAR ERRORES CON MODAL INTERNO
const modal = document.getElementById('modal-subsanar');
const cerrarModalX = document.getElementById('cerrar-modal');
const btnCerrarModalOk = document.getElementById('btn-cerrar-modal-ok');
const modalNombre = document.getElementById('modal-nombre-empleado');
const modalListaTurnos = document.getElementById('modal-lista-turnos');

// Al hacer clic en el botón general de "Subsanar Error"
btnSubsanar.addEventListener('click', () => {
    // CUADRO 1: Solicita el DNI al usuario
    const dniIngresado = prompt("Por favor, ingrese el DNI del empleado para subsanar un error:");
    
    if (dniIngresado === null) return; // Si cancela el prompt, no hace nada
    const dniLimpio = dniIngresado.trim();

    if (dniLimpio === "") {
        alert("Debe ingresar un número de DNI válido.");
        return;
    }

    const registroAsistencias = JSON.parse(localStorage.getItem('registroAsistencias')) || {};
    const baseDatos = JSON.parse(localStorage.getItem('baseDatosPersonal')) || {};

    // Validar si el DNI existe en el personal y si tiene turnos guardados
    if (!baseDatos[dniLimpio]) {
        alert("El DNI ingresado no se encuentra registrado en el sistema.");
        return;
    }
    if (!registroAsistencias[dniLimpio] || registroAsistencias[dniLimpio].turnos.length === 0) {
        alert(`El empleado ${baseDatos[dniLimpio].nombre} no posee turnos cargados para corregir.`);
        return;
    }

    // CUADRO 2: Si todo está bien, abre la ventana emergente con sus datos
    modalNombre.textContent = registroAsistencias[dniLimpio].nombre;
    modal.style.display = "flex"; // Muestra el modal en pantalla

    // Función interna para dibujar los turnos dentro de la ventana emergente
    function renderizarTurnosModal() {
        modalListaTurnos.innerHTML = ""; // Limpiamos la lista interna
        const turnosActuales = registroAsistencias[dniLimpio].turnos;

        if (turnosActuales.length === 0) {
            modalListaTurnos.innerHTML = "<p style='color: gray; text-align:center;'>No quedan turnos registrados para este empleado.</p>";
            return;
        }

        turnosActuales.forEach((turno, indice) => {
            const item = document.createElement('div');
            item.className = "item-turno-modal";
            item.innerHTML = `
                <span>📅 <strong>${turno.fechaFormateada}</strong> - ${turno.dia} (${turno.turno})</span>
                <button type="button" class="btn-eliminar-turno" data-index="${indice}">❌ Eliminar</button>
            `;
            modalListaTurnos.appendChild(item);
        });

        // Escuchar los clics de los botones de eliminación individual de turnos
        document.querySelectorAll('.btn-eliminar-turno').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                
                if (confirm(`¿Desea eliminar el turno del día ${turnosActuales[idx].dia} (${turnosActuales[idx].fechaFormateada})?`)) {
                    // Removemos el turno seleccionado del array
                    turnosActuales.splice(idx, 1);
                    
                    // Actualizamos los cambios en el LocalStorage
                    registroAsistencias[dniLimpio].turnos = turnosActuales;
                    localStorage.setItem('registroAsistencias', JSON.stringify(registroAsistencias));
                    
                    // Volvemos a pintar la lista del modal y refrescamos la tabla pública general
                    renderizarTurnosModal();
                    actualizarTablaPublica();
                }
            });
        });
    }

    // Ejecuta el renderizado de los turnos del DNI ingresado
    renderizarTurnosModal();
});

// Funciones básicas para cerrar la ventana flotante (Modal)
cerrarModalX.addEventListener('click', () => modal.style.display = "none");
btnCerrarModalOk.addEventListener('click', () => {
    modal.style.display = "none";
    formDias.reset();
    limpiarFicha();
    inputDni.value = "";
});

// Cerrar si hacen clic fuera del cuadro blanco
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});
