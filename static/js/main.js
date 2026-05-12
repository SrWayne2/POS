let cart = [];
let allProducts = [];
let allClients = [];

// Navegación (SPA)
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const target = item.getAttribute('data-target');
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById('view-' + target).classList.add('active');
        
        if(target === 'dashboard') loadDashboard();
        if(target === 'inventory') loadInventory();
        if(target === 'clients') loadClients();
        if(target === 'sales') {
            loadClients();
            document.getElementById('barcode-input').focus();
        }
    });
});

// Carga Inicial
window.onload = () => {
    loadDashboard();
    fetchProducts();
    loadClients();
};

// --- DASHBOARD ---
async function loadDashboard() {
    try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        document.getElementById('dash-total').innerText = '$ ' + data.today_sales_total.toLocaleString('es-CO');
        document.getElementById('dash-count').innerText = data.today_sales_count;
        document.getElementById('dash-stock').innerText = data.low_stock_alerts;

        const salesRes = await fetch('/api/sales');
        const sales = await salesRes.json();
        const tbody = document.getElementById('recent-sales-table');
        tbody.innerHTML = '';
        sales.forEach(sale => {
            tbody.innerHTML += `
                <tr>
                    <td>#POS-${sale.id.toString().padStart(4, '0')}</td>
                    <td class="text-muted">${sale.date}</td>
                    <td>$ ${sale.total.toLocaleString('es-CO')}</td>
                    <td><span class="status completed">${sale.payment_method}</span></td>
                </tr>
            `;
        });
    } catch(e) { console.error(e); }
}

