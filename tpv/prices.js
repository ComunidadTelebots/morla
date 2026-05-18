let csrfToken = '';
let products = [];

const priceList = document.getElementById('priceList');
const priceNote = document.getElementById('priceNote');
const savePrices = document.getElementById('savePrices');

const currency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 401) window.location.href = '/login';
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'No se pudo completar la operacion');
  }
  return response.json();
}

function renderPrices() {
  priceList.innerHTML = '';
  products.forEach((product) => {
    const row = document.createElement('label');
    row.className = 'price-row';
    row.innerHTML = `
      <span>
        <strong>${product.name}</strong>
        <small>${product.category} · ${currency.format(product.price)}</small>
      </span>
      <input type="number" min="0" max="999" step="0.05" value="${product.price}" data-product-id="${product.id}" />
    `;
    priceList.appendChild(row);
  });
}

async function loadEditor() {
  const session = await requestJson('/api/session');
  if (!session.canEditPrices) {
    window.location.href = '/tpv/index.html';
    return;
  }
  csrfToken = session.csrf;
  const payload = await requestJson('/api/products');
  products = payload.products;
  renderPrices();
}

savePrices.addEventListener('click', async () => {
  const updated = products.map((product) => {
    const input = priceList.querySelector(`[data-product-id="${product.id}"]`);
    return { ...product, price: Number(input.value) };
  });

  savePrices.disabled = true;
  priceNote.textContent = 'Guardando...';
  try {
    const payload = await requestJson('/api/products', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ products: updated }),
    });
    products = payload.products;
    renderPrices();
    priceNote.textContent = 'Precios actualizados';
  } catch (error) {
    priceNote.textContent = error.message;
  } finally {
    savePrices.disabled = false;
  }
});

loadEditor().catch((error) => {
  priceNote.textContent = error.message;
});
