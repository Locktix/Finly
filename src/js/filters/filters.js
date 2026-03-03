// ======================
// GESTION DES FILTRES
// ======================
function initializeCategoryFilter() {
    const filterContainer = document.getElementById('categoryFilter');
    const allCategories = [...expenseCategories, ...incomeCategories];
    const uniqueCategories = [...new Set(allCategories)];

    filterContainer.innerHTML = uniqueCategories.map(cat => `
        <div class="filter-chip">
            <input type="checkbox" id="cat-${cat}" value="${cat}" class="category-checkbox">
            <label for="cat-${cat}">
                <i class="fas ${categoryIcons[cat] || 'fa-tag'}"></i>
                <span>${cat}</span>
            </label>
        </div>
    `).join('');

    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateFilters);
    });
}

function setupFilterListeners() {
    const panel = document.getElementById('filtersPanel');
    const toggleButton = document.getElementById('toggleFiltersBtn');
    const isInitiallyActive = panel.classList.contains('active');
    toggleButton.classList.toggle('active', isInitiallyActive);
    toggleButton.setAttribute('aria-expanded', isInitiallyActive ? 'true' : 'false');

    // Recherche
    document.getElementById('searchFilter').addEventListener('input', updateFilters);

    // Toggle filtres
    document.getElementById('toggleFiltersBtn').addEventListener('click', () => {
        const nextActive = panel.classList.toggle('active');
        toggleButton.classList.toggle('active', nextActive);
        toggleButton.setAttribute('aria-expanded', nextActive ? 'true' : 'false');
    });

    // Réinitialiser filtres
    document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);

    // Navigation mois
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        navigateMonth(-1);
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        navigateMonth(1);
    });

    // Event listeners pour le tri
    document.querySelectorAll('.sort-header').forEach(button => {
        button.addEventListener('click', (e) => {
            const sortField = e.currentTarget.dataset.sort;
            handleSort(sortField);
        });
    });
}

function handleSort(field) {
    // Si on clique sur le même champ, inverser la direction
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Sinon, passer au nouveau champ en order ascendant
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    // Mettre à jour les visuels des boutons
    updateSortButtonsUI();
    
    // Mettre à jour le tableau
    updateDashboard();
}

function updateSortButtonsUI() {
    document.querySelectorAll('.sort-header').forEach(button => {
        button.classList.remove('active-up', 'active-down');
        
        if (button.dataset.sort === currentSort.field) {
            if (currentSort.direction === 'asc') {
                button.classList.add('active-up');
            } else {
                button.classList.add('active-down');
            }
        }
    });
}

function sortTransactions(transactionsList) {
    if (!currentSort.field) return transactionsList;
    
    const sorted = [...transactionsList].sort((a, b) => {
        let valueA = a[currentSort.field];
        let valueB = b[currentSort.field];
        
        // Gestion des différents types de données
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
            return currentSort.direction === 'asc' 
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
        } else if (typeof valueA === 'number') {
            return currentSort.direction === 'asc'
                ? valueA - valueB
                : valueB - valueA;
        }
        
        return 0;
    });
    
    return sorted;
}


function updateFilters() {
    activeFilters.search = document.getElementById('searchFilter').value;

    activeFilters.categories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(checkbox => checkbox.value);

    updateDashboard();
}

function resetFilters() {
    document.getElementById('searchFilter').value = '';
    document.querySelectorAll('.category-checkbox').forEach(cb => cb.checked = false);

    activeFilters = {
        search: '',
        categories: []
    };

    updateDashboard();
}