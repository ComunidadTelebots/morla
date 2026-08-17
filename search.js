// Indice global de la web
const searchIndex = [
  { title: "Historia", url: "/historia/index.html", keywords: "historia pasado madoz romanos origen antigua tradicion" },
  { title: "Geografía y Naturaleza", url: "/turismo/index.html", keywords: "geografia naturaleza turismo montañas teleno cabrera eria rios cuarzo paisaje rutas" },
  { title: "Patrimonio y Arquitectura", url: "/patrimonio/index.html", keywords: "patrimonio arquitectura iglesia ermita cristo casas piedra madera adobe construccion tradicional" },
  { title: "Eventos y Fiestas", url: "/eventos/index.html", keywords: "eventos fiestas celebraciones san bartolo san isidro agosto mayo musica orquesta baile" },
  { title: "Asociación Los Castaños", url: "/asociacion/index.html", keywords: "asociacion los castaños jovenes organizar participar comunidad cultura" },
  { title: "Blog y Noticias", url: "/blog/index.html", keywords: "blog noticias actualidad novedades anuncios" }
];

document.addEventListener('DOMContentLoaded', () => {
  // Inyectar el HTML del buscador en el DOM si no existe
  if (!document.getElementById('search-modal')) {
    const modalHTML = `
      <div id="search-modal" class="search-modal hidden">
        <div class="search-modal-backdrop"></div>
        <div class="search-modal-content">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="search-input" placeholder="¿Qué buscas? (ej. fiestas, iglesia, naturaleza...)" autocomplete="off">
            <button id="search-close" aria-label="Cerrar">✕</button>
          </div>
          <div id="search-results" class="search-results">
            <!-- Results will be injected here -->
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  const searchTriggers = document.querySelectorAll('.search-trigger');
  const searchModal = document.getElementById('search-modal');
  const searchBackdrop = document.querySelector('.search-modal-backdrop');
  const searchClose = document.getElementById('search-close');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  const openSearch = (e) => {
    e.preventDefault();
    searchModal.classList.remove('hidden');
    setTimeout(() => searchInput.focus(), 100);
  };

  const closeSearch = () => {
    searchModal.classList.add('hidden');
    searchInput.value = '';
    searchResults.innerHTML = '';
  };

  // Event Listeners
  searchTriggers.forEach(trigger => trigger.addEventListener('click', openSearch));
  searchClose.addEventListener('click', closeSearch);
  searchBackdrop.addEventListener('click', closeSearch);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
      closeSearch();
    }
  });

  // Logica de busqueda
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    searchResults.innerHTML = '';

    if (query.length < 2) {
      return;
    }

    const results = searchIndex.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchKeywords = item.keywords.toLowerCase().includes(query);
      return matchTitle || matchKeywords;
    });

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="no-results">No se han encontrado resultados.</div>';
      return;
    }

    results.forEach(result => {
      const link = document.createElement('a');
      // Determinar si necesitamos subir un directorio (estamos en subpaginas)
      const isSubpage = window.location.pathname.split('/').length > 2 && window.location.pathname !== '/index.html' && window.location.pathname !== '/';
      const pathPrefix = isSubpage ? '..' : '.';
      
      link.href = pathPrefix + result.url;
      link.className = 'search-result-item';
      link.innerHTML = `
        <h4>${result.title}</h4>
        <span class="search-arrow">➔</span>
      `;
      link.addEventListener('click', () => {
        closeSearch();
      });
      searchResults.appendChild(link);
    });
  });
});
