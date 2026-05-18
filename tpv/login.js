const params = new URLSearchParams(window.location.search);
document.getElementById('authError').hidden = !params.has('error');

const next = params.get('next');
if (next && next.startsWith('/') && !next.startsWith('//')) {
  document.querySelector('.auth-form').action = `/login?next=${encodeURIComponent(next)}`;
}