// --- CLIENTES ---
async function loadClients() {
    try {
        const res = await fetch('/api/clients');
        allClients = await res.json();
        
        // Actualizar tabla de clientes si estamos en la vista
        const tbody = document.getElementById('clients-table');
        if (tbody) {
            tbody.innerHTML = '';
            allClients.forEach(c => {
                const typeStyle = c.client_type === 'Mayorista' ? 'background:#e8f8f5; color:#00b894;' : 'background:#f0f0f0; color:#555;';
                tbody.innerHTML += `
                    <tr>
                        <td>${c.id}</td>
                        <td>${c.document}</td>
                        <td>${c.name}</td>
                        <td>${c.phone}</td>
                        <td><span style="padding: 4px 8px; border-radius: 4px; font-size:12px; font-weight:bold; ${typeStyle}">${c.client_type}</span></td>
                        <td>
                            <button class="btn" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;" onclick="editClient(${c.id})">Editar</button>
                            <button class="btn" style="padding: 4px 8px; font-size: 12px; background-color: #e74c3c;" onclick="deleteClient(${c.id})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        }
        
        // Actualizar selector de POS
        const posClient = document.getElementById('pos-client');
        if (posClient) {
            const currentVal = posClient.value;
            posClient.innerHTML = '<option value="">Consumidor Final (Minorista)</option>';
            allClients.forEach(c => {
                posClient.innerHTML += `<option value="${c.id}">${c.name} - ${c.document} (${c.client_type})</option>`;
            });
            posClient.value = currentVal;
        }
    } catch(e) { console.error(e); }
}

function showClientModal(id = null) {
    document.getElementById('client-modal').style.display = 'flex';
    if(id) {
        document.getElementById('client-modal-title').innerText = 'Editar Cliente';
        const c = allClients.find(x => x.id === id);
        document.getElementById('client-id').value = c.id;
        document.getElementById('client-doc').value = c.document;
        document.getElementById('client-name').value = c.name;
        document.getElementById('client-phone').value = c.phone;
        document.getElementById('client-type').value = c.client_type;
    } else {
        document.getElementById('client-modal-title').innerText = 'Nuevo Cliente';
        document.getElementById('client-id').value = '';
        document.getElementById('client-doc').value = '';
        document.getElementById('client-name').value = '';
        document.getElementById('client-phone').value = '';
        document.getElementById('client-type').value = 'Minorista';
    }
}

function editClient(id) {
    showClientModal(id);
}

function deleteClient(id) {
    if(confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
        fetch(`/api/clients/${id}`, {
            method: 'DELETE'
        }).then(r => r.json()).then(res => {
            if(res.success) {
                loadClients();
                updateCartPrices();
            } else {
                alert('Error: ' + res.error);
            }
        });
    }
}

function saveClient() {
    const id = document.getElementById('client-id').value;
    const data = {
        document: document.getElementById('client-doc').value,
        name: document.getElementById('client-name').value,
        phone: document.getElementById('client-phone').value,
        client_type: document.getElementById('client-type').value
    };
    
    if(!data.document || !data.name) return alert('Documento y Nombre son obligatorios');

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/clients/${id}` : '/api/clients';

    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if(res.success) {
            document.getElementById('client-modal').style.display = 'none';
            loadClients();
            updateCartPrices(); // Si el cliente estaba seleccionado en el POS
        } else {
            alert('Error: ' + res.error);
        }
    });
}

// --- INVENTARIO ---
async function fetchProducts() {
    const res = await fetch('/api/products');
    allProducts = await res.json();
}

async function loadInventory() {
    try {
        await fetchProducts();
        const tbody = document.getElementById('inventory-table');
        tbody.innerHTML = '';
        allProducts.forEach(p => {
            const stockAlert = p.stock < 5 ? 'color: #c0392b; font-weight: bold; background-color: #fadbd8;' : '';
            tbody.innerHTML += `
                <tr style="${stockAlert}">
                    <td>${p.id}</td>
                    <td>${p.barcode}</td>
                    <td>${p.name}</td>
                    <td>$ ${p.price.toLocaleString('es-CO')}</td>
                    <td style="color:#27ae60; font-weight:bold;">$ ${p.wholesale_price.toLocaleString('es-CO')}</td>
                    <td>${p.origin}</td>
                    <td>${p.stock}</td>
                    <td>
                        <button class="btn" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;" onclick="editProduct(${p.id})">Editar</button>
                        <button class="btn" style="padding: 4px 8px; font-size: 12px; background-color: #e74c3c;" onclick="deleteProduct(${p.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch(e) { console.error(e); }
}

function showAddProductForm() {
    document.getElementById('product-modal').style.display = 'flex';
    document.getElementById('product-modal-title').innerText = 'Nuevo Producto';
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-barcode').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-wholesale').value = '';
    document.getElementById('prod-cost').value = '';
    document.getElementById('prod-stock').value = '';
    document.getElementById('prod-origin').value = 'Nacional';
}

function editProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if(!p) return;
    
    document.getElementById('product-modal').style.display = 'flex';
    document.getElementById('product-modal-title').innerText = 'Editar Producto';
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-barcode').value = p.barcode;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-wholesale').value = p.wholesale_price;
    document.getElementById('prod-cost').value = p.cost;
    document.getElementById('prod-stock').value = p.stock;
    document.getElementById('prod-origin').value = p.origin;
}

function deleteProduct(id) {
    if(confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        fetch(`/api/products/${id}`, {
            method: 'DELETE'
        }).then(r => r.json()).then(res => {
            if(res.success) {
                loadInventory();
            } else {
                alert('Error: ' + res.error);
            }
        });
    }
}

function saveProduct() {
    const id = document.getElementById('prod-id').value;
    const data = {
        name: document.getElementById('prod-name').value,
        barcode: document.getElementById('prod-barcode').value,
        price: document.getElementById('prod-price').value,
        wholesale_price: document.getElementById('prod-wholesale').value,
        cost: document.getElementById('prod-cost').value,
        stock: document.getElementById('prod-stock').value,
        origin: document.getElementById('prod-origin').value
    };
    
    if(!data.name || !data.barcode || !data.price) return alert('Nombre, Código y Precio son obligatorios');

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/products/${id}` : '/api/products';

    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if(res.success) {
            document.getElementById('product-modal').style.display = 'none';
            loadInventory();
        } else {
            alert('Error: ' + res.error);
        }
    });
}

// --- PUNTO DE VENTA (POS) ---
const barcodeInput = document.getElementById('barcode-input');

barcodeInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const val = this.value.trim();
        if(val) {
            searchAndAddProduct(val);
            this.value = ''; // limpiar
            document.getElementById('search-results').innerHTML = '';
        }
    }
});

barcodeInput.addEventListener('input', function(e) {
    const val = this.value.trim().toLowerCase();
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    
    if(val.length >= 2) {
        const matches = allProducts.filter(p => p.name.toLowerCase().includes(val) || p.barcode.includes(val));
        matches.forEach(p => {
            const div = document.createElement('div');
            div.style.padding = '10px';
            div.style.border = '1px solid #eee';
            div.style.borderRadius = '5px';
            div.style.cursor = 'pointer';
            div.innerHTML = `<strong>${p.name}</strong> - Detal: $${p.price.toLocaleString('es-CO')} | Mayor: $${p.wholesale_price.toLocaleString('es-CO')} (Stock: ${p.stock})`;
            div.onclick = () => {
                addToCart(p);
                barcodeInput.value = '';
                resultsDiv.innerHTML = '';
                barcodeInput.focus();
            };
            resultsDiv.appendChild(div);
        });
    }
});

