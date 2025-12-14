// ====================================
// ChocoWorld - Professional E-Commerce
// Modern Database System
// ====================================

// ====================================
// Internal Database Manager
// ====================================

class ChocoDatabase {
    constructor() {
        this.dbName = 'chocoworld_db';
        this.version = '1.0.0';
        this.init();
    }

    init() {
        // Initialize database structure
        if (!localStorage.getItem(`${this.dbName}_initialized`)) {
            this.createDatabase();
        }
    }

    createDatabase() {
        const schema = {
            products: [],
            cart: [],
            orders: [],
            customers: [],
            settings: {
                currency: 'KRW',
                language: 'en',
                theme: 'modern',
                notifications: true
            },
            stats: {
                totalOrders: 0,
                totalRevenue: 0,
                lastOrderDate: null
            },
            version: this.version,
            createdAt: new Date().toISOString()
        };

        this.save('_schema', schema);
        this.save('_initialized', true);
        console.log('🗄️ Database initialized');
    }

    save(key, data) {
        try {
            const fullKey = `${this.dbName}_${key}`;
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Database save error:', error);
            return false;
        }
    }

    load(key) {
        try {
            const fullKey = `${this.dbName}_${key}`;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Database load error:', error);
            return null;
        }
    }

    delete(key) {
        const fullKey = `${this.dbName}_${key}`;
        localStorage.removeItem(fullKey);
    }

    // Cart operations
    saveCart(items) {
        return this.save('cart', items);
    }

    loadCart() {
        return this.load('cart') || [];
    }

    clearCart() {
        return this.save('cart', []);
    }

    // Order operations
    saveOrder(order) {
        const orders = this.loadOrders();
        order.id = `ORD-${Date.now()}`;
        order.createdAt = new Date().toISOString();
        orders.push(order);

        // Update stats
        const stats = this.load('stats') || {};
        stats.totalOrders = (stats.totalOrders || 0) + 1;
        stats.totalRevenue = (stats.totalRevenue || 0) + order.total;
        stats.lastOrderDate = order.createdAt;
        this.save('stats', stats);

        return this.save('orders', orders);
    }

    loadOrders() {
        return this.load('orders') || [];
    }

    getOrderById(orderId) {
        const orders = this.loadOrders();
        return orders.find(order => order.id === orderId);
    }

    // Customer operations
    saveCustomer(customer) {
        const customers = this.loadCustomers();
        const existing = customers.find(c => c.email === customer.email);

        if (existing) {
            Object.assign(existing, customer);
            existing.updatedAt = new Date().toISOString();
        } else {
            customer.id = `CUST-${Date.now()}`;
            customer.createdAt = new Date().toISOString();
            customers.push(customer);
        }

        return this.save('customers', customers);
    }

    loadCustomers() {
        return this.load('customers') || [];
    }

    getCustomerByEmail(email) {
        const customers = this.loadCustomers();
        return customers.find(c => c.email === email);
    }

    // Settings operations
    saveSettings(settings) {
        return this.save('settings', settings);
    }

    loadSettings() {
        return this.load('settings') || {
            currency: 'KRW',
            language: 'en',
            theme: 'modern',
            notifications: true
        };
    }

    // Stats operations
    getStats() {
        return this.load('stats') || {
            totalOrders: 0,
            totalRevenue: 0,
            lastOrderDate: null
        };
    }

    // Database utilities
    export() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.dbName)) {
                data[key] = localStorage.getItem(key);
            }
        }
        return JSON.stringify(data, null, 2);
    }

    import(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    clear() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.dbName)) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
        console.log('🗑️ Database cleared');
    }

    getSize() {
        let size = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.dbName)) {
                size += localStorage.getItem(key).length;
            }
        }
        return (size / 1024).toFixed(2) + ' KB';
    }
}

// ====================================
// Shopping Cart with Database
// ====================================

class ShoppingCart {
    constructor(database) {
        this.db = database;
        this.items = [];
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.attachEventListeners();
        this.updateCartUI();
    }

    loadFromStorage() {
        this.items = this.db.loadCart();
    }

    saveToStorage() {
        this.db.saveCart(this.items);
    }

