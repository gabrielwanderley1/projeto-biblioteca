# Configuração da API do YouTube para Trailers

## Como obter sua chave da API do YouTube

Para que a funcionalidade de trailers funcione, você precisa obter uma chave da API do YouTube. Siga estes passos:

### 1. Acesse o Google Cloud Console
- Vá para [Google Cloud Console](https://console.cloud.google.com/)
- Faça login com sua conta Google

### 2. Crie um novo projeto ou selecione um existente
- Clique no seletor de projetos no topo da página
- Clique em "Novo Projeto" ou selecione um projeto existente

### 3. Ative a API do YouTube Data v3
- No menu lateral, vá em "APIs e Serviços" > "Biblioteca"
- Procure por "YouTube Data API v3"
- Clique na API e depois em "Ativar"

### 4. Crie credenciais
- No menu lateral, vá em "APIs e Serviços" > "Credenciais"
- Clique em "Criar Credenciais" > "Chave de API"
- Sua chave será gerada automaticamente

### 5. Configure a chave no projeto
- Abra o arquivo `public/bolt/config.js`
- Substitua `'SUA_CHAVE_YOUTUBE_AQUI'` pela sua chave real:

```javascript
YOUTUBE_API_KEY: 'sua_chave_real_aqui',
```

### 6. (Opcional) Restrinja a chave para maior segurança
- No Google Cloud Console, vá em "APIs e Serviços" > "Credenciais"
- Clique na chave criada
- Em "Restrições de aplicativo", você pode:
  - Restringir por HTTP referrer (domínios)
  - Restringir por IP
  - Restringir por API (YouTube Data API v3)

## Como funciona

Quando você clicar em um card de mídia para visualizar os detalhes, aparecerá um botão "Ver Trailer" (para filmes) ou "Ver Gameplay" (para jogos). Ao clicar no botão:

1. A aplicação busca no YouTube por trailers oficiais ou gameplays
2. Abre o primeiro resultado em uma nova aba
3. Se não encontrar nada, mostra uma notificação

## Termos de busca utilizados

- **Filmes**: `[título] trailer oficial [ano]`
- **Jogos**: `[título] gameplay trailer [ano]`

## Limitações

- A API do YouTube tem um limite de 10.000 requisições por dia
- A busca é feita em tempo real, então pode demorar alguns segundos
- A qualidade dos resultados depende dos termos de busca e disponibilidade no YouTube

## Solução de problemas

Se o botão não aparecer:
- Verifique se a chave da API está configurada corretamente
- Confirme se a API do YouTube Data v3 está ativada
- Verifique se há erros no console do navegador

Se não encontrar trailers:
- O item pode não ter trailers disponíveis no YouTube
- Tente adicionar o ano do lançamento para melhorar a busca
- Verifique se a chave da API tem permissões adequadas 