// --- BUSCADOR GLOBAL (TOPBAR) ---
const globalSearch = document.querySelector('.topbar input');
if(globalSearch) {
    globalSearch.addEventListener('input', function(e) {
        const val = this.value;
        if(val.length > 0) {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelector('.nav-item[data-target="sales"]').classList.add('active');
            document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
            document.getElementById('view-sales').classList.add('active');
            
            barcodeInput.value = val;
            barcodeInput.focus();
            barcodeInput.dispatchEvent(new Event('input'));
            
            this.value = '';
        }
    });
}

function searchAndAddProduct(query) {
    const p = allProducts.find(x => x.barcode === query || x.name.toLowerCase() === query.toLowerCase());
    if(p) {
        addToCart(p);
    } else {
        alert("Producto no encontrado");
    }
}

function addToCart(product) {
    const existing = cart.find(x => x.product_id === product.id);
    if(existing) {
        if(existing.quantity >= product.stock) {
            alert("No hay suficiente stock para este producto");
            return;
        }
        existing.quantity++;
    } else {
        if(product.stock < 1) {
            alert("Producto sin stock");
            return;
        }
        cart.push({
            product_id: product.id,
            name: product.name,
            quantity: 1,
            manualPrice: 'Auto',
            price: 0 // Se calculará ahora
        });
    }
    updateCartPrices();
}

function updateCartPrices() {
    const clientId = document.getElementById('pos-client').value;
    const client = allClients.find(c => c.id == clientId);
    const isWholesaleClient = client && client.client_type === 'Mayorista';

    cart.forEach(item => {
        const product = allProducts.find(x => x.id === item.product_id);
        if(!product) return;
        
        if (item.manualPrice === 'Custom') {
            // Respeta el precio manual digitado
            return;
        }
        
        if (item.manualPrice === 'Mayor') {
            item.price = product.wholesale_price;
        } else if (item.manualPrice === 'Detal') {
            item.price = product.price;
        } else { // Auto
            if (isWholesaleClient) {
                item.price = product.wholesale_price;
            } else if (product.origin === 'Importado' && item.quantity >= 4) {
                item.price = product.wholesale_price;
            } else if (product.origin === 'Nacional' && item.quantity >= 6) {
                item.price = product.wholesale_price;
            } else {
                item.price = product.price;
            }
        }
    });
    renderCart();
}

function forcePriceType(index, type) {
    cart[index].manualPrice = type;
    updateCartPrices();
}

function updateItemPrice(index, newPrice) {
    cart[index].price = parseFloat(newPrice) || 0;
    cart[index].manualPrice = 'Custom';
    renderCart(); // Solo renderizamos para no sobreescribir Custom en updateCartPrices
}

function increaseQuantity(index) {
    const item = cart[index];
    const product = allProducts.find(x => x.id === item.product_id);
    if(product && item.quantity >= product.stock) {
        alert("No hay suficiente stock para este producto");
        return;
    }
    cart[index].quantity++;
    updateCartPrices();
}

