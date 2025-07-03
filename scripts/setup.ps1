# Script de Configuração - Biblioteca de Mídia com Banco de Dados
# Execute este script no PowerShell para configurar o projeto

Write-Host "🚀 Configurando Biblioteca de Mídia com Banco de Dados SQLite" -ForegroundColor Green
Write-Host ""

# Verificar se o Node.js está instalado
Write-Host "📋 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "📥 Baixe e instale o Node.js em: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "💡 Após instalar, reinicie o PowerShell e execute este script novamente." -ForegroundColor Cyan
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o npm está instalado
Write-Host "📋 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o package.json existe
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json não encontrado!" -ForegroundColor Red
    Write-Host "💡 Certifique-se de estar na pasta correta do projeto." -ForegroundColor Cyan
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Instalar dependências
Write-Host ""
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    Write-Host "💡 Verifique sua conexão com a internet e tente novamente." -ForegroundColor Cyan
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se os arquivos necessários existem
Write-Host ""
Write-Host "📋 Verificando arquivos do projeto..." -ForegroundColor Yellow

$requiredFiles = @(
    "public/index.html",
    "public/bolt/app.js",
    "public/bolt/config.js",
    "src/server/index.js"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Alguns arquivos estão faltando!" -ForegroundColor Red
    Write-Host "💡 Certifique-se de que todos os arquivos do projeto estão presentes." -ForegroundColor Cyan
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se a porta 3000 está livre
Write-Host ""
Write-Host "🔍 Verificando porta 3000..." -ForegroundColor Yellow
try {
    $connection = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet
    if ($connection) {
        Write-Host "⚠️  Porta 3000 já está em uso!" -ForegroundColor Yellow
        Write-Host "💡 Outro processo pode estar usando a porta 3000." -ForegroundColor Cyan
        Write-Host "💡 Você pode:" -ForegroundColor Cyan
        Write-Host "   1. Parar o processo que está usando a porta 3000" -ForegroundColor Cyan
        Write-Host "   2. Ou alterar a porta no arquivo api-example.js" -ForegroundColor Cyan
    } else {
        Write-Host "✅ Porta 3000 está livre" -ForegroundColor Green
    }
} catch {
    Write-Host "✅ Porta 3000 está livre" -ForegroundColor Green
}

# Mostrar informações finais
Write-Host ""
Write-Host "🎉 Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: npm start" -ForegroundColor White
Write-Host "2. Abra http://localhost:3000 no navegador" -ForegroundColor White
Write-Host "3. Ou use Live Server no VS Code para desenvolvimento" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URLs importantes:" -ForegroundColor Cyan
Write-Host "• Aplicação: http://localhost:3000 (após iniciar o servidor)" -ForegroundColor White
Write-Host "• API Test: http://localhost:3000/test" -ForegroundColor White
Write-Host "• API Docs: http://localhost:3000/media-items" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Chave da API: e476cca32fa8443da410678adfbff88e" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentação:" -ForegroundColor Cyan
Write-Host "• README.md - Guia principal" -ForegroundColor White
Write-Host "• docs/DATABASE.md - Documentação do banco de dados" -ForegroundColor White
Write-Host "• docs/YOUTUBE_SETUP.md - Configuração do YouTube" -ForegroundColor White
Write-Host ""

# Perguntar se quer iniciar o servidor
$startServer = Read-Host "🚀 Deseja iniciar o servidor agora? (s/n)"
if ($startServer -eq "s" -or $startServer -eq "S" -or $startServer -eq "sim" -or $startServer -eq "Sim") {
    Write-Host ""
    Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
    Write-Host "💡 Pressione Ctrl+C para parar o servidor" -ForegroundColor Cyan
    Write-Host ""
    npm start
} else {
    Write-Host ""
    Write-Host "💡 Para iniciar o servidor manualmente, execute: npm start" -ForegroundColor Cyan
    Read-Host "Pressione Enter para sair"
} 