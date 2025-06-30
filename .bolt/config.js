// Configurações da API
const API_CONFIG = {
  // Chave da API fornecida
  API_KEY: 'e476cca32fa8443da410678adfbff88e',
  
  // Chaves para APIs de imagens (adicione as suas chaves aqui)
  TMDB_API_KEY: 'fd8bf0bc323c658526632584143ae68c', // Para imagens de filmes
  RAWG_API_KEY: 'e476cca32fa8443da410678adfbff88e',   // Para imagens de jogos
  
  // Chave da API do YouTube para trailers (adicione sua chave aqui)
  YOUTUBE_API_KEY: 'AIzaSyCuMkHt34DH7mvzKRKuqGcBqlg4ctYLqwI', // Para trailers de filmes e jogos
  
  // URL base da API - aponta para o servidor de exemplo local com o prefixo /api
  API_BASE_URL: 'http://localhost:3000/api',
  
  // Endpoints da API
  ENDPOINTS: {
    MEDIA_ITEMS: '/media-items',
    MEDIA_ITEM: (id) => `/media-items/${id}`,
    SEARCH: '/search',
    STATS: '/stats'
  },
  
  // Configurações de timeout e retry
  TIMEOUT: 10000, // 10 segundos
  MAX_RETRIES: 3,
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Exporta a configuração para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
} else {
  window.API_CONFIG = API_CONFIG;
} 