    addItem(name, price, category) {
        this.items.push({
            id: Date.now() + Math.random(),
            name,
            price: parseInt(price),
            category
        });
        this.saveToStorage();
        this.updateCartUI();
        this.showNotification(`${name} added to cart!`);
    }

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveToStorage();
        this.updateCartUI();
    }

    clearCart() {
        this.items = [];
        this.saveToStorage();
        this.updateCartUI();
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + item.price, 0);
    }

    getCount() {
        return this.items.length;
    }

    updateCartUI() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.getCount();
        }

        const cartItemsContainer = document.getElementById('cartItems');
        const totalPriceElement = document.querySelector('.total-price');
        const checkoutButton = document.getElementById('checkoutButton');

        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <p>Cart is Empty</p>
                </div>
            `;
            if (totalPriceElement) totalPriceElement.textContent = '₩0';
            if (checkoutButton) checkoutButton.disabled = true;
        } else {
            const itemsHTML = this.items.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">₩${item.price.toLocaleString()}</div>
                        <div class="cart-item-category">${this.getCategoryName(item.category)}</div>
                    </div>
                    <button class="cart-item-remove" data-id="${item.id}">×</button>
                </div>
            `).join('');

            cartItemsContainer.innerHTML = itemsHTML;
            if (totalPriceElement) totalPriceElement.textContent = `₩${this.getTotal().toLocaleString()}`;
            if (checkoutButton) checkoutButton.disabled = false;

            const removeButtons = cartItemsContainer.querySelectorAll('.cart-item-remove');
            removeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.removeItem(parseFloat(btn.dataset.id));
                });
            });
        }
    }

    getCategoryName(category) {
        const names = {
            'chocolate': 'Chocolate',
            'jelly': 'Jelly',
            'mix': 'Mix'
        };
        return names[category] || category;
    }

    showNotification(message) {
        const existing = document.querySelector('.success-message');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'success-message';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.4s ease-out forwards';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart')) {
                const button = e.target.closest('.add-to-cart');
                const name = button.dataset.name;
                const price = button.dataset.price;
                const category = button.dataset.category;

                this.addItem(name, price, category);

                const originalHTML = button.innerHTML;
                button.innerHTML = '✓ Added';
                button.style.background = 'linear-gradient(135deg, #98FF98, #00FA9A)';
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.style.background = '';
                }, 1500);
            }
        });

        const cartToggle = document.getElementById('cartToggle');
        if (cartToggle) {
            cartToggle.addEventListener('click', () => {
                this.toggleCart();
            });
        }

        const cartClose = document.getElementById('cartClose');
        if (cartClose) {
            cartClose.addEventListener('click', () => {
                this.toggleCart();
            });
        }

        const checkoutButton = document.getElementById('checkoutButton');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', () => {
                this.openCheckoutModal();
            });
        }

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeCart();
                this.closeCheckoutModal();
            });
        }
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');

        if (cartSidebar && overlay) {
            cartSidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        }
    }

    closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');

        if (cartSidebar && overlay) {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('open');
        }
    }

    openCheckoutModal() {
        this.closeCart();

        const modal = document.getElementById('checkoutModal');
        const overlay = document.getElementById('overlay');

        if (modal && overlay) {
            modal.classList.add('open');
            overlay.classList.add('open');
            this.updateCheckoutSummary();
        }
    }

    closeCheckoutModal() {
        const modal = document.getElementById('checkoutModal');
        const overlay = document.getElementById('overlay');

        if (modal && overlay) {
            modal.classList.remove('open');
            overlay.classList.remove('open');
        }
    }

    updateCheckoutSummary() {
        const orderItemsContainer = document.getElementById('orderItems');
        const orderTotalElement = document.getElementById('orderTotal');

        if (orderItemsContainer && orderTotalElement) {
            const itemsHTML = this.items.map(item => `
                <div class="order-item">
                    <span class="order-item-name">${item.name}</span>
                    <span class="order-item-price">₩${item.price.toLocaleString()}</span>
                </div>
            `).join('');

            orderItemsContainer.innerHTML = itemsHTML;
            orderTotalElement.textContent = `₩${this.getTotal().toLocaleString()}`;
        }
    }
}

// ====================================
// Navigation & Smooth Scrolling
// ====================================

