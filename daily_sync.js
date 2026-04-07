/**
 * Script de synchronisation quotidienne — cross-platform (Windows + Linux)
 * Remplace daily_sync.sh
 * Usage: node daily_sync.js
 */

import { runScraper } from './scraper.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Demarrage du pompage quotidien...');
  console.log(`Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log(`Plateforme: ${process.platform} (${process.arch})`);
  console.log('');

  try {
    await runScraper();

    const latestPath = path.join(__dirname, 'latest_jobs.json');
    const openPosPath = path.join(__dirname, 'open_positions_fr.json');

    try {
      await fs.access(latestPath);
      console.log('Scraper termine. Export JSON pret.');

      // Copie vers open_positions_fr.json pour Leadclaw
      const data = await fs.readFile(latestPath);
      await fs.writeFile(openPosPath, data);
      console.log('Donnees copiees vers open_positions_fr.json');
      console.log('Synchronisation terminee.');
    } catch {
      console.error('Erreur: latest_jobs.json non genere.');
      process.exit(1);
    }
  } catch (e) {
    console.error('Erreur scraper:', e.message);
    process.exit(1);
  }
}

main();
