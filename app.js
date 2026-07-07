document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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
        renderCategories();
        fetchProducts();
        setupEventListeners();
    }

    // Fetch Products Data
    async function fetchProducts() {
        showLoading(true);
        try {
            // In a real app, this would be a fetch to an API or Google Sheets endpoint
            const response = await fetch('products.json');
            if (!response.ok) throw new Error('Network response was not ok');
            products = await response.json();
            
            // Simulate network delay for the "wow" feeling
            setTimeout(() => {
                showLoading(false);
                filterAndRenderProducts();
            }, 800);
            
        } catch (error) {
            console.error('Error fetching products:', error);
            showLoading(false);
            productsContainer.innerHTML = '<p class="error-msg">Failed to load products. Please try refreshing the page.</p>';
        }
    }

    // Render Categories
    function renderCategories() {
        categoriesContainer.innerHTML = '';
        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = `category-chip ${category.value === currentCategory ? 'active' : ''}`;
            btn.innerHTML = `<i class="fa-solid ${category.icon}"></i> ${category.name}`;
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                
                // Update current category
                currentCategory = category.value;
                currentCategoryTitle.textContent = category.name;
                
                filterAndRenderProducts();
            });
            categoriesContainer.appendChild(btn);
        });
    }

    // Render Products
    function filterAndRenderProducts() {
        // Filter logic
        let filtered = products;

        if (currentCategory !== 'All') {
            filtered = filtered.filter(p => p.category === currentCategory);
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.brand.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
        }

        // Update count
        productCount.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;

        // Render logic
        productsContainer.innerHTML = '';
        
        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            filtered.forEach((product, index) => {
                const card = document.createElement('div');
                card.className = 'product-card';
                // Add staggered animation delay
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
        // Search Input
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            
            if (searchQuery.length > 0) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
            }
            
            filterAndRenderProducts();
        });

        // Clear Search
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            filterAndRenderProducts();
            searchInput.focus();
        });

        // Reset Filters (from empty state)
        resetFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            
            currentCategory = 'All';
            currentCategoryTitle.textContent = 'All Products';
            
            // Reset category chips UI
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            document.querySelector('.category-chip').classList.add('active'); // Select first (All)
            
            filterAndRenderProducts();
        });

        // Scroll to Top visibility
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.remove('hidden');
            } else {
                scrollTopBtn.classList.add('hidden');
            }
        });

        // Scroll to Top action
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
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

    // Add keyframes for fadeIn dynamically
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
