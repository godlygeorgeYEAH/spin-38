# 🚀 Guía de Deployment - Ruleta Zodiaco Chino

## 📦 Preparación del Build

### 1. Hacer el build de producción
```bash
npm run build
```

Esto generará la carpeta `www/` con todos los archivos optimizados.

---

## 🖥️ Deployment en VPS

### Opción A: Usando el servidor Node.js incluido

#### 1. Subir archivos al VPS
Sube estos archivos/carpetas a tu VPS:
- `www/` (carpeta completa con el build)
- `server.js` (servidor Express)
- `package.json` (para las dependencias)

```bash
# Ejemplo usando SCP
scp -r www/ usuario@ip-del-vps:/ruta/en/vps/
scp server.js usuario@ip-del-vps:/ruta/en/vps/
scp package.json usuario@ip-del-vps:/ruta/en/vps/
```

#### 2. En el VPS, instalar dependencias
```bash
ssh usuario@ip-del-vps
cd /ruta/en/vps/
npm install express
```

#### 3. Ejecutar el servidor
```bash
# Opción 1: Ejecutar directamente
node server.js

# Opción 2: Con npm script
npm run serve:prod

# Opción 3: En puerto personalizado
PORT=3000 node server.js
```

#### 4. Mantener el servidor corriendo con PM2 (Recomendado)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la aplicación
pm2 start server.js --name "ruleta-zodiaco"

# Ver logs
pm2 logs ruleta-zodiaco

# Reiniciar
pm2 restart ruleta-zodiaco

# Detener
pm2 stop ruleta-zodiaco

# Auto-inicio al reiniciar el servidor
pm2 startup
pm2 save
```

---

### Opción B: Usando NGINX (Producción)

#### 1. Subir solo la carpeta www
```bash
scp -r www/* usuario@ip-del-vps:/var/www/ruleta-zodiaco/
```

#### 2. Configurar NGINX
Crear archivo: `/etc/nginx/sites-available/ruleta-zodiaco`

```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # O usa la IP del VPS

    root /var/www/ruleta-zodiaco;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Comprimir archivos
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 3. Activar configuración
```bash
sudo ln -s /etc/nginx/sites-available/ruleta-zodiaco /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔥 Configuración de Firewall

### Abrir puerto en el firewall
```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 8080/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

---

## 🌐 Acceso a la Aplicación

Una vez desplegado, accede a la app desde:

- **Localmente en el VPS:** `http://localhost:8080`
- **Desde tu red local:** `http://IP_DEL_VPS:8080`
- **Desde internet:** `http://IP_PUBLICA_DEL_VPS:8080`

---

## 🔧 Configuración de Puertos

Por defecto el servidor usa el puerto **8080**. Para cambiarlo:

```bash
# Método 1: Variable de entorno
PORT=3000 node server.js

# Método 2: Editar server.js
# Cambiar la línea: const PORT = process.env.PORT || 8080;
```

---

## 📊 Monitoreo

### Ver logs en tiempo real (con PM2)
```bash
pm2 logs ruleta-zodiaco --lines 100
```

### Ver estado del servidor
```bash
pm2 status
```

---

## 🔄 Actualizar la Aplicación

Cuando hagas cambios:

1. **Hacer nuevo build:**
   ```bash
   npm run build
   ```

2. **Subir al VPS:**
   ```bash
   scp -r www/* usuario@ip-del-vps:/ruta/en/vps/www/
   ```

3. **Reiniciar servidor (si usas PM2):**
   ```bash
   pm2 restart ruleta-zodiaco
   ```

---

## ⚠️ Troubleshooting

### El servidor no inicia
- Verifica que el puerto no esté en uso: `netstat -tuln | grep 8080`
- Verifica permisos de los archivos

### No puedo acceder desde otros dispositivos
- Verifica que el firewall permita el puerto
- Verifica que el servidor esté escuchando en `0.0.0.0` (no solo `localhost`)

### Errores 404 en rutas
- El servidor ya está configurado para manejar rutas SPA
- Si usas NGINX, verifica la configuración `try_files`

---

## 📝 Notas Adicionales

- Los archivos en `www/` están optimizados y minificados
- El servidor incluye manejo correcto de rutas SPA
- Para HTTPS, configura un certificado SSL con Let's Encrypt + NGINX