function decreaseQuantity(index) {
    if(cart[index].quantity > 1) {
        cart[index].quantity--;
        updateCartPrices();
    }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    let total = 0;
    
    let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr>
                    <th style="padding: 8px 5px; text-align: left; border-bottom: 2px solid #eee;">Ref</th>
                    <th style="padding: 8px 5px; text-align: left; border-bottom: 2px solid #eee;">Producto</th>
                    <th style="padding: 8px 5px; text-align: center; border-bottom: 2px solid #eee;">Cant</th>
                    <th style="padding: 8px 5px; text-align: left; border-bottom: 2px solid #eee;">P. Unit</th>
                    <th style="padding: 8px 5px; text-align: right; border-bottom: 2px solid #eee;">Total</th>
                    <th style="padding: 8px 5px; text-align: center; border-bottom: 2px solid #eee;"></th>
                </tr>
            </thead>
            <tbody>
    `;

    cart.forEach((item, index) => {
        const p = allProducts.find(x => x.id === item.product_id);
        const barcode = p ? p.barcode : '';
        total += item.price * item.quantity;
        
        let selectHtml = `
            <select onchange="forcePriceType(${index}, this.value)" style="margin-right: 5px; padding: 3px; font-size: 11px; border: 1px solid #ccc; border-radius: 4px; outline:none; background:#f9f9f9;">
                <option value="Auto" ${item.manualPrice === 'Auto' ? 'selected' : ''}>🤖 Auto</option>
                <option value="Detal" ${item.manualPrice === 'Detal' ? 'selected' : ''}>👤 Detal</option>
                <option value="Mayor" ${item.manualPrice === 'Mayor' ? 'selected' : ''}>📦 Mayor</option>
                <option value="Custom" ${item.manualPrice === 'Custom' ? 'selected' : ''} disabled>✏️ Custom</option>
            </select>
        `;
        
        tableHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 5px;">${barcode}</td>
                <td style="padding: 10px 5px; font-weight: 600;">${item.name}</td>
                <td style="padding: 10px 5px; text-align: center;">
                    <div style="display:inline-flex; align-items:center; gap:8px; background: #f4f7fe; border-radius: 6px; padding: 4px;">
                        <button onclick="decreaseQuantity(${index})" style="width: 24px; height: 24px; border: none; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: var(--dark-purple); box-shadow: 0 1px 3px rgba(0,0,0,0.1);">-</button>
                        <span style="min-width: 20px; text-align: center; font-weight: bold;">${item.quantity}</span>
                        <button onclick="increaseQuantity(${index})" style="width: 24px; height: 24px; border: none; background: white; border-radius: 4px; cursor: pointer; font-weight: bold; color: var(--dark-purple); box-shadow: 0 1px 3px rgba(0,0,0,0.1);">+</button>
                    </div>
                </td>
                <td style="padding: 10px 5px;">
                    <div style="display:flex; align-items:center; gap:2px;">
                        ${selectHtml}
                        <span style="color:#666;">$</span>
                        <input type="number" value="${item.price}" 
                               onchange="updateItemPrice(${index}, this.value)" 
                               style="width: 70px; padding: 5px; border: 1px solid #e0e0e0; border-radius: 4px; font-weight: 500; outline:none;">
                    </div>
                </td>
                <td style="padding: 10px 5px; text-align: right; font-weight: bold; color: var(--dark-purple);">
                    $${(item.price * item.quantity).toLocaleString('es-CO')}
                </td>
                <td style="padding: 10px 5px; text-align: center;">
                    <button onclick="cart.splice(${index},1); updateCartPrices();" style="color: #e74c3c; background: rgba(231, 76, 60, 0.1); width:30px; height:30px; border-radius:50%; border: none; cursor: pointer; transition: 0.2s;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `</tbody></table>`;
    
    if (cart.length === 0) {
        tableHTML = `<div style="text-align:center; padding:30px; color:#999;"><i class="fas fa-shopping-cart" style="font-size:30px; margin-bottom:10px; opacity:0.5;"></i><br>El carrito está vacío</div>`;
    }
    
    container.innerHTML = tableHTML;
    document.getElementById('cart-total-amount').innerText = total.toLocaleString('es-CO');
    calculateChange();
}

function toggleCashInput() {
    const method = document.getElementById('payment-method').value;
    const calc = document.getElementById('cash-calculator');
    if(method === 'Efectivo') {
        calc.style.display = 'block';
    } else {
        calc.style.display = 'none';
        document.getElementById('cash-received').value = '';
        document.getElementById('change-amount').innerText = '0';
    }
}

function calculateChange() {
    const receivedStr = document.getElementById('cash-received').value;
    const received = parseFloat(receivedStr) || 0;
    
    let total = 0;
    cart.forEach(item => total += item.price * item.quantity);
    
    let change = received - total;
    if(change < 0) change = 0;
    
    document.getElementById('change-amount').innerText = change.toLocaleString('es-CO');
}

async function processSale() {
    if(cart.length === 0) return alert("El carrito está vacío");
    
    const paymentMethod = document.getElementById('payment-method').value;
    const saleType = document.querySelector('input[name="sale_type"]:checked').value;
    const clientId = document.getElementById('pos-client').value;
    
    try {
        const res = await fetch('/api/sales', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                items: cart,
                payment_method: paymentMethod,
                sale_type: saleType,
                client_id: clientId
            })
        });
        const data = await res.json();
        
        if(data.success) {
            printReceipt(data.sale, cart);
            cart = [];
            updateCartPrices();
            fetchProducts();
            loadDashboard(); // actualizar métricas
        } else {
            alert("Error: " + data.error);
        }
    } catch(e) {
        alert("Error de conexión");
    }
}

function printReceipt(sale, items) {
    document.getElementById('print-date').innerText = sale.date;
    document.getElementById('print-total').innerText = sale.total.toLocaleString('es-CO');
    document.getElementById('print-type').innerText = " - " + (sale.sale_type || 'Detal') + " - " + sale.client_name;
    document.getElementById('print-method').innerText = "Método: " + (sale.payment_method || 'Efectivo');
    
    const itemsContainer = document.getElementById('print-items');
    itemsContainer.innerHTML = '';
    items.forEach(item => {
        itemsContainer.innerHTML += `
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${(item.price * item.quantity).toLocaleString('es-CO')}</span>
            </div>
        `;
    });
    
    // Imprimir
    document.getElementById('print-section').style.display = 'block';
    window.print();
    document.getElementById('print-section').style.display = 'none';
}
