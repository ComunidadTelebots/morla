let products = [];

function getLocalSession() {
  try {
    const data = JSON.parse(localStorage.getItem('morla_local_session'));
    if (!data) return null;
    if (data.expires_at && data.expires_at < Date.now()) {
      localStorage.removeItem('morla_local_session');
      return null;
    }
    return data;
  } catch { return null; }
}

function clearLocalSession() {
  localStorage.removeItem('morla_local_session');
}

async function hashPassword(username, password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(username), iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const state = {
  cart: new Map(),
  category: 'todo',
  query: '',
  method: 'Tarjeta',
};

const currency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

const productGrid = document.getElementById('productGrid');
const ticketItems = document.getElementById('ticketItems');
const subtotalNode = document.getElementById('subtotal');
const taxNode = document.getElementById('tax');
const totalNode = document.getElementById('total');
const payButton = document.getElementById('payButton');
const saleNote = document.getElementById('saleNote');
const searchInput = document.getElementById('searchInput');
const emptyTicketTemplate = document.getElementById('emptyTicketTemplate');
const sessionUser = document.getElementById('sessionUser');
const priceEditorLink = document.getElementById('priceEditorLink');

function money(value) {
  return currency.format(value);
}

function addProduct(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const current = state.cart.get(productId) || { product, quantity: 0 };
  current.quantity += 1;
  state.cart.set(productId, current);
  saleNote.textContent = `${product.name} anadido`;
  render();
}

function updateQuantity(productId, delta) {
  const current = state.cart.get(productId);
  if (!current) return;

  current.quantity += delta;
  if (current.quantity <= 0) {
    state.cart.delete(productId);
  } else {
    state.cart.set(productId, current);
  }

  render();
}

function totals() {
  const total = Array.from(state.cart.values()).reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);
  const tax = total - total / 1.1;
  const subtotal = total - tax;

  return { subtotal, tax, total };
}

function filteredProducts() {
  const query = state.query.trim().toLowerCase();
  return products.filter((product) => {
    const matchesCategory = state.category === 'todo' || product.category === state.category;
    const matchesQuery = !query || product.name.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
}

function renderProducts() {
  productGrid.innerHTML = '';

  if (products.length === 0) {
    productGrid.innerHTML = '<div class="empty-ticket"><strong>Cargando catalogo</strong><span>Un momento.</span></div>';
    return;
  }

  filteredProducts().forEach((product) => {
    const button = document.createElement('button');
    button.className = 'product-card';
    button.type = 'button';
    button.dataset.productId = product.id;
    button.innerHTML = `
      <span class="product-icon">${product.shortcut}</span>
      <span>
        <strong>${product.name}</strong>
        <span>${product.category}</span>
      </span>
      <span class="product-price">${money(product.price)}</span>
    `;
    productGrid.appendChild(button);
  });
}

function renderTicket() {
  ticketItems.innerHTML = '';

  if (state.cart.size === 0) {
    ticketItems.appendChild(emptyTicketTemplate.content.cloneNode(true));
    return;
  }

  state.cart.forEach(({ product, quantity }) => {
    const row = document.createElement('article');
    row.className = 'ticket-row';
    row.innerHTML = `
      <div>
        <strong>${product.name}</strong>
        <span>${quantity} x ${money(product.price)} - ${money(product.price * quantity)}</span>
      </div>
      <div class="quantity-controls" aria-label="Cantidad de ${product.name}">
        <button class="quantity-button" data-action="decrease" data-product-id="${product.id}" type="button">-</button>
        <strong>${quantity}</strong>
        <button class="quantity-button" data-action="increase" data-product-id="${product.id}" type="button">+</button>
      </div>
    `;
    ticketItems.appendChild(row);
  });
}

function renderTotals() {
  const currentTotals = totals();
  subtotalNode.textContent = money(currentTotals.subtotal);
  taxNode.textContent = money(currentTotals.tax);
  totalNode.textContent = money(currentTotals.total);
  payButton.textContent = `Cobrar ${money(currentTotals.total)}`;
  payButton.disabled = currentTotals.total === 0;
}

function renderTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.category === state.category);
  });
}

