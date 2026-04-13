# Script PowerShell pour démarrer Elasticsearch avec Docker
# Usage: .\scripts\start-elasticsearch.ps1

Write-Host "🔍 Démarrage d'Elasticsearch avec Docker..." -ForegroundColor Cyan

# Vérifier si Docker est installé
try {
    docker --version | Out-Null
    Write-Host "✅ Docker détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Docker Desktop depuis https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Vérifier si le conteneur existe déjà
$existingContainer = docker ps -a --filter "name=elasticsearch" --format "{{.Names}}"

if ($existingContainer -eq "elasticsearch") {
    Write-Host "⚠️  Un conteneur Elasticsearch existe déjà" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous le démarrer ? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        docker start elasticsearch
        Write-Host "✅ Conteneur Elasticsearch démarré" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Utilisez: docker start elasticsearch" -ForegroundColor Cyan
        exit 0
    }
} else {
    # Démarrer avec docker-compose si le fichier existe
    if (Test-Path "docker-compose.elasticsearch.yml") {
        Write-Host "📦 Démarrage avec docker-compose..." -ForegroundColor Cyan
        docker-compose -f docker-compose.elasticsearch.yml up -d
        Write-Host "✅ Elasticsearch démarré avec docker-compose" -ForegroundColor Green
    } else {
        # Démarrer avec docker run
        Write-Host "📦 Démarrage avec docker run..." -ForegroundColor Cyan
        docker run -d `
            --name elasticsearch `
            -p 9200:9200 `
            -p 9300:9300 `
            -e "discovery.type=single-node" `
            -e "xpack.security.enabled=false" `
            -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" `
            elasticsearch:8.11.0
        
        Write-Host "✅ Elasticsearch démarré avec docker run" -ForegroundColor Green
    }
}

# Attendre que Elasticsearch soit prêt
Write-Host "⏳ Attente qu'Elasticsearch soit prêt..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9200" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $ready = $true
            Write-Host "✅ Elasticsearch est prêt !" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Host "`n⚠️  Elasticsearch prend plus de temps que prévu à démarrer" -ForegroundColor Yellow
    Write-Host "Vous pouvez vérifier avec: curl http://localhost:9200" -ForegroundColor Cyan
} else {
    Write-Host "`n🎉 Elasticsearch est opérationnel !" -ForegroundColor Green
    Write-Host "URL: http://localhost:9200" -ForegroundColor Cyan
    Write-Host "`nPour arrêter: docker stop elasticsearch" -ForegroundColor Yellow
    Write-Host "Pour redémarrer: docker start elasticsearch" -ForegroundColor Yellow
}

