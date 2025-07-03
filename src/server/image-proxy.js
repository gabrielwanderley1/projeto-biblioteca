const express = require('express');
const axios = require('axios');

function createImageProxyRouter() {
  const router = express.Router();

  router.get('/image-proxy', async (req, res) => {
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
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(404).send('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect fill="#374151" width="100%" height="100%"/><text fill="#9ca3af" font-size="20" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Image Not Found</text></svg>');
    }
  });

  return router;
}

module.exports = createImageProxyRouter; 