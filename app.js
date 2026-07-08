document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const mainContent = document.getElementById('mainContent');
    const setupScreen = document.getElementById('setupScreen');
    const sheetUrlInput = document.getElementById('sheetUrlInput');
    const saveSheetUrlBtn = document.getElementById('saveSheetUrlBtn');
    const skipSetupBtn = document.getElementById('skipSetupBtn');
    
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
    
    const logoEl = document.querySelector('.logo');
    let logoClickCount = 0;
    
    let products = [];
    let currentCategory = 'All';
    let searchQuery = '';

    // Emoji icons for each category (used when no image is provided)
    const categoryEmojis = {
        'grocery': '🛒',
        'rice & dal': '🍚',
        'oil & ghee': '🫒',
        'biscuits': '🍪',
        'chocolates': '🍫',
        'snacks': '🥨',
        'soft drinks': '🥤',
        'dairy': '🥛',
        'spices': '🌶️',
        'cleaning': '🧹',
        'personal care': '🧼',
        'stationery': '📒',
        'household': '🏠',
        'baby care': '👶'
    };

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

    // ========== INIT ==========
    function init() {
        setupScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');
        renderCategories();
        
        const savedUrl = localStorage.getItem('kiranaSheetUrl');
        fetchProductsFromCSV(savedUrl || 'products.csv');
        setupEventListeners();
    }

    // ========== SETUP SCREEN ==========
    if (saveSheetUrlBtn) {
        saveSheetUrlBtn.addEventListener('click', () => {
            const url = sheetUrlInput.value.trim();
            if (url && url.includes('http')) {
                localStorage.setItem('kiranaSheetUrl', url);
                window.location.reload();
            } else {
                alert('Please enter a valid URL.');
            }
        });
    }

    if (skipSetupBtn) {
        skipSetupBtn.addEventListener('click', () => {
            localStorage.setItem('kiranaSheetUrl', 'products.csv');
            window.location.reload();
        });
    }

    // Secret Reset: click logo 5 times
    if (logoEl) {
        logoEl.addEventListener('click', () => {
            logoClickCount++;
            if (logoClickCount >= 5) {
                if (confirm("Reset spreadsheet URL?")) {
                    localStorage.removeItem('kiranaSheetUrl');
                    window.location.reload();
                }
                logoClickCount = 0;
            }
            setTimeout(() => { logoClickCount = 0; }, 3000);
        });
    }

    // ========== FETCH & PARSE CSV ==========
    function fetchProductsFromCSV(csvUrl) {
        showLoading(true);
        
        Papa.parse(csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                try {
                    products = results.data
                        .filter(row => row['Name'] && row['Name'].trim() !== '')
                        .map((row, index) => {
                            const availStr = (row['Available'] || 'TRUE').toString().toLowerCase().trim();
                            const isAvailable = (availStr === 'true' || availStr === 'yes' || availStr === '1');
                            const imageVal = (row['Image'] || '').trim();

                            return {
                                id: index + 1,
                                category: (row['Category'] || 'Other').trim(),
                                name: (row['Name'] || 'Unnamed').trim(),
                                brand: (row['Brand'] || '').trim(),
                                price: parseFloat(row['Price']) || 0,
                                unit: (row['Unit'] || '').trim(),
                                isAvailable: isAvailable,
                                image: imageVal
                            };
                        });
                    
                    showLoading(false);
                    filterAndRenderProducts();
                } catch (err) {
                    console.error("Error:", err);
                    showLoading(false);
                    productsContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:red;">Error reading data. Check CSV headers.</p>';
                }
            },
            error: function(error) {
                console.error("Fetch error:", error);
                showLoading(false);
                productsContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:red;">Failed to load products.</p>';
            }
        });
    }

    // ========== RENDER CATEGORIES ==========
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

    // ========== RENDER PRODUCTS ==========
    function filterAndRenderProducts() {
        let filtered = products;

        if (currentCategory !== 'All') {
            filtered = filtered.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
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
                
                const availClass = product.isAvailable ? 'badge-available' : 'badge-out';
                const availText = product.isAvailable ? 'Available' : 'Out of Stock';
                const unitText = product.unit ? ` / ${product.unit}` : '';
                
                // Use image if provided, otherwise show a big emoji
                let imageHTML;
                if (product.image && product.image.length > 0) {
                    imageHTML = `
                        <div class="product-image-container">
                            <span class="availability-badge ${availClass}">${availText}</span>
                            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy"
                                 onerror="this.style.display='none'; this.parentElement.querySelector('.emoji-fallback').style.display='flex';">
                            <div class="emoji-fallback" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; align-items:center; justify-content:center; font-size:4rem; background:#f9fafb;">
                                ${getEmoji(product.category)}
                            </div>
                        </div>`;
                } else {
                    imageHTML = `
                        <div class="product-image-container">
                            <span class="availability-badge ${availClass}">${availText}</span>
                            <div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:4rem; background:#f9fafb;">
                                ${getEmoji(product.category)}
                            </div>
                        </div>`;
                }
                
                card.innerHTML = `
                    ${imageHTML}
                    <div class="product-details">
                        <span class="product-brand">${product.brand}</span>
                        <h4 class="product-name">${product.name}</h4>
                        <div class="product-footer">
                            <div>
                                <span class="product-price">₹${product.price}</span><span style="font-size: 0.75rem; color: #6b7280;">${unitText}</span>
                            </div>
                        </div>
                    </div>
                `;
                productsContainer.appendChild(card);
            });
        }
    }

    function getEmoji(category) {
        return categoryEmojis[category.toLowerCase()] || '📦';
    }

    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
                filterAndRenderProducts();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                clearSearchBtn.classList.add('hidden');
                filterAndRenderProducts();
                searchInput.focus();
            });
        }

        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                clearSearchBtn.classList.add('hidden');
                currentCategory = 'All';
                currentCategoryTitle.textContent = 'All Products';
                document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                const firstChip = document.querySelector('.category-chip');
                if (firstChip) firstChip.classList.add('active');
                filterAndRenderProducts();
            });
        }

        window.addEventListener('scroll', () => {
            scrollTopBtn.classList.toggle('hidden', window.scrollY <= 300);
        });

        if (scrollTopBtn) {
            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // ========== HELPERS ==========
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

    // Inject fadeIn animation
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    init();
});
