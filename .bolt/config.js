// Configurações da API
require('dotenv').config();

const API_CONFIG = {
  // Chave da API fornecida
  API_KEY: process.env.API_KEY,
  
  // Chaves para APIs de imagens
  TMDB_API_KEY: process.env.TMDB_API_KEY, // Para imagens de filmes
  RAWG_API_KEY: process.env.RAWG_API_KEY,   // Para imagens de jogos
  
  // Chave da API do YouTube para trailers
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY, // Para trailers de filmes e jogos
  
  // URL base da API
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  
  // Endpoints da API
  ENDPOINTS: {
    MEDIA_ITEMS: '/media-items',
    MEDIA_ITEM: (id) => `/media-items/${id}`,
    SEARCH: '/search',
    STATS: '/stats'
  },
  
  // Configurações de timeout e retry
  TIMEOUT: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 10000, // 10 segundos
  MAX_RETRIES: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3,
  
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
  // Para o browser, expõe as configurações globalmente
  window.API_CONFIG = API_CONFIG;
} 