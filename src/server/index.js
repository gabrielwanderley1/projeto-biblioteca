// API com banco de dados SQLite
// Execute com: node api-example.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

const createApiRouter = require('./api');
const createImageProxyRouter = require('./image-proxy');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../../public')));

// Configuração do banco de dados
const dbPath = path.join(__dirname, '../../database/media_library.db');
const db = new sqlite3.Database(dbPath);

// Inicializar banco de dados
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS media_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          year TEXT,
          genre TEXT,
          description TEXT,
          rating INTEGER DEFAULT 0,
          status TEXT DEFAULT 'watchlist',
          favorite BOOLEAN DEFAULT 0,
          imageUrl TEXT,
          userOpinion TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela:', err);
          reject(err);
        } else {
          console.log('✅ Tabela media_items criada/verificada com sucesso');
          resolve();
        }
      });
    });
  });
}

// Middleware de autenticação
function authenticateAPI(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
  const expectedKey = process.env.API_KEY;
  if (apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Chave da API inválida' });
  }
  next();
}

// Rota para expor configurações da API para o frontend (SEM autenticação)
app.get('/api/config', (req, res) => {
  res.json({
    API_KEY: process.env.API_KEY || '',
    TMDB_API_KEY: process.env.TMDB_API_KEY || '',
    RAWG_API_KEY: process.env.RAWG_API_KEY || '',
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
    TIMEOUT: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 10000,
    MAX_RETRIES: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3
  });
});

// Usar rotas separadas
app.use('/api', createApiRouter(db, authenticateAPI));
app.use('/', createImageProxyRouter());

// Rota principal - servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Iniciar servidor
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar banco de dados:', err);
    } else {
      console.log('✅ Banco de dados fechado');
    }
    process.exit(0);
  });
}); 