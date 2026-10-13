const menuItems = [
  { id: 1, name: 'Burger Clássico', category: 'Comidas', price: 29.9 },
  { id: 2, name: 'Burger Duplo', category: 'Comidas', price: 39.9 },
  { id: 3, name: 'Batata Frita', category: 'Comidas', price: 18.5 },
  { id: 4, name: 'Pizza de Calabresa', category: 'Comidas', price: 42.0 },
  { id: 5, name: 'Refrigerante', category: 'Bebidas', price: 8.5 },
  { id: 6, name: 'Suco Natural', category: 'Bebidas', price: 12.0 },
  { id: 7, name: 'Água Mineral', category: 'Bebidas', price: 6.0 },
  { id: 8, name: 'Milkshake', category: 'Bebidas', price: 15.0 },
];

const state = { cart: [] };

const menuList = document.querySelector('#menuList');
const cartItems = document.querySelector('#cartItems');
const totalAmount = document.querySelector('#totalAmount');
const itemCount = document.querySelector('#itemCount');
const checkoutBtn = document.querySelector('#checkoutBtn');
const clearCartBtn = document.querySelector('#clearCartBtn');
const orderModal = document.querySelector('#orderModal');
const modalSummary = document.querySelector('#modalSummary');
const closeModalBtn = document.querySelector('#closeModalBtn');
const cancelOrderBtn = document.querySelector('#cancelOrderBtn');
const confirmOrderBtn = document.querySelector('#confirmOrderBtn');

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value).replace(/\u00A0/g, ' ');
}

function addItemToCart(cart, item, quantity = 1) {
  const itemIndex = cart.findIndex((cartItem) => cartItem.id === item.id);
  if (itemIndex >= 0) {
    const updatedCart = [...cart];
    updatedCart[itemIndex] = {
      ...updatedCart[itemIndex],
      quantity: updatedCart[itemIndex].quantity + quantity,
    };
    return updatedCart;
  }
  return [...cart, { ...item, quantity }];
}

function updateCartItemQuantity(cart, itemId, quantity) {
  if (quantity <= 0) return cart.filter((item) => item.id !== itemId);
  return cart.map((item) => item.id === itemId ? { ...item, quantity } : item);
}

function calculateCartTotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function buildOrderSummary(cart, customerName = 'Cliente') {
  const items = cart.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    subtotal: item.price * item.quantity,
  }));
  const total = calculateCartTotal(cart);
  return { customerName, items, total, itemCount: items.reduce((count, item) => count + item.quantity, 0) };
}

function renderMenu() {
  const groupedItems = menuItems.reduce((groups, item) => {
    const key = item.category;
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});

  menuList.innerHTML = Object.entries(groupedItems).map(([category, items]) => `
    <div class="category-group">
      <h3>${category}</h3>
      <div class="menu-list-items">
        ${items.map((item) => {
          const cartItem = state.cart.find((selected) => selected.id === item.id);
          const quantity = cartItem ? cartItem.quantity : 1;
          return `
            <article class="menu-item">
              <span class="item-tag">${item.category}</span>
              <h3>${item.name}</h3>
              <p class="item-price">${formatCurrency(item.price)}</p>
              <div class="item-actions">
                <div class="quantity-control">
                  <button type="button" data-action="decrease-item" data-id="${item.id}">−</button>
                  <span>${quantity}</span>
                  <button type="button" data-action="increase-item" data-id="${item.id}">+</button>
                </div>
                <button type="button" class="primary-btn" data-action="add-item" data-id="${item.id}">Adicionar</button>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function renderCart() {
  renderMenu();
  if (!state.cart.length) {
    cartItems.innerHTML = '<div class="empty-cart">Seu carrinho está vazio. Escolha um item do cardápio.</div>';
    totalAmount.textContent = formatCurrency(0);
    itemCount.textContent = '0';
    return;
  }

  cartItems.innerHTML = state.cart.map((item) => `
    <div class="cart-item" data-cart-item="${item.id}">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">${formatCurrency(item.price)} cada</span>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-control">
          <button type="button" data-action="decrease-cart" data-id="${item.id}">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase-cart" data-id="${item.id}">+</button>
        </div>
      </div>
    </div>
  `).join('');

  const total = calculateCartTotal(state.cart);
  const quantityTotal = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  totalAmount.textContent = formatCurrency(total);
  itemCount.textContent = String(quantityTotal);
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 200);
  }, 1800);
}

