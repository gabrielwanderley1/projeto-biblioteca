// API com banco de dados SQLite
// Execute com: node api-example.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
const API_CONFIG = require('./.bolt/config.js'); // Importar a configuração

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Rota principal - servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de proxy para imagens para evitar problemas de CORS
app.get('/image-proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL da imagem é obrigatória');
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const response = await axios({
      method: 'get',
      url: decodedUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  } catch (error) {
    console.error(`Erro no proxy para URL: ${url}`, error.message);
    // Envia uma imagem SVG placeholder em caso de erro
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(404).send('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect fill="#374151" width="100%" height="100%"/><text fill="#9ca3af" font-size="20" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Image Not Found</text></svg>');
  }
});

// Configuração do banco de dados
const dbPath = path.join(__dirname, 'media_library.db');
const db = new sqlite3.Database(dbPath);

// Inicializar banco de dados
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      // Criar tabela de mídia
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

// --- ROTAS DA API ---
const apiRouter = express.Router();

// Aplicar autenticação em todas as rotas da API
apiRouter.use(authenticateAPI);

// GET /media-items - Listar todos os itens
apiRouter.get('/media-items', (req, res) => {
  const query = `
    SELECT 
      id,
      type,
      title,
      year,
      genre,
      description,
      rating,
      status,
      favorite,
      imageUrl,
      userOpinion,
      created_at,
      updated_at
    FROM media_items 
    ORDER BY created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar itens:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Converter favorite de 0/1 para boolean
    const items = rows.map(row => ({
      ...row,
      favorite: Boolean(row.favorite)
    }));

    res.json({ items });
  });
});

// POST /media-items - Adicionar novo item
apiRouter.post('/media-items', (req, res) => {
  const { type, title, year, genre, description, rating, status, favorite, imageUrl, userOpinion } = req.body;

  if (!type || !title) {
    return res.status(400).json({ error: 'Tipo e título são obrigatórios' });
  }

  const query = `
    INSERT INTO media_items (type, title, year, genre, description, rating, status, favorite, imageUrl, userOpinion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    type,
    title,
    year || null,
    genre || null,
    description || null,
    rating || 0,
    status || 'watchlist',
    favorite ? 1 : 0,
    imageUrl || null,
    userOpinion || null
  ], function(err) {
    if (err) {
      console.error('Erro ao inserir item:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Buscar o item inserido
    db.get('SELECT * FROM media_items WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Erro ao buscar item inserido:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      const item = {
        ...row,
        favorite: Boolean(row.favorite)
      };

      res.status(201).json({ item });
    });
  });
});

// PUT /media-items/:id - Atualizar item
apiRouter.put('/media-items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { type, title, year, genre, description, rating, status, favorite, imageUrl, userOpinion } = req.body;

  if (!type || !title) {
    return res.status(400).json({ error: 'Tipo e título são obrigatórios' });
  }

  const query = `
    UPDATE media_items 
    SET type = ?, title = ?, year = ?, genre = ?, description = ?, 
        rating = ?, status = ?, favorite = ?, imageUrl = ?, userOpinion = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [
    type,
    title,
    year || null,
    genre || null,
    description || null,
    rating || 0,
    status || 'watchlist',
    favorite ? 1 : 0,
    imageUrl || null,
    userOpinion || null,
    id
  ], function(err) {
    if (err) {
      console.error('Erro ao atualizar item:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Buscar o item atualizado
    db.get('SELECT * FROM media_items WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Erro ao buscar item atualizado:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      const item = {
        ...row,
        favorite: Boolean(row.favorite)
      };

      res.json({ item });
    });
  });
});

// DELETE /media-items/:id - Excluir item
apiRouter.delete('/media-items/:id', (req, res) => {
  const id = parseInt(req.params.id);

  db.run('DELETE FROM media_items WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Erro ao deletar item:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    res.status(204).send();
  });
});

// GET /stats - Estatísticas
apiRouter.get('/stats', (req, res) => {
  const queries = {
    total: 'SELECT COUNT(*) as count FROM media_items',
    movies: 'SELECT COUNT(*) as count FROM media_items WHERE type = "movie"',
    games: 'SELECT COUNT(*) as count FROM media_items WHERE type = "game"',
    completed: 'SELECT COUNT(*) as count FROM media_items WHERE status = "completed"'
  };

  const stats = {};
  let completedQueries = 0;
  const totalQueries = Object.keys(queries).length;

  Object.keys(queries).forEach(key => {
    db.get(queries[key], [], (err, row) => {
      if (err) {
        console.error(`Erro ao buscar estatística ${key}:`, err);
      } else {
        stats[key] = row.count;
      }

      completedQueries++;
      if (completedQueries === totalQueries) {
        res.json(stats);
      }
    });
  });
});

// GET /search - Buscar itens
apiRouter.get('/search', (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Termo de busca é obrigatório' });
  }

  const query = `
    SELECT * FROM media_items 
    WHERE title LIKE ? OR genre LIKE ? OR description LIKE ?
    ORDER BY created_at DESC
  `;
  const searchTerm = `%${q}%`;

  db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      console.error('Erro na busca:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    const items = rows.map(row => ({
      ...row,
      favorite: Boolean(row.favorite)
    }));

    res.json({ items });
  });
});

// Rota de teste da API
apiRouter.get('/test', (req, res) => {
  res.json({ 
    message: 'API funcionando corretamente!',
    database: 'SQLite conectado',
    timestamp: new Date().toISOString()
  });
});

// Rota para expor configurações da API para o frontend
app.get('/api/config', (req, res) => {
  res.json({
    API_KEY: process.env.API_KEY,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    RAWG_API_KEY: process.env.RAWG_API_KEY,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
    TIMEOUT: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 10000,
    MAX_RETRIES: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3
  });
});

// Usar o router para todas as rotas da API sob o prefixo /api
app.use('/api', apiRouter);

// Inicializar banco de dados e iniciar servidor
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor API rodando em http://localhost:${PORT}`);
      console.log(`🗄️  Banco de dados: ${dbPath}`);
      console.log(`📝 Endpoints disponíveis (prefixo /api):`);
      console.log(`   GET  /api/media-items - Listar itens`);
      console.log(`   POST /api/media-items - Adicionar item`);
      console.log(`   PUT  /api/media-items/:id - Atualizar item`);
      console.log(`   DELETE /api/media-items/:id - Excluir item`);
      console.log(`   GET  /api/stats - Estatísticas`);
      console.log(`   GET  /api/search?q=termo - Buscar itens`);
      console.log(`   GET  /api/test - Teste da API`);
      console.log(`🔑 Chave da API: ${process.env.API_KEY}`);
    });
  })
  .catch(err => {
    console.error('❌ Erro ao inicializar banco de dados:', err);
    process.exit(1);
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