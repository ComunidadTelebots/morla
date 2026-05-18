const contactButton = document.getElementById('contactButton');
const messageArea = document.getElementById('messageArea');
const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const siteNav = document.querySelector('.site-nav');
const cookieConsentKey = 'morlaCookieConsent';

if (contactButton && messageArea) {
  contactButton.addEventListener('click', () => {
    messageArea.textContent = 'Gracias por tu interés. La web sigue en construcción: pronto añadiremos un formulario de contacto, fotos y más datos de Morla.';
    messageArea.classList.remove('hidden');
  });
}

if (mobileNavToggle && siteNav) {
  mobileNavToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    mobileNavToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

if (localStorage.getItem(cookieConsentKey) !== 'accepted') {
  const cookieBanner = document.createElement('section');
  cookieBanner.className = 'cookie-banner';
  cookieBanner.setAttribute('aria-label', 'Aviso de cookies');
  cookieBanner.innerHTML = `
    <div class="cookie-copy">
      <h2>Cookies</h2>
      <p>Usamos cookies de analítica para conocer visitas y mejorar la web de Morla de la Valdería.</p>
    </div>
    <button class="cookie-accept" type="button">Aceptar cookies</button>
  `;

  document.body.appendChild(cookieBanner);

  cookieBanner.querySelector('.cookie-accept').addEventListener('click', () => {
    localStorage.setItem(cookieConsentKey, 'accepted');
    window.enableAnalytics?.();
    cookieBanner.remove();
  });
}

// Aquí se pueden añadir futuras llamadas al servidor de traffick
// por ejemplo: fetch('/api/status').then(...) si se integra con backend.
