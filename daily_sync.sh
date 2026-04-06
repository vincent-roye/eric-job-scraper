#!/bin/bash
# Script de synchronisation quotidienne "Open Positions"
# Exécuté chaque matin à 08h00

cd /home/vincent/.openclaw/workspace-eric

echo "🚜 Démarrage du pompage quotidien..."

# 1. Lancer le scraper
/home/vincent/.nvm/versions/node/v24.14.0/bin/node scraper.js > /tmp/eric_scraper_log.txt 2>&1

# 2. Vérifier si le fichier JSON a été généré
if [ -f "latest_jobs.json" ]; then
    echo "✅ Scraper terminé. Export JSON prêt."
    
    # 3. Notifier Leadclaw pour mise à jour (via openclaw cli si dispo, ou simple log)
    echo "🦞 Envoi des données à Leadclaw..."
    # Note: L'envoi réel se fait via sessions_send dans OpenClaw, 
    # ici on s'assure juste que le fichier est à jour pour Leadclaw.
    cp latest_jobs.json open_positions_fr.json
    
    echo "✅ Synchronisation terminée."
else
    echo "❌ Erreur: latest_jobs.json non généré."
fi
