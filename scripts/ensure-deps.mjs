// C16a: Vor `npm run dev` / `npm run build` prüfen, ob alle Pakete aus package.json installiert sind.
// Hintergrund: Nach `git pull` fehlte die in C16 neu hinzugekommene Bibliothek „jspdf“ lokal (node_modules wird nicht
// mit Git übertragen) → Vite meldete „Failed to resolve import "jspdf"“. Fehlt ein Paket, wird `npm install`
// automatisch ausgeführt. Läuft auf Windows, macOS und Linux; ohne fehlende Pakete dauert die Prüfung nur Millisekunden.
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const wanted = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const missing = wanted.filter((name) => !existsSync(join(root, 'node_modules', ...name.split('/'), 'package.json')));

if (missing.length > 0) {
  console.log(`\n[TrainerPro] Fehlende Pakete: ${missing.join(', ')} – führe „npm install“ aus …\n`);
  const result = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error('\n[TrainerPro] „npm install“ ist fehlgeschlagen. Bitte manuell im Projektordner ausführen.\n');
    process.exit(result.status ?? 1);
  }
}
