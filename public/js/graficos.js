// grafico de tipos de equipo
const typeCtx = document.getElementById('equipmentTypeChart').getContext('2d');
new Chart(typeCtx, {
    type: 'pie',
    data: {
        labels: tiposEquipo.map(item => item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1).replace('_', ' ')),
        datasets: [{
            data: tiposEquipo.map(item => item.cantidad),
            backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8']
        }]
    }
});

// graficas de estado de equipos
const statusCtx = document.getElementById('equipmentStatusChart').getContext('2d');
new Chart(statusCtx, {
    type: 'bar',
    data: {
        labels: estadosEquipo.map(item => 
            item.estado === 'disponible' ? 'Disponible' :
            item.estado === 'asignado' ? 'Asignado' :
            item.estado === 'en_reparacion' ? 'En Reparación' :
            'Dado de Baja'
        ),
        datasets: [{
            label: 'Disponibles',
            data: estadosEquipo.map(item => item.estado === 'disponible' ? item.cantidad : 0),
            backgroundColor: '#28a745',
        }, {
            label: 'Asignados',
            data: estadosEquipo.map(item => item.estado === 'asignado' ? item.cantidad : 0),
            backgroundColor: '#007bff',
        }, {
            label: 'En Reparación',
            data: estadosEquipo.map(item => item.estado === 'en_reparacion' ? item.cantidad : 0),
            backgroundColor: '#ffc107',
        }, {
            label: 'Dados de Baja',
            data: estadosEquipo.map(item => item.estado === 'dado_de_baja' ? item.cantidad : 0),
            backgroundColor: '#dc3545',
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        }
    }
});

// Gráfico de distribución de equipos por usuario
const distributionCtx = document.getElementById('distributionChart').getContext('2d');
new Chart(distributionCtx, {
    type: 'pie',
    data: {
        labels: distribucionEquipos.map(item => item.nombre),
        datasets: [{
            data: distribucionEquipos.map(item => item.total_equipos),
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF'
            ]
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    }
});

// Gráfico de total de equipos asignados
const totalEquiposCtx = document.getElementById('totalEquiposChart').getContext('2d');
new Chart(totalEquiposCtx, {
    type: 'doughnut',
    data: {
        labels: ['Asignados', 'Disponibles', 'Otros'],
        datasets: [{
            data: [
                totalEquipos.asignados,
                totalEquipos.disponibles,
                totalEquipos.total - (totalEquipos.asignados + totalEquipos.disponibles)
            ],
            backgroundColor: ['#28a745', '#17a2b8', '#6c757d']
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    }
});

// Gráfico de tendencias de reparaciones
const tendenciasCtx = document.getElementById('tendenciasChart').getContext('2d');
new Chart(tendenciasCtx, {
    type: 'line',
    data: {
        labels: reparacionesPorMes.map(item => {
            const [year, month] = item.mes.split('-');
            return new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        }),
        datasets: [{
            label: 'Total Reparaciones',
            data: reparacionesPorMes.map(item => item.cantidad),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
        }, {
            label: 'Completadas',
            data: reparacionesPorMes.map(item => item.completadas),
            borderColor: 'rgb(40, 167, 69)',
            tension: 0.1,
            fill: false
        }, {
            label: 'Descartadas',
            data: reparacionesPorMes.map(item => item.descartadas),
            borderColor: 'rgb(220, 53, 69)',
            tension: 0.1,
            fill: false
        }]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Tendencias de Reparaciones por Mes'
            },
            legend: {
                position: 'bottom'
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

