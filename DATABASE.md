# Banco de Dados SQLite - Biblioteca de Mídia

## 📊 Estrutura do Banco de Dados

### Tabela: `media_items`

| Campo | Tipo | Descrição | Padrão |
|-------|------|-----------|--------|
| `id` | INTEGER | Chave primária auto-incrementada | - |
| `type` | TEXT | Tipo de mídia (movie/game) | - |
| `title` | TEXT | Título do filme/jogo | - |
| `year` | TEXT | Ano de lançamento | NULL |
| `genre` | TEXT | Gênero(s) | NULL |
| `description` | TEXT | Descrição | NULL |
| `rating` | INTEGER | Avaliação (0-5) | 0 |
| `status` | TEXT | Status (watchlist/watching/completed) | 'watchlist' |
| `favorite` | BOOLEAN | Favorito (0/1) | 0 |
| `created_at` | DATETIME | Data de criação | CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | Data de atualização | CURRENT_TIMESTAMP |

## 🚀 Como Configurar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar o Servidor
```bash
npm start
```

O banco de dados será criado automaticamente na primeira execução.

## 📁 Arquivos do Banco de Dados

- **`media_library.db`**: Arquivo do banco SQLite (criado automaticamente)
- **`api-example.js`**: Servidor API com conexão ao banco
- **`package.json`**: Dependências do projeto

## 🔧 Operações do Banco

### Inserir Item
```sql
INSERT INTO media_items (type, title, year, genre, description, rating, status, favorite)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

### Buscar Todos os Itens
```sql
SELECT * FROM media_items ORDER BY created_at DESC
```

### Atualizar Item
```sql
UPDATE media_items 
SET type = ?, title = ?, year = ?, genre = ?, description = ?, 
    rating = ?, status = ?, favorite = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?
```

### Excluir Item
```sql
DELETE FROM media_items WHERE id = ?
```

### Estatísticas
```sql
-- Total de itens
SELECT COUNT(*) FROM media_items

-- Filmes
SELECT COUNT(*) FROM media_items WHERE type = 'movie'

-- Jogos
SELECT COUNT(*) FROM media_items WHERE type = 'game'

-- Concluídos
SELECT COUNT(*) FROM media_items WHERE status = 'completed'
```

## 🔍 Busca no Banco

### Busca por Texto
```sql
SELECT * FROM media_items 
WHERE title LIKE ? OR genre LIKE ? OR description LIKE ?
ORDER BY created_at DESC
```

## 📊 Dados de Exemplo

O banco é inicializado com os seguintes itens:

1. **Inception** (Filme, 2010, Ficção Científica)
2. **The Witcher 3** (Jogo, 2015, RPG)
3. **Interstellar** (Filme, 2014, Drama/Ficção Científica)
4. **Cyberpunk 2077** (Jogo, 2020, RPG/Ação)

## 🛠️ Comandos Úteis

### Verificar Banco de Dados
```bash
# Usando SQLite CLI (se instalado)
sqlite3 media_library.db
.tables
SELECT * FROM media_items;
.quit
```

### Backup do Banco
```bash
# Copiar o arquivo do banco
cp media_library.db backup_$(date +%Y%m%d_%H%M%S).db
```

### Reset do Banco
```bash
# Remover e recriar
rm media_library.db
npm start
```

## 🔒 Segurança

- **Validação de Dados**: Todos os inputs são validados antes de inserir no banco
- **Prepared Statements**: Proteção contra SQL Injection
- **Autenticação**: Chave da API obrigatória para todas as operações
- **Sanitização**: Dados são limpos antes de inserir no banco

## 📈 Performance

- **Índices**: IDs são auto-indexados (chave primária)
- **Ordenação**: Por padrão, ordena por `created_at DESC`
- **Limpeza**: Banco é fechado adequadamente no shutdown

## 🐛 Troubleshooting

### Erro: "database is locked"
- Verifique se não há outro processo usando o banco
- Reinicie o servidor

### Erro: "no such table"
- O banco pode ter sido corrompido
- Delete o arquivo `media_library.db` e reinicie

### Erro: "permission denied"
- Verifique as permissões da pasta
- Execute com privilégios adequados

## 📝 Logs

O servidor registra todas as operações do banco:
- ✅ Criação de tabelas
- ✅ Inserção de dados de exemplo
- ❌ Erros de consulta
- 📊 Estatísticas de operações

## 🔄 Migrações

Para adicionar novos campos no futuro:

1. Adicione o campo na estrutura da tabela
2. Atualize as queries no código
3. Teste com dados existentes
4. Faça backup antes de aplicar em produção 