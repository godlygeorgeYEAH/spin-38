# Cómo probar Web Share API en tu teléfono usando ngrok

## Paso 1: Instalar ngrok

### Windows:
1. Ve a https://ngrok.com/download
2. Descarga el archivo `.zip` para Windows
3. Extrae `ngrok.exe` en una carpeta (ej: `C:\ngrok\`)
4. Agrega la carpeta al PATH o úsalo directamente

### O con npm (cualquier OS):
```bash
npm install -g ngrok
```

## Paso 2: Iniciar el servidor Ionic

```bash
cd "c:\work\work\ruleta zodiaco\ruleta-zodiaco-chino anderson\ruleta-zodiaco-chino"
ionic serve
```

Deja esta terminal abierta. El servidor estará en `http://localhost:8100`

## Paso 3: Crear túnel HTTPS con ngrok

Abre una **nueva terminal** y ejecuta:

```bash
ngrok http 8100
```

Verás algo como:

```
ngrok

Session Status                online
Account                       Tu cuenta (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:8100

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

## Paso 4: Abrir en tu teléfono

1. Copia la URL HTTPS (ej: `https://abc123xyz.ngrok-free.app`)
2. Abre esa URL en el navegador de tu teléfono
3. Puede aparecer un aviso de ngrok, presiona "Visit Site"
4. ¡Listo! Ahora Web Share API funcionará

## Notas importantes:

- **La URL cambia cada vez** que reinicias ngrok (en versión gratis)
- **No cierres la terminal de ngrok** mientras estés probando
- **ngrok gratis tiene límite** de conexiones (40/minuto), suficiente para desarrollo
- La URL funciona en **cualquier dispositivo** conectado a internet

## Verificar que funciona:

1. Abre la app en tu teléfono via ngrok
2. Gana una partida
3. Presiona "Compartir"
4. Deberías ver el diálogo nativo de compartir con la imagen del modal

## Troubleshooting:

**"ERR_NGROK_3200"**: Tu cuenta ngrok necesita verificación. Crea cuenta gratis en https://ngrok.com

**"This site can't be reached"**: Verifica que ionic serve esté corriendo en localhost:8100

**Web Share API no funciona**: Asegúrate de usar la URL HTTPS de ngrok, no la HTTP

## Alternativa rápida sin instalar nada:

Si no quieres instalar ngrok, puedes usar VS Code con la extensión "Live Server" y configurar port forwarding en GitHub Codespaces, pero ngrok es más simple.
