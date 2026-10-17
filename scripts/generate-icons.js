import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('[generate-icons] Generando iconos PWA...');

try {
  // 192x192
  execSync(
    'convert -size 192x192 xc:none -fill "#334155" -draw "roundrectangle 0,0 191,191 38,38" -fill white -gravity center -font Liberation-Sans-Bold -pointsize 68 -annotate 0 "29N" ' +
      path.join(publicDir, 'icon-192.png')
  );

  // 512x512
  execSync(
    'convert -size 512x512 xc:none -fill "#334155" -draw "roundrectangle 0,0 511,511 104,104" -fill white -gravity center -font Liberation-Sans-Bold -pointsize 180 -annotate 0 "29N" ' +
      path.join(publicDir, 'icon-512.png')
  );

  // 512x512 maskable (full bleed background, smaller text inside 80% safe zone)
  execSync(
    'convert -size 512x512 xc:"#334155" -fill white -gravity center -font Liberation-Sans-Bold -pointsize 140 -annotate 0 "29N" ' +
      path.join(publicDir, 'icon-maskable-512.png')
  );

  // apple-touch-icon (180x180, cuadrado sólido sin esquinas redondeadas ni transparencias)
  execSync(
    'convert -size 180x180 xc:"#334155" -fill white -gravity center -font Liberation-Sans-Bold -pointsize 64 -annotate 0 "29N" ' +
      path.join(publicDir, 'apple-touch-icon.png')
  );

  console.log('[generate-icons] Iconos generados con éxito en public/');
} catch (e) {
  console.error('[generate-icons] Error ejecutando convert:', e);
  process.exit(1);
}
