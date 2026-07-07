document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const mainContent = document.getElementById('mainContent');
    const setupScreen = document.getElementById('setupScreen');
    const sheetUrlInput = document.getElementById('sheetUrlInput');
    const saveSheetUrlBtn = document.getElementById('saveSheetUrlBtn');
    
    const productsContainer = document.getElementById('productsContainer');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const productCount = document.getElementById('productCount');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const emptyState = document.getElementById('emptyState');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    
    // Secret Reset (Click logo 5 times)
    const logoEl = document.querySelector('.logo');
    let logoClickCount = 0;
    
    // State
    let products = [];
    let currentCategory = 'All';
    let searchQuery = '';

    // Categories List (from requirements)
    const categories = [
        { name: 'All Products', value: 'All', icon: 'fa-table-cells' },
        { name: 'Grocery', value: 'Grocery', icon: 'fa-basket-shopping' },
        { name: 'Rice & Dal', value: 'Rice & Dal', icon: 'fa-bowl-rice' },
        { name: 'Oil & Ghee', value: 'Oil & Ghee', icon: 'fa-bottle-droplet' },
        { name: 'Biscuits', value: 'Biscuits', icon: 'fa-cookie' },
        { name: 'Chocolates', value: 'Chocolates', icon: 'fa-candy-cane' },
        { name: 'Snacks', value: 'Snacks', icon: 'fa-cookie-bite' },
        { name: 'Soft Drinks', value: 'Soft Drinks', icon: 'fa-glass-water' },
        { name: 'Dairy', value: 'Dairy', icon: 'fa-cheese' },
        { name: 'Spices', value: 'Spices', icon: 'fa-pepper-hot' },
        { name: 'Cleaning', value: 'Cleaning', icon: 'fa-broom' },
        { name: 'Personal Care', value: 'Personal Care', icon: 'fa-pump-soap' },
        { name: 'Stationery', value: 'Stationery', icon: 'fa-pen-ruler' },
        { name: 'Household', value: 'Household', icon: 'fa-house-chimney' },
        { name: 'Baby Care', value: 'Baby Care', icon: 'fa-baby' }
    ];

    // Initialize App
    function init() {
        const savedUrl = localStorage.getItem('kiranaSheetUrl');
        
        if (savedUrl) {
            setupScreen.classList.add('hidden');
            mainContent.classList.remove('hidden');
            renderCategories();
            fetchProductsFromCSV(savedUrl);
        } else {
            setupScreen.classList.remove('hidden');
            mainContent.classList.add('hidden');
        }

        setupEventListeners();
    }

    // Save URL and Start
    saveSheetUrlBtn.addEventListener('click', () => {
        const url = sheetUrlInput.value.trim();
        if (url && url.includes('http')) {
            localStorage.setItem('kiranaSheetUrl', url);
            window.location.reload();
        } else {
            alert('Please enter a valid URL.');
        }
    });

    // Secret Reset Logic
    if(logoEl) {
        logoEl.addEventListener('click', () => {
            logoClickCount++;
            if (logoClickCount >= 5) {
                if(confirm("Do you want to disconnect the spreadsheet and reset the URL?")) {
                    localStorage.removeItem('kiranaSheetUrl');
                    window.location.reload();
                }
                logoClickCount = 0;
            }
            setTimeout(() => { logoClickCount = 0; }, 3000); // reset count after 3 seconds
        });
    }

    // Fetch Products Data via PapaParse
    function fetchProductsFromCSV(csvUrl) {
        showLoading(true);
        
        Papa.parse(csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                try {
                    // Map CSV data to product objects
                    products = results.data.map((row, index) => {
                        // Check availability string
                        const availStr = (row['Available'] || '').toString().toLowerCase().trim();
                        const isAvailable = availStr === 'true' || availStr === 'yes' || availStr === '1' || availStr === '';

                        return {
                            id: index + 1,
                            category: row['Category'] || 'Other',
                            name: row['Name'] || 'Unnamed Product',
                            brand: row['Brand'] || '',
                            price: parseFloat(row['Price']) || 0,
                            unit: row['Unit'] || '',
                            isAvailable: isAvailable,
                            lastUpdated: 'Live',
                            image: row['Image'] || 'https://images.unsplash.com/photo-1601598851547-4302969d0614?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' // default placeholder
                        };
                    });
                    
                    showLoading(false);
                    filterAndRenderProducts();
                } catch (err) {
                    console.error("Error mapping CSV data:", err);
                    showLoading(false);
                    productsContainer.innerHTML = '<p class="error-msg">Error reading spreadsheet data. Check your column headers.</p>';
                }
            },
            error: function(error) {
                console.error("Error fetching CSV:", error);
                showLoading(false);
                productsContainer.innerHTML = '<p class="error-msg">Failed to load from Google Sheets. Ensure it is published as CSV.</p>';
            }
        });
    }

    // Render Categories
    function renderCategories() {
        categoriesContainer.innerHTML = '';
        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = `category-chip ${category.value === currentCategory ? 'active' : ''}`;
            btn.innerHTML = `<i class="fa-solid ${category.icon}"></i> ${category.name}`;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = category.value;
                currentCategoryTitle.textContent = category.name;
                filterAndRenderProducts();
            });
            categoriesContainer.appendChild(btn);
        });
    }

    // Render Products
    function filterAndRenderProducts() {
        let filtered = products;

        if (currentCategory !== 'All') {
            filtered = filtered.filter(p => p.category.toLowerCase().includes(currentCategory.toLowerCase()));
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.brand.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
        }

        productCount.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
        productsContainer.innerHTML = '';
        
        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            filtered.forEach((product, index) => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`;
                card.style.opacity = '0';
                
                const availabilityClass = product.isAvailable ? 'badge-available' : 'badge-out';
                const availabilityText = product.isAvailable ? 'Available' : 'Out of Stock';
                const unitText = product.unit ? ` / ${product.unit}` : '';
                
                card.innerHTML = `
                    <div class="product-image-container">
                        <span class="availability-badge ${availabilityClass}">${availabilityText}</span>
                        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                    </div>
                    <div class="product-details">
                        <span class="product-brand">${product.brand}</span>
                        <h4 class="product-name">${product.name}</h4>
                        <div class="product-footer">
                            <div>
                                <span class="product-price">₹${product.price}</span><span style="font-size: 0.75rem; color: #6b7280;">${unitText}</span>
                            </div>
                            <span class="product-updated">Updated: ${product.lastUpdated}</span>
                        </div>
                    </div>
                `;
                productsContainer.appendChild(card);
            });
        }
    }

    // Event Listeners
    function setupEventListeners() {
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                if (searchQuery.length > 0) {
                    clearSearchBtn.classList.remove('hidden');
                } else {
                    clearSearchBtn.classList.add('hidden');
                }
                filterAndRenderProducts();
            });
        }

        if(clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                clearSearchBtn.classList.add('hidden');
                filterAndRenderProducts();
                searchInput.focus();
            });
        }

        if(resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                clearSearchBtn.classList.add('hidden');
                currentCategory = 'All';
                currentCategoryTitle.textContent = 'All Products';
                document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                if(document.querySelector('.category-chip')) {
                   document.querySelector('.category-chip').classList.add('active'); 
                }
                filterAndRenderProducts();
            });
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.remove('hidden');
            } else {
                scrollTopBtn.classList.add('hidden');
            }
        });

        if(scrollTopBtn) {
            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // Helpers
    function showLoading(show) {
        if (show) {
            loadingIndicator.classList.remove('hidden');
            productsContainer.classList.add('hidden');
            emptyState.classList.add('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
            productsContainer.classList.remove('hidden');
        }
    }

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Run app
    init();
});
