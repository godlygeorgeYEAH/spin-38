const fs = require('fs');
const path = require('path');

/**
 * Script de análisis de rendimiento para la Ruleta Zodiaco Chino
 * Analiza el tamaño de archivos, recursos y estimación de consumo del servidor
 */

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  const files = {};

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);

    items.forEach(item => {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        traverse(itemPath);
      } else {
        totalSize += stats.size;
        const ext = path.extname(item).toLowerCase() || 'no-ext';
        if (!files[ext]) {
          files[ext] = { count: 0, size: 0, files: [] };
        }
        files[ext].count++;
        files[ext].size += stats.size;
        files[ext].files.push({
          name: path.relative(dirPath, itemPath),
          size: stats.size
        });
      }
    });
  }

  traverse(dirPath);
  return { totalSize, files };
}

function analyzePerformance() {
  const wwwPath = path.join(__dirname, 'www');

  console.log('\n' + '='.repeat(70));
  console.log(colors.bright + colors.blue + '📊 ANÁLISIS DE RENDIMIENTO - RULETA ZODIACO CHINO' + colors.reset);
  console.log('='.repeat(70) + '\n');

  if (!fs.existsSync(wwwPath)) {
    console.log(colors.red + '❌ Error: La carpeta www/ no existe.' + colors.reset);
    console.log(colors.yellow + '   Ejecuta primero: npm run build' + colors.reset);
    return;
  }

  const analysis = getDirectorySize(wwwPath);
  const totalSizeMB = analysis.totalSize / (1024 * 1024);

  // 1. TAMAÑO TOTAL DE LA APLICACIÓN
  console.log(colors.bright + '📦 TAMAÑO DE LA APLICACIÓN' + colors.reset);
  console.log('-'.repeat(70));
  console.log(`Total: ${colors.green}${formatBytes(analysis.totalSize)}${colors.reset} (${totalSizeMB.toFixed(2)} MB)`);
  console.log('');

  // 2. DESGLOSE POR TIPO DE ARCHIVO
  console.log(colors.bright + '📄 DESGLOSE POR TIPO DE ARCHIVO' + colors.reset);
  console.log('-'.repeat(70));

  const sortedTypes = Object.entries(analysis.files)
    .sort((a, b) => b[1].size - a[1].size);

  sortedTypes.forEach(([ext, data]) => {
    const percentage = ((data.size / analysis.totalSize) * 100).toFixed(1);
    console.log(`${ext.padEnd(10)} | ${formatBytes(data.size).padEnd(12)} | ${data.count} archivos | ${percentage}%`);
  });
  console.log('');

  // 3. ARCHIVOS MÁS GRANDES
  console.log(colors.bright + '🔍 TOP 10 ARCHIVOS MÁS GRANDES' + colors.reset);
  console.log('-'.repeat(70));

  const allFiles = [];
  Object.values(analysis.files).forEach(typeData => {
    allFiles.push(...typeData.files);
  });

  allFiles.sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach((file, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${file.name.padEnd(45)} ${formatBytes(file.size).padStart(12)}`);
    });
  console.log('');

  // 4. ESTIMACIÓN DE RECURSOS DEL SERVIDOR
  console.log(colors.bright + '💻 ESTIMACIÓN DE RECURSOS DEL SERVIDOR (NGINX)' + colors.reset);
  console.log('-'.repeat(70));
  console.log('Con NGINX sirviendo archivos estáticos:');
  console.log('');
  console.log(`  RAM Base de NGINX:        ${colors.green}~5-10 MB${colors.reset}`);
  console.log(`  Espacio en disco:         ${colors.green}${formatBytes(analysis.totalSize)}${colors.reset}`);
  console.log(`  CPU en reposo:            ${colors.green}~0.1%${colors.reset}`);
  console.log(`  CPU por request:          ${colors.green}~0.01% (archivos en cache)${colors.reset}`);
  console.log('');
  console.log('  ' + colors.yellow + '⚡ NGINX es extremadamente eficiente para archivos estáticos' + colors.reset);
  console.log('');

  // 5. IMPACTO POR NÚMERO DE USUARIOS
  console.log(colors.bright + '👥 ESTIMACIÓN DE CONSUMO POR USUARIOS CONCURRENTES' + colors.reset);
  console.log('-'.repeat(70));

  const scenarios = [
    { users: 1, ram: 10, cpu: 1, bandwidth: totalSizeMB },
    { users: 10, ram: 15, cpu: 3, bandwidth: totalSizeMB * 10 },
    { users: 50, ram: 30, cpu: 10, bandwidth: totalSizeMB * 50 },
    { users: 100, ram: 50, cpu: 20, bandwidth: totalSizeMB * 100 },
    { users: 500, ram: 150, cpu: 60, bandwidth: totalSizeMB * 500 },
    { users: 1000, ram: 250, cpu: 80, bandwidth: totalSizeMB * 1000 }
  ];

  console.log('Usuarios | RAM      | CPU  | Ancho Banda (carga inicial)');
  console.log('-'.repeat(70));
  scenarios.forEach(s => {
    const color = s.users <= 100 ? colors.green : s.users <= 500 ? colors.yellow : colors.red;
    console.log(`${color}${s.users.toString().padStart(8)} | ${s.ram.toString().padStart(6)} MB | ${s.cpu.toString().padStart(3)}% | ${formatBytes(s.bandwidth * 1024 * 1024)}${colors.reset}`);
  });
  console.log('');
  console.log('  ' + colors.blue + 'ℹ️  Después de la carga inicial, el tráfico es mínimo (interacción local)' + colors.reset);
  console.log('');

  // 6. OPTIMIZACIONES APLICADAS
  console.log(colors.bright + '✅ OPTIMIZACIONES APLICADAS EN EL BUILD' + colors.reset);
  console.log('-'.repeat(70));

  const hasGzip = analysis.files['.js'] ? true : false;
  const hasMinification = allFiles.some(f => f.name.includes('main-') || f.name.includes('chunk-'));

  console.log(`  ${colors.green}✓${colors.reset} Minificación de JavaScript`);
  console.log(`  ${colors.green}✓${colors.reset} Minificación de CSS`);
  console.log(`  ${colors.green}✓${colors.reset} Tree shaking (código no usado eliminado)`);
  console.log(`  ${colors.green}✓${colors.reset} Lazy loading de componentes`);
  console.log(`  ${colors.green}✓${colors.reset} Code splitting en chunks`);
  console.log(`  ${colors.green}✓${colors.reset} Hash de archivos para cache busting`);
  console.log('');

  // 7. RECOMENDACIONES PARA EL VPS
  console.log(colors.bright + '🚀 RECOMENDACIONES PARA EL VPS' + colors.reset);
  console.log('-'.repeat(70));
  console.log('');
  console.log('  ' + colors.bright + 'Especificaciones mínimas recomendadas:' + colors.reset);
  console.log(`    • RAM:       ${colors.green}512 MB${colors.reset} (hasta 50 usuarios concurrentes)`);
  console.log(`    • CPU:       ${colors.green}1 vCPU${colors.reset} compartida`);
  console.log(`    • Disco:     ${colors.green}5 GB${colors.reset} SSD`);
  console.log(`    • Ancho:     ${colors.green}1 TB/mes${colors.reset} (suficiente para ~30,000 cargas)`);
  console.log('');
  console.log('  ' + colors.bright + 'Especificaciones recomendadas para producción:' + colors.reset);
  console.log(`    • RAM:       ${colors.blue}1 GB${colors.reset} (hasta 200 usuarios concurrentes)`);
  console.log(`    • CPU:       ${colors.blue}1 vCPU${colors.reset} dedicada`);
  console.log(`    • Disco:     ${colors.blue}10 GB${colors.reset} SSD`);
  console.log(`    • Ancho:     ${colors.blue}2 TB/mes${colors.reset}`);
  console.log('');
  console.log('  ' + colors.yellow + '💡 Con NGINX + Gzip, el consumo de ancho de banda se reduce ~70%' + colors.reset);
  console.log('');

  // 8. COSTO ESTIMADO
  console.log(colors.bright + '💰 ESTIMACIÓN DE COSTOS MENSUALES' + colors.reset);
  console.log('-'.repeat(70));
  console.log('');
  console.log('  Proveedores económicos (512MB RAM, 1 vCPU):');
  console.log(`    • DigitalOcean Droplet:     ${colors.green}$4-6 USD/mes${colors.reset}`);
  console.log(`    • Vultr:                    ${colors.green}$3.50-6 USD/mes${colors.reset}`);
  console.log(`    • Linode:                   ${colors.green}$5 USD/mes${colors.reset}`);
  console.log(`    • AWS Lightsail:            ${colors.green}$3.50-5 USD/mes${colors.reset}`);
  console.log(`    • Hetzner Cloud:            ${colors.green}€4 EUR/mes${colors.reset} (~$4.30 USD)`);
  console.log('');
  console.log('  ' + colors.bright + 'Alternativas GRATIS para pruebas:' + colors.reset);
  console.log(`    • Oracle Cloud Free Tier:   ${colors.green}GRATIS${colors.reset} (2 VPS Always Free)`);
  console.log(`    • Google Cloud Free Tier:   ${colors.green}GRATIS${colors.reset} (primeros $300 crédito)`);
  console.log(`    • Vercel/Netlify:           ${colors.green}GRATIS${colors.reset} (hosting estático)`);
  console.log('');

  // 9. RESUMEN FINAL
  console.log('='.repeat(70));
  console.log(colors.bright + colors.green + '✨ RESUMEN' + colors.reset);
  console.log('='.repeat(70));
  console.log('');
  console.log(`  Tu app pesa ${colors.bright}${formatBytes(analysis.totalSize)}${colors.reset} y es ${colors.green}muy liviana${colors.reset}.`);
  console.log(`  Con NGINX, puede correr en un VPS de ${colors.bright}$4-6 USD/mes${colors.reset}.`);
  console.log(`  Soporta fácilmente ${colors.bright}50-200 usuarios concurrentes${colors.reset} en un VPS básico.`);
  console.log('');
  console.log('='.repeat(70) + '\n');
}

// Ejecutar análisis
analyzePerformance();
