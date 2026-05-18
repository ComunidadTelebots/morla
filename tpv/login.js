const params = new URLSearchParams(location.search);
if (params.get('error')) {
  document.getElementById('authError').hidden = false;
}

document.querySelectorAll('[data-login-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-login-tab]').forEach(t =>
      t.classList.toggle('is-active', t === tab)
    );
    document.getElementById('serverForm').hidden = tab.dataset.loginTab !== 'server';
    document.getElementById('localForm').hidden = tab.dataset.loginTab !== 'local';
  });
});

async function hashPassword(username, password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(username), iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.getElementById('localLoginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const username = e.target.elements.username.value.trim();
  const password = e.target.elements.password.value;
  const errorEl = document.getElementById('localError');
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

  const next = params.get('next') || '/tpv/index.html';
  location.href = /^\/[^/]/.test(next) ? next : '/tpv/index.html';
});
