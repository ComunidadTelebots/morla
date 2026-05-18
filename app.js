const contactButton = document.getElementById('contactButton');
const messageArea = document.getElementById('messageArea');
const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const siteNav = document.querySelector('.site-nav');

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

// Aquí se pueden añadir futuras llamadas al servidor de traffick
// por ejemplo: fetch('/api/status').then(...) si se integra con backend.
