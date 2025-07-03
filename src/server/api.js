const express = require('express');

function createApiRouter(db, authenticateAPI) {
  const apiRouter = express.Router();

  // Middleware de autenticação
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
      const items = rows.map(row => ({ ...row, favorite: Boolean(row.favorite) }));
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
      db.get('SELECT * FROM media_items WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Erro ao buscar item inserido:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        const item = { ...row, favorite: Boolean(row.favorite) };
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
      UPDATE media_items SET
        type = ?,
        title = ?,
        year = ?,
        genre = ?,
        description = ?,
        rating = ?,
        status = ?,
        favorite = ?,
        imageUrl = ?,
        userOpinion = ?,
        updated_at = CURRENT_TIMESTAMP
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
      db.get('SELECT * FROM media_items WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Erro ao buscar item atualizado:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        const item = { ...row, favorite: Boolean(row.favorite) };
        res.json({ item });
      });
    });
  });

  // DELETE /media-items/:id - Remover item
  apiRouter.delete('/media-items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.run('DELETE FROM media_items WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Erro ao remover item:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      res.status(204).send();
    });
  });

  // Outras rotas da API podem ser adicionadas aqui

  return apiRouter;
}

module.exports = createApiRouter; 