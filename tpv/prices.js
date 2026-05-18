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

// --- Usuarios locales ---

async function hashPassword(username, password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(username), iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem('morla_local_users') || '[]'); } catch { return []; }
}

function saveLocalUsers(users) {
  localStorage.setItem('morla_local_users', JSON.stringify(users));
}

function renderUsers() {
  const list = document.getElementById('userList');
  const users = getLocalUsers();
  list.innerHTML = '';
  if (!users.length) {
    list.innerHTML = '<p class="sale-note">No hay usuarios locales creados.</p>';
    return;
  }
  users.forEach(user => {
    const row = document.createElement('div');
    row.className = 'price-row';
    row.innerHTML = `
      <span>
        <strong>${user.username}</strong>
        <small>${user.role}</small>
      </span>
      <button class="ghost-button" data-username="${user.username}" type="button">Eliminar</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-username]').forEach(btn => {
    btn.addEventListener('click', () => {
      saveLocalUsers(getLocalUsers().filter(u => u.username !== btn.dataset.username));
      renderUsers();
    });
  });
}

document.getElementById('addUserForm').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;
  const note = document.getElementById('userNote');

  const users = getLocalUsers();
  if (users.find(u => u.username === username)) {
    note.textContent = 'Ese nombre de usuario ya existe.';
    return;
  }

  const passwordHash = await hashPassword(username, password);
  users.push({ username, passwordHash, role });
  saveLocalUsers(users);
  renderUsers();
  e.target.reset();
  note.textContent = `Usuario "${username}" creado.`;
});

renderUsers();

// --- Copia de seguridad ---

document.getElementById('exportBackup').addEventListener('click', () => {
  const backup = {
    products,
    users: getLocalUsers(),
    exported_at: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `morla-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById('backupNote').textContent = 'Copia exportada correctamente.';
});

document.getElementById('importFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const note = document.getElementById('backupNote');
  try {
    const backup = JSON.parse(await file.text());
    if (backup.products && Array.isArray(backup.products)) {
      localStorage.setItem('morla_products', JSON.stringify({ products: backup.products }));
    }
    if (backup.users && Array.isArray(backup.users)) {
      saveLocalUsers(backup.users);
      renderUsers();
    }
    note.textContent = 'Copia importada correctamente.';
  } catch {
    note.textContent = 'Error al importar. Verifica el formato del fichero.';
  }
  e.target.value = '';
});