function renderMethods() {
  document.querySelectorAll('.method').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.method === state.method);
  });
}

function render() {
  renderProducts();
  renderTicket();
  renderTotals();
  renderTabs();
  renderMethods();
}

productGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.product-card');
  if (card) addProduct(card.dataset.productId);
});

ticketItems.addEventListener('click', (event) => {
  const button = event.target.closest('.quantity-button');
  if (!button) return;

  updateQuantity(button.dataset.productId, button.dataset.action === 'increase' ? 1 : -1);
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    state.category = tab.dataset.category;
    render();
  });
});

document.querySelectorAll('.method').forEach((button) => {
  button.addEventListener('click', () => {
    state.method = button.dataset.method;
    render();
  });
});

searchInput.addEventListener('input', () => {
  state.query = searchInput.value;
  renderProducts();
});

document.getElementById('clearSale').addEventListener('click', () => {
  state.cart.clear();
  saleNote.textContent = 'Venta limpiada';
  render();
});

payButton.addEventListener('click', () => {
  const currentTotals = totals();
  if (currentTotals.total === 0) return;

  saleNote.textContent = `Cobro de ${money(currentTotals.total)} registrado por ${state.method}`;
  state.cart.clear();
  render();
});

async function loadJson(url) {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (response.status === 401) {
    window.location.href = '/login';
    return null;
  }
  if (!response.ok) throw new Error('No se pudo cargar el TPV');
  return response.json();
}

function useLocalMode(session) {
  sessionUser.textContent = `${session.username} · ${session.role} · local`;
  priceEditorLink.classList.add('hidden');

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', e => {
      e.preventDefault();
      clearLocalSession();
      location.reload();
    });
  }

  try {
    const payload = JSON.parse(localStorage.getItem('morla_products') || '{"products":[]}');
    products = Array.isArray(payload.products) ? payload.products : [];
  } catch {}
  render();
}

function showLocalLogin() {
  const overlay = document.createElement('div');
  overlay.className = 'login-overlay';
  overlay.innerHTML = `
    <div class="auth-form offline-login-form">
      <div>
        <p class="eyebrow">Sin conexion</p>
        <h1>Acceso local</h1>
      </div>
      <form id="offlineLoginForm" class="login-inner-form">
        <label>Usuario<input name="username" type="text" autocomplete="username" required /></label>
        <label>Contrasena<input name="password" type="password" autocomplete="current-password" required /></label>
        <p class="auth-error" id="offlineError" hidden>Usuario o contrasena incorrectos.</p>
        <button class="pay-button" type="submit">Entrar</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('offlineLoginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = e.target.elements.username.value.trim();
    const password = e.target.elements.password.value;
    const errorEl = document.getElementById('offlineError');
    errorEl.hidden = true;

    let users = [];
    try { users = JSON.parse(localStorage.getItem('morla_local_users') || '[]'); } catch {}

    const user = users.find(u => u.username === username);
    if (!user) { errorEl.hidden = false; return; }

    const hash = await hashPassword(username, password);
    if (hash !== user.passwordHash) { errorEl.hidden = false; return; }

    localStorage.setItem('morla_local_session', JSON.stringify({
      username: user.username,
      role: user.role,
      local: true,
      expires_at: Date.now() + 12 * 60 * 60 * 1000,
    }));

    overlay.remove();
    useLocalMode(getLocalSession());
  });
}

async function init() {
  render();

  const localSession = getLocalSession();
  if (localSession) {
    useLocalMode(localSession);
    return;
  }

  let session;
  try {
    session = await loadJson('/api/session');
  } catch {
    showLocalLogin();
    return;
  }
  if (!session) return;

  sessionUser.textContent = `${session.username} · ${session.role}`;
  priceEditorLink.classList.toggle('hidden', !session.canEditPrices);

  const payload = await loadJson('/api/products');
  if (!payload) return;
  products = payload.products;
  localStorage.setItem('morla_products', JSON.stringify(payload));
  render();
}

init().catch(() => {
  saleNote.textContent = 'No se pudo cargar el catalogo';
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
