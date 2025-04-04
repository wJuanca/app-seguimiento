async function mostrarProceso(equipoId) {
    try {
        console.log("Mostrando proceso para el equipo:", equipoId);
        
        const response = await fetch(`/reporte_mantenimiento/proceso/${equipoId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        const timeline = document.getElementById('procesoTimeline');
        timeline.innerHTML = '';

        if (!data || data.length === 0) {
            timeline.innerHTML = '<div class="alert alert-info">No hay procesos registrados para este equipo.</div>';
            return;
        }

        // Add equipment info
        const equipoInfo = document.createElement('div');
        equipoInfo.className = 'mb-4';
        equipoInfo.innerHTML = `
            <h4>${data[0].equipo_nombre}</h4>
            <p class="text-muted">${data[0].marca} ${data[0].modelo}</p>
        `;
        timeline.appendChild(equipoInfo);

        // Add process timeline
        data.forEach(proceso => {
            const etapaElement = document.createElement('div');
            etapaElement.className = `timeline-item ${proceso.estado}`;
            etapaElement.innerHTML = `
                <div class="timeline-marker ${proceso.estado}"></div>
                <div class="timeline-content">
                    <h3 class="timeline-title">${proceso.etapa.charAt(0).toUpperCase() + proceso.etapa.slice(1)}</h3>
                    <p>${proceso.descripcion}</p>
                    <small>${proceso.fecha ? new Date(proceso.fecha).toLocaleDateString() : 'Pendiente'}</small>
                </div>
            `;
            timeline.appendChild(etapaElement);
        });
    } catch (error) {
        console.error('Error:', error);
        const timeline = document.getElementById('procesoTimeline');
        timeline.innerHTML = '<div class="alert alert-danger">Error al cargar el proceso de mantenimiento</div>';
    }
}

