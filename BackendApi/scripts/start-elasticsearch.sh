#!/bin/bash
# Script bash pour démarrer Elasticsearch avec Docker
# Usage: ./scripts/start-elasticsearch.sh

echo "🔍 Démarrage d'Elasticsearch avec Docker..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé ou n'est pas dans le PATH"
    echo "Veuillez installer Docker depuis https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker détecté"

# Vérifier si le conteneur existe déjà
if docker ps -a --format '{{.Names}}' | grep -q "^elasticsearch$"; then
    echo "⚠️  Un conteneur Elasticsearch existe déjà"
    read -p "Voulez-vous le démarrer ? (O/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        docker start elasticsearch
        echo "✅ Conteneur Elasticsearch démarré"
    else
        echo "ℹ️  Utilisez: docker start elasticsearch"
        exit 0
    fi
else
    # Démarrer avec docker-compose si le fichier existe
    if [ -f "docker-compose.elasticsearch.yml" ]; then
        echo "📦 Démarrage avec docker-compose..."
        docker-compose -f docker-compose.elasticsearch.yml up -d
        echo "✅ Elasticsearch démarré avec docker-compose"
    else
        # Démarrer avec docker run
        echo "📦 Démarrage avec docker run..."
        docker run -d \
            --name elasticsearch \
            -p 9200:9200 \
            -p 9300:9300 \
            -e "discovery.type=single-node" \
            -e "xpack.security.enabled=false" \
            -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
            elasticsearch:8.11.0
        
        echo "✅ Elasticsearch démarré avec docker run"
    fi
fi

# Attendre que Elasticsearch soit prêt
echo "⏳ Attente qu'Elasticsearch soit prêt..."
max_attempts=30
attempt=0
ready=false

while [ $attempt -lt $max_attempts ] && [ "$ready" = false ]; do
    sleep 2
    attempt=$((attempt + 1))
    if curl -s http://localhost:9200 > /dev/null 2>&1; then
        ready=true
        echo "✅ Elasticsearch est prêt !"
    else
        echo -n "."
    fi
done

echo
if [ "$ready" = false ]; then
    echo "⚠️  Elasticsearch prend plus de temps que prévu à démarrer"
    echo "Vous pouvez vérifier avec: curl http://localhost:9200"
else
    echo "🎉 Elasticsearch est opérationnel !"
    echo "URL: http://localhost:9200"
    echo ""
    echo "Pour arrêter: docker stop elasticsearch"
    echo "Pour redémarrer: docker start elasticsearch"
fi

