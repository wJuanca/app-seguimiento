document.addEventListener('DOMContentLoaded', function() {
    if(typeof page_inventario !== 'undefined' && page_inventario === 'inventario') {
        console.log('inventario');
        initInventoryFilters();
    }

    if(typeof page_mantenimiento !== 'undefined' && page_mantenimiento === 'mantenimiento') {
        console.log('mantenimiento');
        initMaintenanceFilters();
    }
});

function setupPagination(table, filterFunction) {
    let currentPage = 1;
    const rowsPerPage = 6;

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls d-flex justify-content-center mt-3';
    paginationDiv.innerHTML = `
        <button class="btn btn-secondary me-2" id="prevPage">Anterior</button>
        <span class="align-self-center mx-2" id="pageInfo">Página 1</span>
        <button class="btn btn-secondary ms-2" id="nextPage">Siguiente</button>
    `;
    table.parentNode.insertBefore(paginationDiv, table.nextSibling);

    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    function updatePagination(filteredRows) {
        const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
        currentPage = Math.min(currentPage, totalPages);
        currentPage = Math.max(1, currentPage);
        
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages || totalPages === 0;
        pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        const allRows = table.querySelectorAll('tbody tr');
        allRows.forEach(row => row.style.display = 'none');
        filteredRows.slice(start, end).forEach(row => row.style.display = '');
    }

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            filterFunction();
        }
    });

    nextButton.addEventListener('click', () => {
        currentPage++;
        filterFunction();
    });

    return { currentPage, updatePagination };
}

function initInventoryFilters() {
    const table = document.querySelector('.table');
    const filters = document.querySelectorAll('.form-select');
    const resetButton = document.getElementById('resetFilters');
    const tableRows = document.querySelectorAll('tbody tr');

    const pagination = setupPagination(table, filterInventoryTable);

    function filterInventoryTable() {
        const estado = document.getElementById('estadoFilter').value;
        const tipo = document.getElementById('tipoFilter').value;
        const usuario = document.getElementById('usuarioFilter').value;

        let filteredRows = [];

        tableRows.forEach(row => {
            try {
                const cells = row.querySelectorAll('td');
                if (!cells.length) return;

                const estadoCell = cells[6]?.textContent.trim() || '';
                const tipoCell = cells[2]?.textContent.trim() || '';
                const usuarioCell = cells[7]?.textContent.trim() || '';

                const estadoMatch = !estado || estadoCell.toLowerCase().includes(estado.toLowerCase());
                const tipoMatch = !tipo || tipoCell.toLowerCase() === tipo.toLowerCase();
                const usuarioMatch = !usuario || usuarioCell === usuario;

                if (estadoMatch && tipoMatch && usuarioMatch) {
                    filteredRows.push(row);
                }
            } catch (error) {
                console.log('Error processing row:', error);
            }
        });

        pagination.updatePagination(filteredRows);
    }

    filters.forEach(filter => {
        filter.addEventListener('change', filterInventoryTable);
    });

    resetButton.addEventListener('click', function() {
        filters.forEach(filter => {
            filter.value = '';
        });
        filterInventoryTable();
    });

    filterInventoryTable();
}

function initMaintenanceFilters() {
    const table = document.querySelector('.table');
    const filters = {
        estado: document.getElementById('estadoFilter'),
        usuario: document.getElementById('usuarioFilter'),
        tecnico: document.getElementById('tecnicoFilter'),
        fecha: document.getElementById('fechaFilter')
    };
    const resetButton = document.getElementById('resetFilters');

    const pagination = setupPagination(table, filterMaintenanceTable);

    function filterMaintenanceTable() {
        if (!table) return;
        const rows = table.querySelectorAll('tbody tr');
        if (!rows.length) return;

        let filteredRows = [];

        rows.forEach(row => {
            try {
                const cells = row.querySelectorAll('td');
                if (!cells.length) return;

                const estado = cells[5].textContent.trim().toLowerCase();
                const usuario = cells[2].textContent.trim();
                const tecnico = cells[3].textContent.trim();
                const fechaCell = cells[7].textContent;
                const [day, month, year] = fechaCell.split('/').map(num => num.padStart(2, '0'));
                const fechaTabla = `${year}-${month}-${day}`;

                const matchEstado = !filters.estado?.value || estado.includes(filters.estado.value.toLowerCase());
                const matchUsuario = !filters.usuario?.value || usuario.includes(filters.usuario.value);
                const matchTecnico = !filters.tecnico?.value || tecnico.includes(filters.tecnico.value);
                const matchFecha = !filters.fecha?.value || fechaTabla === filters.fecha.value;

                if (matchEstado && matchUsuario && matchTecnico && matchFecha) {
                    filteredRows.push(row);
                }
            } catch (error) {
                console.log('Error processing row:', error);
            }
        });

        pagination.updatePagination(filteredRows);
    }
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            Object.values(filters).forEach(filter => {
                if (filter) filter.value = '';
            });
            filterMaintenanceTable();
        });
    }

    Object.values(filters).forEach(filter => {
        if (filter) {
            filter.addEventListener('change', filterMaintenanceTable);
        }
    });

    filterMaintenanceTable();
}

