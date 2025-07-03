document.addEventListener('DOMContentLoaded', async () => {
  // Carregar configurações da API do servidor
  let API_CONFIG;
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      API_CONFIG = {
        ...config,
        ENDPOINTS: {
          MEDIA_ITEMS: '/media-items',
          MEDIA_ITEM: (id) => `/media-items/${id}`,
          SEARCH: '/search',
          STATS: '/stats'
        },
        DEFAULT_HEADERS: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
    } else {
      throw new Error('Falha ao carregar configurações da API');
    }
  } catch (error) {
    console.error('Erro ao carregar configurações da API:', error);
    // Fallback para configurações padrão
    API_CONFIG = {
      API_KEY: 'e476cca32fa8443da410678adfbff88e',
      TMDB_API_KEY: 'fd8bf0bc323c658526632584143ae68c',
      RAWG_API_KEY: 'e476cca32fa8443da410678adfbff88e',
      YOUTUBE_API_KEY: 'AIzaSyCuMkHt34DH7mvzKRKuqGcBqlg4ctYLqwI',
      API_BASE_URL: 'http://localhost:3000/api',
      TIMEOUT: 10000,
      MAX_RETRIES: 3,
      ENDPOINTS: {
        MEDIA_ITEMS: '/media-items',
        MEDIA_ITEM: (id) => `/media-items/${id}`,
        SEARCH: '/search',
        STATS: '/stats'
      },
      DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  }

  const addMediaButton = document.getElementById('add-media-button');
  const addMediaModal = document.getElementById('add-media-modal');
  const closeModalButton = document.getElementById('close-modal-button');
  const cancelButton = document.getElementById('cancel-button');
  const addMediaForm = document.getElementById('add-media-form');
  const mediaGrid = document.getElementById('media-grid');

  // --- Variáveis para o modal de visualização ---
  const viewMediaModal = document.getElementById('view-media-modal');
  const closeViewModalButton = document.getElementById('close-view-modal-button');
  const closeViewModalButton2 = document.getElementById('close-view-modal-button-2');
  const mediaDetailsContent = document.getElementById('media-details-content');

  // --- Variáveis para o modal de confirmação de exclusão ---
  const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
  const cancelDeleteButton = document.getElementById('cancel-delete-button');
  const confirmDeleteButton = document.getElementById('confirm-delete-button');
  const deleteItemTitle = document.getElementById('delete-item-title');
  let cardToDelete = null;

  // --- Variáveis para busca rápida no formulário ---
  const mediaSearchInput = document.getElementById('media-search-input');
  const mediaSearchResults = document.getElementById('media-search-results');

  // --- Variáveis para busca ---
  const searchInput = document.getElementById('search-input');
  let searchTerm = '';

  // --- Variáveis para máscara de data ---
  const dateInput = document.getElementById('media-year');

  // --- Variáveis para indicador de carregamento ---
  const loadingIndicator = document.getElementById('loading-indicator');
  const loadingBar = document.getElementById('loading-bar');

  let cardBeingEdited = null;
  let mediaItems = []; // Array para armazenar todos os itens
  let currentFilter = 'all'; // Filtro atual

  // --- Funções para indicador de carregamento ---
  function showLoading() {
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
      loadingBar.style.width = '0%';
      setTimeout(() => {
        loadingBar.style.width = '90%';
      }, 100);
    }
  }

  function hideLoading() {
    if (loadingIndicator) {
      loadingBar.style.width = '100%';
      setTimeout(() => {
        loadingIndicator.style.display = 'none';
        loadingBar.style.width = '0%';
      }, 300);
    }
  }

  // --- Funções de debounce para busca ---
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // --- Função para mostrar notificações ---
  function showNotification(message, type = 'info') {
    // Remove notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    const colors = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-black',
      info: 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${colors[type] || colors.info}`;
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <span>${message}</span>
        <button class="notification-close text-lg font-bold hover:opacity-70">&times;</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Anima a entrada
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove após 5 segundos
    setTimeout(() => {
      notification.style.transform = 'translateX(full)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 5000);
    
    // Botão de fechar
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.style.transform = 'translateX(full)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    });
  }

  // --- Funções para API ---
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
        'X-API-Key': API_CONFIG.API_KEY
      },
      timeout: API_CONFIG.TIMEOUT
    };

    let retries = 0;
    
    while (retries < API_CONFIG.MAX_RETRIES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        const response = await fetch(url, { 
          ...defaultOptions, 
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        
        // Lida com respostas sem conteúdo (ex: DELETE com status 204)
        if (response.status === 204) {
          return null;
        }

        return await response.json();
      } catch (error) {
        retries++;
        console.error(`Tentativa ${retries} falhou:`, error);
        
        if (retries >= API_CONFIG.MAX_RETRIES) {
          throw error;
        }
        
        // Aguarda um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  async function loadMediaItems() {
    showLoading();
    
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.MEDIA_ITEMS);
      mediaItems = data.items || [];
      renderAllMediaCards();
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      // Fallback para localStorage em caso de erro
      const saved = localStorage.getItem('mediaItems');
      if (saved) {
        mediaItems = JSON.parse(saved);
        renderAllMediaCards();
      } else {
        updateStats();
      }
      
      // Mostra mensagem de erro para o usuário
      showNotification('Erro ao carregar dados da API. Usando dados locais.', 'error');
    } finally {
      hideLoading();
    }
  }

  async function addMediaItem(mediaData) {
    const newItem = {
      id: Date.now(), // ID único para cada item
      status: mediaData.status || 'watchlist',
      favorite: false,
      ...mediaData
    };

    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.MEDIA_ITEMS, {
        method: 'POST',
        body: JSON.stringify(newItem)
      });
      
      const savedItem = response.item || newItem;
      mediaItems.unshift(savedItem);
      updateStats();
      showNotification('Item adicionado com sucesso!', 'success');
      return savedItem;
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      // Fallback para localStorage
      mediaItems.unshift(newItem);
      localStorage.setItem('mediaItems', JSON.stringify(mediaItems));
      updateStats();
      showNotification('Item salvo localmente devido a erro na API.', 'warning');
      return newItem;
    }
  }

  async function updateMediaItem(id, mediaData) {
    const index = mediaItems.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedItem = { ...mediaItems[index], ...mediaData };

    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.MEDIA_ITEM(id), {
        method: 'PUT',
        body: JSON.stringify(updatedItem)
      });
      
      const savedItem = response.item || updatedItem;
      mediaItems[index] = savedItem;
      updateStats();
      showNotification('Item atualizado com sucesso!', 'success');
      return savedItem;
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      // Fallback para localStorage
      mediaItems[index] = updatedItem;
      localStorage.setItem('mediaItems', JSON.stringify(mediaItems));
      updateStats();
      showNotification('Item atualizado localmente devido a erro na API.', 'warning');
      return updatedItem;
    }
  }

  async function deleteMediaItem(id) {
    try {
      await apiRequest(API_CONFIG.ENDPOINTS.MEDIA_ITEM(id), {
        method: 'DELETE'
      });
      
      mediaItems = mediaItems.filter(item => item.id !== id);
      updateStats();
      showNotification('Item excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      // Fallback para localStorage
      mediaItems = mediaItems.filter(item => item.id !== id);
      localStorage.setItem('mediaItems', JSON.stringify(mediaItems));
      updateStats();
      showNotification('Item excluído localmente devido a erro na API.', 'warning');
    }
  }

  // --- Função para buscar imagem ---
  async function fetchImage(title, type) {
    if (type === 'movie' && API_CONFIG.TMDB_API_KEY !== 'SUA_CHAVE_TMDB_AQUI') {
      try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
        }
      } catch (error) {
        console.error('Erro ao buscar imagem no TMDb:', error);
      }
    } else if (type === 'game' && API_CONFIG.RAWG_API_KEY !== 'SUA_CHAVE_RAWG_AQUI') {
      try {
        const response = await fetch(`https://api.rawg.io/api/games?key=${API_CONFIG.RAWG_API_KEY}&search=${encodeURIComponent(title)}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].background_image;
        }
      } catch (error) {
        console.error('Erro ao buscar imagem no RAWG:', error);
      }
    }
    return null; // Retorna nulo se não encontrar ou derro
  }

  // --- Função para buscar trailer no YouTube ---
  async function fetchTrailer(title, type, year = '') {
    if (API_CONFIG.YOUTUBE_API_KEY === 'SUA_CHAVE_YOUTUBE_AQUI') {
      return null; // Retorna nulo se não há chave configurada
    }

    try {
      const searchQuery = `${title} ${type === 'movie' ? 'trailer oficial' : 'gameplay trailer'} ${year}`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoDuration=short&maxResults=1&key=${API_CONFIG.YOUTUBE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    } catch (error) {
      console.error('Erro ao buscar trailer no YouTube:', error);
    }
    return null;
  }

  // --- Funções de Filtro ---
  function updateFilterButtons(activeFilter) {
    const filterButtons = [
      'filter-all', 'filter-movies', 'filter-games', 
      'filter-watchlist', 'filter-watching', 'filter-completed', 'filter-favorites'
    ];
    
    filterButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        if (buttonId === activeFilter) {
          button.className = 'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-blue-500 text-white shadow-lg';
        } else {
          button.className = 'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-800 text-gray-300 hover:bg-gray-700';
        }
      }
    });
  }

  function filterMediaItems(filter) {
    currentFilter = filter;
    updateFilterButtons(filter);
    
    // Se o filtro for "Todos", aplica o layout de duas colunas
    if (filter === 'filter-all') {
      applyTwoColumnLayout();
    } else {
      // Para outros filtros, usa o layout normal
      applyNormalLayout();
    }
  }

  // --- Função para aplicar layout de duas colunas ---
  function applyTwoColumnLayout() {
    // Limpa o grid e usa a estrutura original
    mediaGrid.innerHTML = '';

    // Renderiza todos os itens diretamente no mediaGrid
    mediaItems.forEach(item => {
      if (shouldShowItemInSearch(item, searchTerm)) {
        const card = createMediaCardElement(item);
        mediaGrid.appendChild(card);
      }
    });
  }

  // --- Função para aplicar layout normal ---
  function applyNormalLayout() {
    // Remove a estrutura de duas colunas se existir
    const twoColumnStructure = mediaGrid.querySelector('.grid-cols-1.lg\\:grid-cols-2');
    if (twoColumnStructure) {
      // Move todos os cards de volta para o grid principal
      const allCards = mediaGrid.querySelectorAll('.group');
      allCards.forEach(card => {
        mediaGrid.appendChild(card);
      });
      // Remove a estrutura de duas colunas
      twoColumnStructure.remove();
    }

    // Aplica o filtro normal
    const cards = mediaGrid.querySelectorAll('.group');
    cards.forEach(card => {
      const itemId = parseInt(card.getAttribute('data-id'));
      const item = mediaItems.find(media => media.id === itemId);
      
      if (item && shouldShowItem(item, currentFilter) && shouldShowItemInSearch(item, searchTerm)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // --- Função para criar elemento do card ---
  function createMediaCardElement(mediaData) {
    const { type, title, year, genre, description, rating, status, favorite, imageUrl, userOpinion } = mediaData;
    
    const isMovie = type === 'movie';
    const typeLabel = isMovie ? 'Filme' : 'Jogo';
    const typeColor = isMovie ? 'bg-blue-500' : 'bg-purple-500';
    
    const imageOrIcon = imageUrl
      ? `<img src="/image-proxy?url=${encodeURIComponent(imageUrl)}" alt="${title}" class="w-full h-full object-cover">`
      : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
          ${isMovie 
            ? `<svg class="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 7v10h6V7H9z"/></svg>`
            : `<svg class="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"/></svg>`
          }
        </div>`;

    // Gera as estrelas para o card
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<span class="${i <= rating ? 'text-yellow-400' : 'text-gray-600'}">★</span>`;
    }

    // Gera os botões de status
    const statusButtons = generateStatusButtons(status, isMovie);

    // Botão de favorito
    const favoriteButton = `
      <button class="p-1.5 bg-gray-900 bg-opacity-80 rounded-full hover:bg-opacity-90 transition-all duration-200 favorite-button">
        <svg class="w-4 h-4 ${favorite ? 'text-red-500' : 'text-gray-300'}" fill="${favorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      </button>
    `;

    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer';
    card.setAttribute('data-id', mediaData.id);
    card.innerHTML = `
      <div class="relative">
        <div class="w-full h-48 bg-gray-900">
          ${imageOrIcon}
        </div>
        <div class="absolute top-3 right-3">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${typeColor} text-white">${typeLabel}</span>
        </div>
        <div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div class="flex space-x-2">
            ${favoriteButton}
            <button class="p-1.5 bg-gray-900 bg-opacity-80 rounded-full hover:bg-opacity-90 transition-all duration-200 edit-button">
              <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="p-1.5 bg-red-900 bg-opacity-80 rounded-full hover:bg-opacity-90 transition-all duration-200 delete-button">
              <svg class="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-lg font-semibold text-white mb-2 line-clamp-1">${title}</h3>
        ${year ? `
        <div class="flex items-center text-gray-300">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="font-medium">Data:</span>
          <span class="ml-2">${year}</span>
        </div>` : ''}
        ${genre ? `<p class="text-gray-400 text-sm mb-3">${genre}</p>` : ''}
        ${userOpinion ? `<p class="text-gray-300 text-sm mb-4 line-clamp-2 italic">"${userOpinion}"</p>` : (description ? `<p class="text-gray-400 text-sm mb-4 line-clamp-2">${description}</p>` : '')}
        <div class="flex flex-wrap gap-2 mb-4">
          ${statusButtons}
        </div>
        <div class="pt-3 border-t border-gray-700">
            <p class="text-gray-400 text-xs mb-2">Minha avaliação:</p>
            <div class="flex space-x-1">
                ${starsHTML}
            </div>
        </div>
      </div>
    `;

    return card;
  }

  function shouldShowItem(item, filter) {
    switch (filter) {
      case 'filter-all':
        return true;
      case 'filter-movies':
        return item.type === 'movie';
      case 'filter-games':
        return item.type === 'game';
      case 'filter-watchlist':
        return item.status === 'watchlist';
      case 'filter-watching':
        return item.status === 'watching';
      case 'filter-completed':
        return item.status === 'completed';
      case 'filter-favorites':
        return item.favorite === true;
      default:
        return true;
    }
  }

  function renderAllMediaCards() {
    // Limpa o grid
    mediaGrid.innerHTML = '';
    
    // Ordena os itens: primeiro filmes, depois jogos, e alfabeticamente dentro de cada categoria
    const sortedItems = [...mediaItems].sort((a, b) => {
      // Primeiro ordena por tipo: filmes primeiro (movie < game)
      if (a.type !== b.type) {
        return a.type === 'movie' ? -1 : 1;
      }
      // Depois ordena alfabeticamente por título
      return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
    });
    
    // Se o filtro atual for "Todos", usa o layout de duas colunas
    if (currentFilter === 'filter-all') {
      applyTwoColumnLayout();
    } else {
      // Para outros filtros, renderiza todos os itens ordenados no layout normal
      sortedItems.forEach(item => {
        renderMediaCard(item);
      });
      // Aplica o filtro atual
      filterMediaItems(currentFilter);
    }
    
    // Aplica a busca atual
    applySearch();
    // Atualiza as estatísticas
    updateStats();
  }

  // --- Funções de Busca ---
  function applySearch() {
    // Se o filtro atual for "Todos", aplica a busca no layout de duas colunas
    if (currentFilter === 'filter-all') {
      applySearchInTwoColumnLayout();
    } else {
      // Para outros filtros, usa a busca normal
      const cards = mediaGrid.querySelectorAll('.group');
      cards.forEach(card => {
        const itemId = parseInt(card.getAttribute('data-id'));
        const item = mediaItems.find(media => media.id === itemId);
        
        if (item && shouldShowItem(item, currentFilter) && shouldShowItemInSearch(item, searchTerm)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  }

  // --- Função para aplicar busca no layout de duas colunas ---
  function applySearchInTwoColumnLayout() {
    // Limpa o grid
    mediaGrid.innerHTML = '';

    // Renderiza todos os itens filtrados diretamente no mediaGrid
    mediaItems.forEach(item => {
      if (shouldShowItemInSearch(item, searchTerm)) {
        const card = createMediaCardElement(item);
        mediaGrid.appendChild(card);
      }
    });
  }

  function shouldShowItemInSearch(item, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return true; // Se não há termo de busca, mostra todos os itens
    }

    const term = searchTerm.toLowerCase().trim();
    const title = item.title ? item.title.toLowerCase() : '';
    const genre = item.genre ? item.genre.toLowerCase() : '';
    const description = item.description ? item.description.toLowerCase() : '';
    const year = item.year ? item.year.toString() : '';

    return title.includes(term) || 
           genre.includes(term) || 
           description.includes(term) || 
           year.includes(term);
  }

  function handleSearch() {
    searchTerm = searchInput.value;
    applySearch();
  }
  // --- Fim das funções de Busca ---

  // --- Funções de Estatísticas ---
  function updateStats() {
    const total = mediaItems.length;
    const movies = mediaItems.filter(item => item.type === 'movie').length;
    const games = mediaItems.filter(item => item.type === 'game').length;
    const completed = mediaItems.filter(item => item.status === 'completed').length;

    // Atualiza os elementos de estatísticas
    const statsElements = document.querySelectorAll('.bg-gray-800.rounded-lg.p-4.text-center .text-2xl.font-bold');
    if (statsElements.length >= 4) {
      statsElements[0].textContent = total; // Total
      statsElements[1].textContent = movies; // Filmes
      statsElements[2].textContent = games; // Jogos
      statsElements[3].textContent = completed; // Concluídos
    }
  }
  // --- Fim das funções de Estatísticas ---

  // --- Lógica do Modal de Estrelas ---
  const modalStars = document.querySelectorAll('#modal-rating-stars span');
  const ratingInput = document.getElementById('media-rating');

  function setStars(rating) {
    modalStars.forEach((star, index) => {
      star.className = index < rating ? 'text-yellow-400' : 'text-gray-500';
    });
  }

  modalStars.forEach((star, index) => {
    star.addEventListener('click', () => {
      const newRating = index + 1;
      ratingInput.value = newRating;
      setStars(newRating);
    });

    star.addEventListener('mouseover', () => {
      setStars(index + 1);
    });
  });

  document.getElementById('modal-rating-stars').addEventListener('mouseout', () => {
    setStars(ratingInput.value);
  });
  // --- Fim da Lógica do Modal de Estrelas ---

  function showModal() {
    addMediaModal.classList.remove('hidden');
  }

  function hideModal() {
    addMediaModal.classList.add('hidden');
    addMediaForm.reset();
    ratingInput.value = '0'; // Reseta a avaliação
    setStars(0); // Reseta as estrelas visuais
    // Limpa a busca rápida
    if (mediaSearchInput) mediaSearchInput.value = '';
    if (mediaSearchResults) mediaSearchResults.classList.add('hidden');
    // Limpa o campo oculto da imagem
    addMediaForm.elements['imageUrl'].value = '';
    // Torna os campos de data e gênero editáveis novamente
    addMediaForm.elements['year'].readOnly = false;
    addMediaForm.elements['genre'].readOnly = false;
    // Define o status padrão após o reset
    addMediaForm.elements['status'].value = 'watchlist';
    cardBeingEdited = null;
    // Resetar o modal para o estado de "Adicionar"
    addMediaModal.querySelector('h3').textContent = 'Adicionar à Biblioteca';
    addMediaForm.querySelector('button[type="submit"]').textContent = 'Adicionar';
  }

  // --- Funções para o modal de visualização ---
  function showViewModal() {
    viewMediaModal.classList.remove('hidden');
  }

  function hideViewModal() {
    if (viewMediaModal) {
      viewMediaModal.classList.add('hidden');
    }
  }

  // --- Funções para o modal de confirmação de exclusão ---
  function showDeleteConfirmationModal(title, card) {
    cardToDelete = card;
    deleteItemTitle.textContent = title;
    if (deleteConfirmationModal) {
      deleteConfirmationModal.classList.remove('hidden');
    }
  }

  function hideDeleteConfirmationModal() {
    if (deleteConfirmationModal) {
      deleteConfirmationModal.classList.add('hidden');
    }
    cardToDelete = null;
  }

  async function confirmDelete() {
    if (cardToDelete) {
      const itemId = parseInt(cardToDelete.getAttribute('data-id'));
      await deleteMediaItem(itemId);
      cardToDelete.remove();
      hideDeleteConfirmationModal();
    }
  }

  function populateViewModal(mediaData) {
    const { type, title, year, genre, description, rating, status, imageUrl, userOpinion } = mediaData;
    
    const isMovie = type === 'movie';
    const typeLabel = isMovie ? 'Filme' : 'Jogo';
    const typeColor = isMovie ? 'bg-blue-500' : 'bg-purple-500';
    
    const imageContent = imageUrl
      ? `<img src="/image-proxy?url=${encodeURIComponent(imageUrl)}" alt="${title}" class="w-full h-full object-cover">`
      : `${isMovie 
          ? `<svg class="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 7v10h6V7H9z"/></svg>`
          : `<svg class="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"/></svg>`
        }`;
    
    // Gera as estrelas para a avaliação
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<span class="${i <= rating ? 'text-yellow-400' : 'text-gray-600'} text-2xl">★</span>`;
    }

    // Determina o status e sua cor
    let statusInfo = '';
    switch (status) {
      case 'watchlist':
        statusInfo = `<span class="px-3 py-1 rounded-full text-sm font-medium bg-orange-500 text-white">${isMovie ? 'Para Assistir' : 'Para Jogar'}</span>`;
        break;
      case 'watching':
        statusInfo = `<span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">${isMovie ? 'Assistindo' : 'Jogando'}</span>`;
        break;
      case 'completed':
        statusInfo = `<span class="px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">${isMovie ? 'Assistido' : 'Jogado'}</span>`;
        break;
    }

    // Busca o trailer do YouTube
    let trailerButton = '';
    if (API_CONFIG.YOUTUBE_API_KEY !== 'SUA_CHAVE_YOUTUBE_AQUI') {
      trailerButton = `
        <div class="mt-4">
          <button class="trailer-button inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
            </svg>
            ${isMovie ? 'Ver Trailer' : 'Ver Gameplay'}
          </button>
        </div>
      `;
    }

    mediaDetailsContent.innerHTML = `
      <div class="flex items-start space-x-6">
        <div class="flex-shrink-0">
          <div class="w-32 h-48 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
            ${imageContent}
          </div>
        </div>
        <div class="flex-1">
          <div class="flex items-center space-x-3 mb-4">
            <h2 class="text-3xl font-bold text-white">${title}</h2>
            <span class="px-3 py-1 rounded-full text-sm font-medium ${typeColor} text-white">${typeLabel}</span>
          </div>
          
          <div class="space-y-4">
            ${year ? `
            <div class="flex items-center text-gray-300">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="font-medium">Data:</span>
              <span class="ml-2">${year}</span>
            </div>` : ''}
            
            ${genre ? `
            <div class="flex items-center text-gray-300">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
              <span class="font-medium">Gênero:</span>
              <span class="ml-2">${genre}</span>
            </div>` : ''}
            
            <div class="flex items-center text-gray-300">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="font-medium">Status:</span>
              <span class="ml-2">${statusInfo}</span>
            </div>
            
            ${description ? `
            <div class="text-gray-300">
              <div class="flex items-center mb-2">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="font-medium">Descrição:</span>
              </div>
              <p class="text-gray-300 leading-relaxed">${description}</p>
            </div>` : ''}
            
            ${userOpinion ? `
            <div class="mt-4 pt-4 border-t border-gray-700">
              <div class="flex items-center mb-2 text-yellow-400">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-6a1 1 0 11-2 0 1 1 0 012 0zm1-3a1 1 0 00-2 0v4a1 1 0 102 0V9z" clip-rule="evenodd" fill-rule="evenodd"></path>
                </svg>
                <span class="font-medium">Minha Opinião:</span>
              </div>
              <p class="text-gray-200 leading-relaxed italic">"${userOpinion}"</p>
            </div>` : ''}
            
            <div class="text-gray-300">
              <div class="flex items-center mb-2">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
                <span class="font-medium">Minha Avaliação:</span>
              </div>
              <div class="flex space-x-1">
                ${starsHTML}
              </div>
              <span class="text-sm text-gray-400 ml-2">${rating}/5 estrelas</span>
            </div>
            
            ${trailerButton}
          </div>
        </div>
      </div>
    `;

    // Adiciona evento de clique ao botão do trailer
    const trailerButtonElement = mediaDetailsContent.querySelector('.trailer-button');
    if (trailerButtonElement) {
      trailerButtonElement.addEventListener('click', async () => {
        showLoading();
        try {
          const trailerUrl = await fetchTrailer(title, type, year);
          if (trailerUrl) {
            window.open(trailerUrl, '_blank');
          } else {
            showNotification('Trailer não encontrado no YouTube.', 'warning');
          }
        } catch (error) {
          console.error('Erro ao buscar trailer:', error);
          showNotification('Erro ao buscar trailer.', 'error');
        } finally {
          hideLoading();
        }
      });
    }
  }
  // --- Fim das funções para o modal de visualização ---

  // --- Função para máscara de data ---
  function applyDateMask(input) {
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (value.length > 4) {
      value = value.substring(0, 4); // Limita a 4 dígitos
    }
    input.value = value;
  }

  function renderMediaCard(mediaData, cardToUpdate = null) {
    const { type, title, year, genre, description, rating, status, favorite, imageUrl, userOpinion } = mediaData;
    
    const isMovie = type === 'movie';
    const typeLabel = isMovie ? 'Filme' : 'Jogo';
    const typeColor = isMovie ? 'bg-blue-500' : 'bg-purple-500';
    
    const imageOrIcon = imageUrl
      ? `<img src="/image-proxy?url=${encodeURIComponent(imageUrl)}" alt="${title}" class="w-full h-full object-cover">`
      : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
          ${isMovie 
            ? `<svg class="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 7v10h6V7H9z"/></svg>`
            : `<svg class="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"/></svg>`
          }
        </div>`;

    // Gera as estrelas para o card
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<span class="${i <= rating ? 'text-yellow-400' : 'text-gray-600'}">★</span>`;
    }

    // Gera os botões de status
    const statusButtons = generateStatusButtons(status, isMovie);

    // Botão de favorito
    const favoriteButton = `
      <button class="p-1.5 bg-gray-900 bg-opacity-80 rounded-full hover:bg-opacity-90 transition-all duration-200 favorite-button">
        <svg class="w-4 h-4 ${favorite ? 'text-red-500' : 'text-gray-300'}" fill="${favorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      </button>
    `;

    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer';
    card.setAttribute('data-id', mediaData.id);
    card.innerHTML = `
      <div class="relative">
        <div class="w-full h-48 bg-gray-900">
          ${imageOrIcon}
        </div>
        <div class="absolute top-3 right-3">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${typeColor} text-white">${typeLabel}</span>
        </div>
        <div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div class="flex space-x-2">
            ${favoriteButton}
            <button class="p-1.5 bg-gray-900 bg-opacity-80 rounded-full hover:bg-opacity-90 transition-all duration-200 edit-button">
              <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="p-1.5 bg-red-900 bg-opacity-80 rounded-full hover:bg-opacity-90 transition-all duration-200 delete-button">
              <svg class="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-lg font-semibold text-white mb-2 line-clamp-1">${title}</h3>
        ${year ? `
        <div class="flex items-center text-gray-400 text-sm mb-3">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          ${year}
        </div>` : ''}
        ${genre ? `<p class="text-gray-400 text-sm mb-3">${genre}</p>` : ''}
        ${userOpinion ? `<p class="text-gray-300 text-sm mb-4 line-clamp-2 italic">"${userOpinion}"</p>` : (description ? `<p class="text-gray-400 text-sm mb-4 line-clamp-2">${description}</p>` : '')}
        <div class="flex flex-wrap gap-2 mb-4">
          ${statusButtons}
        </div>
        <div class="pt-3 border-t border-gray-700">
            <p class="text-gray-400 text-xs mb-2">Minha avaliação:</p>
            <div class="flex space-x-1">
                ${starsHTML}
            </div>
        </div>
      </div>
    `;

    if (cardToUpdate) {
        cardToUpdate.innerHTML = card.innerHTML;
        cardToUpdate.setAttribute('data-id', mediaData.id);
    } else {
        // Verifica se está no layout de duas colunas
        if (currentFilter === 'filter-all') {
          // Se estiver no layout de duas colunas, adiciona diretamente no mediaGrid
          mediaGrid.prepend(card);
        } else {
          // Layout normal
          mediaGrid.prepend(card);
        }
    }
  }

  function generateStatusButtons(currentStatus, isMovie) {
    const statuses = [
      { value: 'watchlist', label: isMovie ? 'Para Assistir' : 'Para Jogar', color: 'bg-orange-500' },
      { value: 'watching', label: isMovie ? 'Assistindo' : 'Jogando', color: 'bg-blue-500' },
      { value: 'completed', label: isMovie ? 'Assistido' : 'Jogado', color: 'bg-green-500' }
    ];

    // Encontra o status atual
    const currentStatusObj = statuses.find(status => status.value === currentStatus);
    
    if (!currentStatusObj) {
      // Se não encontrar o status, usa o padrão 'watchlist'
      const defaultStatus = statuses.find(status => status.value === 'watchlist');
      return `<button class="status-button px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${defaultStatus.color} text-white shadow-lg hover:bg-opacity-80" data-status="${defaultStatus.value}">${defaultStatus.label}</button>`;
    }

    // Retorna apenas o botão do status atual
    return `<button class="status-button px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${currentStatusObj.color} text-white shadow-lg hover:bg-opacity-80" data-status="${currentStatusObj.value}">${currentStatusObj.label}</button>`;
  }

  if (addMediaButton) {
    addMediaButton.addEventListener('click', showModal);
  }

  if (closeModalButton) {
    closeModalButton.addEventListener('click', hideModal);
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', hideModal);
  }

  // Event listeners para o modal de visualização
  if (closeViewModalButton) {
    closeViewModalButton.addEventListener('click', hideViewModal);
  }

  if (closeViewModalButton2) {
    closeViewModalButton2.addEventListener('click', hideViewModal);
  }

  // Event listener para busca
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Event listener para máscara de data
  if (dateInput) {
    dateInput.addEventListener('input', (event) => {
      applyDateMask(event.target);
    });
  }

  // Clica fora do modal para fechar
  if (addMediaModal) {
    addMediaModal.addEventListener('click', (event) => {
      if (event.target === addMediaModal) {
        hideModal();
      }
    });
  }

  // Clica fora do modal de visualização para fechar
  if (viewMediaModal) {
    viewMediaModal.addEventListener('click', (event) => {
      if (event.target === viewMediaModal) {
        hideViewModal();
      }
    });
  }

  // Event listeners para o modal de confirmação de exclusão
  if (cancelDeleteButton) {
    cancelDeleteButton.addEventListener('click', hideDeleteConfirmationModal);
  }

  if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener('click', confirmDelete);
  }

  // Clica fora do modal de confirmação para fechar
  if (deleteConfirmationModal) {
    deleteConfirmationModal.addEventListener('click', (event) => {
      if (event.target === deleteConfirmationModal) {
        hideDeleteConfirmationModal();
      }
    });
  }

  if (addMediaForm) {
    addMediaForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(addMediaForm);
      const mediaData = Object.fromEntries(formData.entries());
      
      showLoading(); // Mostra o loading ao iniciar o salvamento
      
      try {
        // Se a URL da imagem não foi preenchida pela busca rápida, busca agora.
        if (!mediaData.imageUrl) {
          const imageUrl = await fetchImage(mediaData.title, mediaData.type);
          if (imageUrl) {
            mediaData.imageUrl = imageUrl;
          }
        }

        if (cardBeingEdited) {
          // Modo de edição
          const itemId = parseInt(cardBeingEdited.getAttribute('data-id'));
          const updatedItem = await updateMediaItem(itemId, mediaData);
          if (updatedItem) {
            renderMediaCard(updatedItem, cardBeingEdited);
            filterMediaItems(currentFilter);
            applySearch();
          }
        } else {
          // Modo de adição
          const newItem = await addMediaItem(mediaData);
          renderMediaCard(newItem);
          filterMediaItems(currentFilter);
          applySearch();
        }
        
        hideModal();
      } catch (error) {
        console.error('Erro ao salvar item:', error);
        showNotification('Erro ao salvar o item. Tente novamente.', 'error');
      } finally {
        hideLoading(); // Esconde o loading no final
      }
    });
  }

  // Eventos para os botões de filtro
  const filterButtons = ['filter-all', 'filter-movies', 'filter-games', 'filter-watchlist', 'filter-watching', 'filter-completed', 'filter-favorites'];
  filterButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', () => {
        filterMediaItems(buttonId);
      });
    }
  });

  // Delegação de evento para edição, exclusão e mudança de status
  if (mediaGrid) {
    mediaGrid.addEventListener('click', async (event) => {
      const editButton = event.target.closest('.edit-button');
      const deleteButton = event.target.closest('.delete-button');
      const statusButton = event.target.closest('.status-button');
      const favoriteButton = event.target.closest('.favorite-button');
      const card = event.target.closest('.group');

      // Se clicou em um card (mas não nos botões de ação)
      if (card && !editButton && !deleteButton && !statusButton && !favoriteButton) {
        const itemId = parseInt(card.getAttribute('data-id'));
        const item = mediaItems.find(media => media.id === itemId);
        
        if (item) {
          populateViewModal(item);
          showViewModal();
        }
        return;
      }

      if (favoriteButton) {
        const card = favoriteButton.closest('.group');
        const itemId = parseInt(card.getAttribute('data-id'));
        const item = mediaItems.find(media => media.id === itemId);
        
        if (item) {
          const newFavoriteState = !item.favorite;
          try {
            const updatedItem = await updateMediaItem(itemId, { favorite: newFavoriteState });
            if (updatedItem) {
              renderMediaCard(updatedItem, card);
              // Reaplica o filtro atual
              filterMediaItems(currentFilter);
              // Reaplica a busca atual
              applySearch();
            }
          } catch (error) {
            console.error('Erro ao atualizar favorito:', error);
          }
        }
        return;
      }

      if (editButton) {
        cardBeingEdited = editButton.closest('.group');
        
        const title = cardBeingEdited.querySelector('h3').textContent;
        const typeLabel = cardBeingEdited.querySelector('.absolute.top-3.right-3 span').textContent;
        const yearEl = cardBeingEdited.querySelector('.flex.items-center.text-gray-400');
        const genreEl = cardBeingEdited.querySelector('p.text-gray-400');
        const descriptionEl = cardBeingEdited.querySelector('p.text-gray-300');
        const ratingStars = cardBeingEdited.querySelectorAll('.flex.space-x-1 span.text-yellow-400');
        const currentRating = ratingStars.length;

        // Encontra o item no array para obter os dados completos
        const itemId = parseInt(cardBeingEdited.getAttribute('data-id'));
        const currentItem = mediaItems.find(item => item.id === itemId);

        // Preenche o formulário e bloqueia campos se necessário
        addMediaForm.elements['type'].value = typeLabel === 'Filme' ? 'movie' : 'game';
        addMediaForm.elements['title'].value = title;
        addMediaForm.elements['year'].value = currentItem ? currentItem.year : '';
        addMediaForm.elements['genre'].value = currentItem ? currentItem.genre : '';
        addMediaForm.elements['description'].value = currentItem ? currentItem.description : '';
        addMediaForm.elements['userOpinion'].value = currentItem ? currentItem.userOpinion : '';
        addMediaForm.elements['imageUrl'].value = currentItem ? currentItem.imageUrl : '';
        addMediaForm.elements['status'].value = currentItem ? currentItem.status : 'watchlist';
        ratingInput.value = currentRating;
        setStars(currentRating);

        // Bloqueia campos de data e gênero no modo de edição
        addMediaForm.elements['year'].readOnly = true;
        addMediaForm.elements['genre'].readOnly = true;

        // Altera o modal para o modo de edição
        addMediaModal.querySelector('h3').textContent = 'Editar Item';
        addMediaForm.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
        
        showModal();
      }
      
      if (deleteButton) {
        const cardToDelete = deleteButton.closest('.group');
        if (cardToDelete) {
          const title = cardToDelete.querySelector('h3').textContent;
          showDeleteConfirmationModal(title, cardToDelete);
        }
      }

      if (statusButton) {
        const card = statusButton.closest('.group');
        const itemId = parseInt(card.getAttribute('data-id'));
        const newStatus = statusButton.getAttribute('data-status');
        
        try {
          const updatedItem = await updateMediaItem(itemId, { status: newStatus });
          if (updatedItem) {
            renderMediaCard(updatedItem, card);
            // Reaplica o filtro atual
            filterMediaItems(currentFilter);
            // Reaplica a busca atual
            applySearch();
            // As estatísticas já são atualizadas na função updateMediaItem
          }
        } catch (error) {
          console.error('Erro ao atualizar status:', error);
        }
      }
    });
  }

  // --- Lógica da Busca Rápida no Formulário ---

  // Busca sugestões na API externa
  async function fetchSuggestions(query, type) {
    if (type === 'movie' && API_CONFIG.TMDB_API_KEY !== 'SUA_CHAVE_TMDB_AQUI') {
      try {
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`;
        const response = await fetch(url);
        const data = await response.json();
        return data.results ? data.results.slice(0, 5) : [];
      } catch (error) {
        console.error('Erro ao buscar sugestões de filmes:', error);
        return [];
      }
    } else if (type === 'game' && API_CONFIG.RAWG_API_KEY !== 'SUA_CHAVE_RAWG_AQUI') {
      try {
        const url = `https://api.rawg.io/api/games?key=${API_CONFIG.RAWG_API_KEY}&search=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.results ? data.results.slice(0, 5) : [];
      } catch (error) {
        console.error('Erro ao buscar sugestões de jogos:', error);
        return [];
      }
    }
    return [];
  }

  // Renderiza as sugestões na lista
  function renderSuggestions(suggestions, type) {
    if (!suggestions || suggestions.length === 0) {
      mediaSearchResults.classList.add('hidden');
      return;
    }

    mediaSearchResults.innerHTML = '';
    suggestions.forEach(item => {
      const resultEl = document.createElement('div');
      resultEl.className = 'p-3 hover:bg-gray-500 cursor-pointer border-b border-gray-700 last:border-b-0';

      if (type === 'movie') {
        resultEl.innerHTML = `
          <p class="text-white font-medium">${item.title}</p>
          <p class="text-gray-300 text-sm">${item.release_date ? item.release_date.split('-')[0] : 'Sem data'}</p>
        `;
        resultEl.dataset.id = item.id;
        resultEl.dataset.type = 'movie';
      } else { // game
        resultEl.innerHTML = `
          <p class="text-white font-medium">${item.name}</p>
          <p class="text-gray-300 text-sm">${item.released ? item.released.split('-')[0] : 'Sem data'}</p>
        `;
        resultEl.dataset.id = item.id;
        resultEl.dataset.type = 'game';
      }
      mediaSearchResults.appendChild(resultEl);
    });
    mediaSearchResults.classList.remove('hidden');
  }

  // Busca detalhes e preenche o formulário
  async function fetchAndPopulateDetails(id, type) {
    try {
      if (type === 'movie') {
        const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${API_CONFIG.TMDB_API_KEY}&language=pt-BR`;
        const response = await fetch(url);
        const details = await response.json();
        
        addMediaForm.elements['title'].value = details.title || '';
        addMediaForm.elements['year'].value = details.release_date ? details.release_date.split('-')[0] : '';
        addMediaForm.elements['genre'].value = details.genres ? details.genres.map(g => g.name).join(', ') : '';
        addMediaForm.elements['description'].value = details.overview || '';
        addMediaForm.elements['userOpinion'].value = '';
        if (details.poster_path) {
          addMediaForm.elements['imageUrl'].value = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
        }
      } else { // game
        const url = `https://api.rawg.io/api/games/${id}?key=${API_CONFIG.RAWG_API_KEY}`;
        const response = await fetch(url);
        const details = await response.json();

        addMediaForm.elements['title'].value = details.name || '';
        addMediaForm.elements['year'].value = details.released ? details.released.split('-')[0] : '';
        addMediaForm.elements['genre'].value = details.genres ? details.genres.map(g => g.name).join(', ') : '';
        const description = details.description_raw || '';
        addMediaForm.elements['description'].value = description;
        addMediaForm.elements['userOpinion'].value = '';
        if (details.background_image) {
          addMediaForm.elements['imageUrl'].value = details.background_image;
        }
      }
      // Bloqueia os campos após o preenchimento
      addMediaForm.elements['year'].readOnly = true;
      addMediaForm.elements['genre'].readOnly = true;
    } catch (error) {
      console.error(`Erro ao buscar detalhes para ${type} ${id}:`, error);
      showNotification('Não foi possível buscar os detalhes do item.', 'error');
    }
  }
  
  // Lida com o input de busca
  async function handleSearchInput(event) {
    const query = event.target.value.trim();
    const type = document.getElementById('media-type').value;

    if (query.length < 3) {
      mediaSearchResults.classList.add('hidden');
      return;
    }

    const suggestions = await fetchSuggestions(query, type);
    renderSuggestions(suggestions, type);
  }

  // Lida com o clique na sugestão
  async function handleSuggestionClick(event) {
    const selectedEl = event.target.closest('div[data-id]');
    if (!selectedEl) return;

    const id = selectedEl.dataset.id;
    const type = selectedEl.dataset.type;
    
    showLoading();
    await fetchAndPopulateDetails(id, type);
    hideLoading();

    mediaSearchResults.classList.add('hidden');
    mediaSearchInput.value = '';
  }

  if (mediaSearchInput) {
    mediaSearchInput.addEventListener('input', debounce(handleSearchInput, 400));
  }

  if (mediaSearchResults) {
    mediaSearchResults.addEventListener('click', handleSuggestionClick);
  }

  // Fecha a lista de sugestões se clicar fora do modal
  document.addEventListener('click', (event) => {
    // Garante que o clique não foi dentro do container de busca para não fechar indevidamente
    const isClickInsideSearch = mediaSearchInput.contains(event.target) || mediaSearchResults.contains(event.target);
    if (!isClickInsideSearch) {
      mediaSearchResults.classList.add('hidden');
    }
  });

  // Carrega os itens salvos quando a página é carregada
  loadMediaItems();
});