class Navigation {
    constructor() {
        this.init();
    }

    init() {
        this.attachScrollListeners();
        this.handleHashNavigation();
    }

    attachScrollListeners() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                const section = link.dataset.section;
                this.scrollToSection(section);

                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        window.addEventListener('scroll', () => {
            this.updateActiveNavOnScroll();
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerOffset = 80;
            const sectionPosition = section.offsetTop - headerOffset;

            window.scrollTo({
                top: sectionPosition,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNavOnScroll() {
        const sections = ['chocolate', 'jelly', 'mixes'];
        const navLinks = document.querySelectorAll('.nav-link');

        let currentSection = '';

        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const sectionTop = section.offsetTop - 100;
                const sectionBottom = sectionTop + section.offsetHeight;

                if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionBottom) {
                    currentSection = sectionId;
                }
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === currentSection) {
                link.classList.add('active');
            }
        });
    }

    handleHashNavigation() {
        if (window.location.hash) {
            const sectionId = window.location.hash.substring(1);
            setTimeout(() => {
                this.scrollToSection(sectionId);
            }, 100);
        }
    }
}

// ====================================
// Checkout Form Handler
// ====================================

class CheckoutForm {
    constructor(cart, database) {
        this.cart = cart;
        this.db = database;
        this.init();
    }

    init() {
        const form = document.getElementById('checkoutForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(form);
            });
        }

        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.cart.closeCheckoutModal();
            });
        }
    }

    handleSubmit(form) {
        const formData = new FormData(form);
        const orderData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            payment: formData.get('payment'),
            notes: formData.get('notes'),
            items: this.cart.items,
            total: this.cart.getTotal(),
            date: new Date().toISOString(),
            status: 'pending'
        };

        if (!orderData.name || !orderData.phone || !orderData.email || !orderData.address || !orderData.payment) {
            alert('Please fill all required fields');
            return;
        }

        // Save customer data to database
        const customerData = {
            name: orderData.name,
            phone: orderData.phone,
            email: orderData.email,
            address: orderData.address
        };
        this.db.saveCustomer(customerData);

        // Save order to database
        this.db.saveOrder(orderData);

        console.log('✅ Order saved to database:', orderData);
        console.log('📊 Database stats:', this.db.getStats());

        this.showSuccess(orderData);
        this.cart.clearCart();
        this.cart.closeCheckoutModal();
        form.reset();
    }

    showSuccess(orderData) {
        const message = `
Order Successfully Placed! 🎉

Order #: ${Date.now()}
Total: ₩${orderData.total.toLocaleString()}
Items: ${orderData.items.length}

We'll contact you at ${orderData.phone} to confirm.
        `;

        alert(message);
        this.cart.showNotification('Order placed successfully!');
    }
}

// ====================================
// Global helper
// ====================================

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerOffset = 80;
        const sectionPosition = section.offsetTop - headerOffset;

        window.scrollTo({
            top: sectionPosition,
            behavior: 'smooth'
        });
    }
}

// ====================================
// Scroll Animations
// ====================================

class ScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 50);

                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.05}s`;
            observer.observe(card);
        });
    }
}

// ====================================
// Initialize Application
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🍫 ChocoWorld - Modern E-Commerce', 'font-size: 20px; font-weight: bold; background: linear-gradient(135deg, #1a2332, #4ecdc4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
    console.log('%cModern Database System Integrated', 'color: #4ecdc4; font-style: italic;');

    // Initialize database
    const database = new ChocoDatabase();

    // Initialize application with database
    const cart = new ShoppingCart(database);
    const navigation = new Navigation();
    const checkoutForm = new CheckoutForm(cart, database);
    const scrollAnimations = new ScrollAnimations();

    // Global access
    window.cart = cart;
    window.database = database;
    window.scrollToSection = scrollToSection;

    // Log database info
    console.log('📊 Database size:', database.getSize());
    console.log('📈 Stats:', database.getStats());

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cart.closeCart();
            cart.closeCheckoutModal();
        }

        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            cart.toggleCart();
        }
    });

    console.log('✅ Application ready');
    console.log(`📦 Cart: ${cart.getCount()} items`);
});

window.addEventListener('error', (e) => {
    console.error('Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rejection:', e.reason);
});