function addItem(itemId, quantity = 1) {
  const selectedItem = menuItems.find((item) => item.id === Number(itemId));
  if (!selectedItem) return;
  state.cart = addItemToCart(state.cart, selectedItem, quantity);
  renderCart();
}

function handleQuantityAction(itemId, action) {
  const currentItem = state.cart.find((item) => item.id === Number(itemId));
  if (!currentItem) return;

  if (action === 'increase') {
    state.cart = updateCartItemQuantity(state.cart, Number(itemId), currentItem.quantity + 1);
  }
  if (action === 'decrease') {
    if (currentItem.quantity <= 1) {
      state.cart = state.cart.filter((item) => item.id !== Number(itemId));
    } else {
      state.cart = updateCartItemQuantity(state.cart, Number(itemId), currentItem.quantity - 1);
    }
  }
  renderCart();
}

function showOrderSummary() {
  if (!state.cart.length) {
    alert('Adicione pelo menos um item ao carrinho antes de finalizar.');
    return;
  }

  const summary = buildOrderSummary(state.cart, 'Cliente');
  modalSummary.innerHTML = `
    <div class="summary-item"><span>Cliente</span><strong>${summary.customerName}</strong></div>
    ${summary.items.map((item) => `
      <div class="summary-item"><span>${item.name} x ${item.quantity}</span><strong>${formatCurrency(item.subtotal)}</strong></div>
    `).join('')}
    <div class="summary-total"><span>Total</span><strong>${formatCurrency(summary.total)}</strong></div>
  `;
  orderModal.classList.remove('hidden');
  orderModal.setAttribute('aria-hidden', 'false');
}

function closeOrderSummary() {
  orderModal.classList.add('hidden');
  orderModal.setAttribute('aria-hidden', 'true');
}

menuList.addEventListener('click', (event) => {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;

  const { action, id } = actionTarget.dataset;
  if (action === 'add-item') {
    addItem(id, 1);
    showToast('Item adicionado ao carrinho');
  }
  if (action === 'increase-item') {
    addItem(id, 1);
  }
  if (action === 'decrease-item') {
    const selected = state.cart.find((item) => item.id === Number(id));
    if (!selected) return;
    if (selected.quantity <= 1) {
      state.cart = state.cart.filter((item) => item.id !== Number(id));
    } else {
      state.cart = updateCartItemQuantity(state.cart, Number(id), selected.quantity - 1);
    }
    renderCart();
  }
});

cartItems.addEventListener('click', (event) => {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;

  const { action, id } = actionTarget.dataset;
  if (action === 'increase-cart') handleQuantityAction(id, 'increase');
  if (action === 'decrease-cart') handleQuantityAction(id, 'decrease');
});

checkoutBtn.addEventListener('click', showOrderSummary);
clearCartBtn.addEventListener('click', () => {
  state.cart = [];
  renderCart();
  showToast('Carrinho limpo');
});
closeModalBtn.addEventListener('click', closeOrderSummary);
cancelOrderBtn.addEventListener('click', closeOrderSummary);
confirmOrderBtn.addEventListener('click', () => {
  const order = buildOrderSummary(state.cart, 'Cliente');
  showToast(`Pedido confirmado! Total: ${formatCurrency(order.total)}`);
  closeOrderSummary();
  state.cart = [];
  renderCart();
});

orderModal.addEventListener('click', (event) => {
  if (event.target === orderModal) closeOrderSummary();
});

renderCart();
