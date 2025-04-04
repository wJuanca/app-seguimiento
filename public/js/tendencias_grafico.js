document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('tendenciasChart').getContext('2d');
    
    // Format dates for labels
    const labels = reparacionesPorMes.map(item => {
        const [year, month] = item.mes.split('-');
        return new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Reparaciones',
                    data: reparacionesPorMes.map(item => item.cantidad),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Completadas',
                    data: reparacionesPorMes.map(item => item.completadas),
                    borderColor: 'rgb(40, 167, 69)',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Descartadas',
                    data: reparacionesPorMes.map(item => item.descartadas),
                    borderColor: 'rgb(220, 53, 69)',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Tendencia de Reparaciones por Mes'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad de Reparaciones'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mes'
                    }
                }
            }
        }
    });
});

