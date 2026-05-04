const express = require('express');
const path = require('path');
const app = express();

// Puerto - usa variable de entorno o 8080 por defecto
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos desde la carpeta www
app.use(express.static(path.join(__dirname, 'www')));

// Manejo de rutas SPA - redirigir todo a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🎰 Ruleta Zodiaco Chino - Servidor Activo');
  console.log('='.repeat(60));
  console.log(`\n📡 Servidor corriendo en puerto: ${PORT}`);
  console.log(`\n🌐 Acceso local: http://localhost:${PORT}`);
  console.log(`\n🔗 Acceso desde otros dispositivos:`);
  console.log(`   Usa la IP de tu VPS: http://[IP_DEL_VPS]:${PORT}`);
  console.log(`\n⚠️  Asegúrate de que el puerto ${PORT} esté abierto en tu firewall\n`);
  console.log('='.repeat(60));
});
