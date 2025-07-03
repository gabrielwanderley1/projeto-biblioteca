# Biblioteca de Mídia - Integração com API e Banco de Dados

Este projeto é uma aplicação web para gerenciar uma biblioteca pessoal de filmes e jogos, integrada com uma API de banco de dados SQLite.

## 🚀 Funcionalidades

- **Adicionar itens**: Filmes e jogos com informações completas
- **Editar itens**: Modificar dados de qualquer item da biblioteca
- **Excluir itens**: Remover itens com confirmação
- **Filtros**: Filtrar por tipo, status e favoritos
- **Busca**: Pesquisar por título, gênero ou descrição
- **Avaliações**: Sistema de estrelas (1-5)
- **Status**: Para assistir/jogar, Assistindo/jogando, Concluído
- **Favoritos**: Marcar itens como favoritos
- **Sincronização**: Integração com API de banco de dados SQLite
- **Fallback**: Funciona offline usando localStorage
- **Persistência**: Dados salvos em banco de dados real

## 🗄️ Banco de Dados

### SQLite
- **Arquivo**: `media_library.db` (criado automaticamente)
- **Tabela**: `media_items` com todos os campos necessários
- **Dados de Exemplo**: 4 itens pré-carregados
- **Backup**: Arquivo único, fácil de fazer backup

### Estrutura da Tabela
```sql
CREATE TABLE media_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,           -- 'movie' ou 'game'
  title TEXT NOT NULL,          -- Título
  year TEXT,                    -- Ano de lançamento
  genre TEXT,                   -- Gênero(s)
  description TEXT,             -- Descrição
  rating INTEGER DEFAULT 0,     -- Avaliação (0-5)
  status TEXT DEFAULT 'watchlist', -- Status
  favorite BOOLEAN DEFAULT 0,   -- Favorito
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuração da API

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar o Servidor com Banco de Dados
```bash
npm start
```

O banco de dados será criado automaticamente na primeira execução.

### 3. Configurar a URL da API

A URL já está configurada para `http://localhost:3000` no arquivo `.bolt/config.js`.

## 📁 Estrutura do Projeto

```
project/
├── index.html              # Página principal
├── .bolt/
│   ├── app.js             # Lógica principal da aplicação
│   └── config.js          # Configurações da API
├── api-example.js         # Servidor API com SQLite
├── package.json           # Dependências do projeto
├── media_library.db       # Banco de dados SQLite (criado automaticamente)
├── DATABASE.md            # Documentação do banco de dados
├── README.md              # Este arquivo
└── update_cards.ps1       # Script PowerShell (se aplicável)
```

## 🔄 Funcionamento

### Modo Online (API + Banco de Dados)
1. A aplicação conecta com a API local
2. Dados são salvos e carregados do banco SQLite
3. Mostra indicador de carregamento durante operações
4. Exibe notificações de sucesso/erro
5. Dados persistem entre reinicializações do servidor

### Modo Offline (Fallback)
1. Se a API não estiver disponível, usa localStorage
2. Dados são salvos localmente no navegador
3. Notificações informam sobre o modo offline
4. Funcionalidade completa mantida

## 🎨 Interface

- **Design responsivo** com Tailwind CSS
- **Modo escuro** por padrão
- **Animações suaves** e transições
- **Indicador de carregamento** na parte superior
- **Notificações toast** para feedback do usuário
- **Modais** para adicionar/editar/visualizar itens

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura da página
- **CSS3**: Estilização com Tailwind CSS
- **JavaScript (ES6+)**: Lógica da aplicação
- **Fetch API**: Comunicação com a API

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **SQLite3**: Banco de dados
- **CORS**: Cross-origin resource sharing

### Armazenamento
- **SQLite**: Banco de dados principal
- **localStorage**: Fallback offline

## 📱 Compatibilidade

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Node.js 14+

## 🔒 Segurança

- **Chave da API**: Autenticação obrigatória
- **Validação de Dados**: Inputs validados no servidor
- **Prepared Statements**: Proteção contra SQL Injection
- **Sanitização**: Dados limpos antes de inserir no banco
- **Timeout**: Requisições com timeout configurável

## 🚀 Como Usar

### 1. Configurar o Projeto
```bash
# Clonar ou baixar o projeto
cd project

# Instalar dependências
npm install
```

### 2. Iniciar o Servidor
```bash
# Iniciar servidor com banco de dados
npm start
```

### 3. Acessar a Aplicação
- Abra `index.html` em um servidor web
- Ou use um servidor local como Live Server (VS Code)

### 4. Usar a Aplicação
- Clique em "Adicionar" para criar novos itens
- Use os filtros para organizar sua biblioteca
- Busque por título, gênero ou descrição
- Edite ou exclua itens conforme necessário

## 📊 Dados de Exemplo

O banco é inicializado automaticamente com:
- **Inception** (Filme, 2010, Ficção Científica)
- **The Witcher 3** (Jogo, 2015, RPG)
- **Interstellar** (Filme, 2014, Drama/Ficção Científica)
- **Cyberpunk 2077** (Jogo, 2020, RPG/Ação)

## 🛠️ Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Servidor com auto-reload
npm start            # Servidor de produção
```

### Banco de Dados
```bash
# Verificar banco (se SQLite CLI estiver instalado)
sqlite3 media_library.db
.tables
SELECT * FROM media_items;
.quit

# Backup do banco
cp media_library.db backup_$(date +%Y%m%d_%H%M%S).db

# Reset do banco
rm media_library.db && npm start
```

## 📝 Logs e Debug

O servidor mostra logs detalhados:
- ✅ Criação de tabelas
- ✅ Inserção de dados de exemplo
- 📊 Operações do banco de dados
- ❌ Erros e exceções
- 🔑 Autenticação de requisições

## 🐛 Troubleshooting

### Erro: "database is locked"
- Verifique se não há outro processo usando o banco
- Reinicie o servidor

### Erro: "connection refused"
- Certifique-se de que o servidor está rodando (`npm start`)
- Verifique se a porta 3000 está livre

### Erro: "module not found"
- Execute `npm install` para instalar dependências
- Verifique se o Node.js está instalado

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Implemente suas mudanças
4. Teste a funcionalidade
5. Envie um pull request

## 📚 Documentação Adicional

- [DATABASE.md](./DATABASE.md) - Documentação detalhada do banco de dados
- [api-example.js](./api-example.js) - Código do servidor API
- [.bolt/config.js](./.bolt/config.js) - Configurações da aplicação 