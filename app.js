const contactButton = document.getElementById('contactButton');
const messageArea = document.getElementById('messageArea');

contactButton.addEventListener('click', () => {
  messageArea.textContent = 'Gracias por tu interés. La web sigue en construcción: pronto añadiremos un formulario de contacto, fotos y más datos de Morla.';
  messageArea.classList.remove('hidden');
});

// Aquí se pueden añadir futuras llamadas al servidor de traffick
// por ejemplo: fetch('/api/status').then(...) si se integra con backend.
