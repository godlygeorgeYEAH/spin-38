# GUÍA: Archivos para Entregar al Cliente

> **Proyecto:** Spin Zodiac - Ruleta Zodiaco Chino
> **Fecha:** 01 de Febrero, 2026
> **Versión:** 1.0 - Con sistema de backend RNG completo

---

## 📦 ESTRUCTURA DE ENTREGA

### Opción 1: Entregar Proyecto Completo (Recomendado)

Comprime toda la carpeta del proyecto **excluyendo** los siguientes directorios:

**Carpetas a EXCLUIR:**
```
node_modules/
.angular/
www/
platforms/
plugins/
.claude/
```

**Carpeta a comprimir:**
```
ruleta-zodiaco-chino/
```

### Opción 2: Entregar Solo Código Fuente

Si el cliente tiene experiencia técnica y puede ejecutar `npm install`, puedes entregar solo:

```
ruleta-zodiaco-chino/
├── src/                          # Código fuente de la aplicación
├── docs/                         # Documentación completa
├── mock-server.js               # Servidor de desarrollo (backend simulado)
├── package.json                 # Dependencias del proyecto
├── package-lock.json            # Versiones exactas de dependencias
├── angular.json                 # Configuración de Angular
├── tsconfig.json               # Configuración de TypeScript
├── ionic.config.json           # Configuración de Ionic
├── capacitor.config.ts         # Configuración de Capacitor
└── README.md                    # Instrucciones de uso
```

---

## 📋 ARCHIVOS CRÍTICOS

### 1. Código Fuente (`src/`)

**Toda la carpeta `src/` debe incluirse:**
- `src/app/` - Componentes, servicios, páginas, interfaces
- `src/assets/` - Imágenes, audio, animaciones
- `src/environments/` - Configuración de entornos
- `src/theme/` - Estilos y temas
- `src/index.html` - Página principal
- `src/main.ts` - Punto de entrada

### 2. Documentación (`docs/`)

**Todos los documentos son importantes:**
- ✅ `FLUJO-ENDPOINTS.md` - Explica cuándo y cómo se usan los endpoints
- ✅ `ESTADO-ACTUAL-IMPLEMENTACION.md` - Estado detallado de la implementación
- ✅ `PLANIFICACION-BACKEND-COMUNICACION.md` - Planificación completa del sistema
- ✅ `ARCHIVOS-PARA-CLIENTE.md` - Este documento

### 3. Mock Server (`mock-server.js`)

**⚠️ IMPORTANTE:**
- El archivo `mock-server.js` es el backend de desarrollo
- **NO debe usarse en producción**
- Está configurado en `.gitignore` para no subirlo a Git
- **SÍ debe entregarse al cliente** para que puedan probar localmente
- El cliente debe implementar su propio backend real siguiendo los endpoints documentados

### 4. Configuración

**Archivos de configuración necesarios:**
- ✅ `package.json` - Lista todas las dependencias
- ✅ `package-lock.json` - Versiones exactas de dependencias
- ✅ `angular.json` - Configuración de Angular
- ✅ `tsconfig.json` - Configuración de TypeScript
- ✅ `ionic.config.json` - Configuración de Ionic
- ✅ `capacitor.config.ts` - Configuración para builds nativos

---

## 🚫 ARCHIVOS A NO INCLUIR

### Nunca incluir:
```
❌ node_modules/          # Muy pesado, se instala con npm install
❌ .angular/               # Caché de Angular, se genera automáticamente
❌ www/                    # Build de desarrollo, se genera con ionic build
❌ platforms/              # Plataformas nativas, se generan con capacitor
❌ plugins/                # Plugins nativos, se instalan automáticamente
❌ .claude/                # Configuración local de Claude Code
❌ .vscode/                # Configuración local de VS Code (opcional)
❌ .DS_Store               # Archivo de macOS
❌ Thumbs.db               # Archivo de Windows
```

---

## 📝 INSTRUCCIONES DE INSTALACIÓN (Para el Cliente)

Crea un archivo `README-INSTALACION.md` con estas instrucciones:

```markdown
# Instrucciones de Instalación - Spin Zodiac

## Requisitos Previos

- Node.js v18 o superior
- npm v8 o superior
- Ionic CLI: `npm install -g @ionic/cli`
- Angular CLI: `npm install -g @angular/cli`

## Pasos de Instalación

### 1. Instalar Dependencias

```bash
cd ruleta-zodiaco-chino
npm install
```

### 2. Iniciar Mock Server (Backend de Desarrollo)

En una terminal:
```bash
node mock-server.js
```

El servidor iniciará en: http://localhost:3000

### 3. Iniciar Aplicación

En otra terminal:
```bash
ionic serve
```

La app iniciará en: http://localhost:8100

### 4. Probar la Aplicación

Acceder con un token de prueba:
```
http://localhost:8100/?token=test123&lng=esp
```

**Usuarios de prueba disponibles:**
- `test123` - Balance: $10,000
- `abc123` - Balance: $50,000
- `demo` - Balance: $100,000

## Configuración de Producción

Para producción, el cliente debe:

1. **Implementar Backend Real**
   - Seguir los endpoints documentados en `docs/FLUJO-ENDPOINTS.md`
   - Implementar los 5 endpoints necesarios

2. **Actualizar URL del Backend**
   - Archivo: `src/environments/environment.prod.ts`
   - Cambiar `apiUrl` a la URL real del backend

3. **Build de Producción**
   ```bash
   ionic build --prod
   ```

## Soporte

Para preguntas sobre la implementación:
- Ver documentación en la carpeta `docs/`
- Revisar interfaces TypeScript en `src/app/interfaces/`
- Consultar código fuente en `src/app/`
```

---

## 🎯 ENDPOINTS QUE EL CLIENTE DEBE IMPLEMENTAR

El cliente debe implementar **5 endpoints** en su backend real:

### Endpoints de Producción Necesarios:

1. **GET `/api/initialConfig`** ✅
   - Retorna configuración inicial (fichas y multiplicadores)
   - Se llama una sola vez al iniciar

2. **GET `/api/balance`** ✅
   - Retorna balance actual del usuario
   - Se llama al iniciar y puede consultarse en cualquier momento

3. **POST `/api/bet/place`** ✅
   - Registra una apuesta
   - Retorna betId único

4. **POST `/api/spin`** ✅
   - Ejecuta el giro con RNG
   - Retorna resultado (animal ganador, multiplicador, ganancias)

5. **POST `/api/reset-balance`** 🔧 (Opcional)
   - Solo para desarrollo/testing
   - Permite resetear el balance de un usuario

**Documentación completa** de cada endpoint en: `docs/FLUJO-ENDPOINTS.md`

---

## 📊 ESTRUCTURA RECOMENDADA DEL PAQUETE

```
spin-zodiac-entrega.zip
│
├── ruleta-zodiaco-chino/              # Proyecto completo
│   ├── src/                           # Código fuente
│   ├── docs/                          # Documentación
│   ├── mock-server.js                # Backend de desarrollo
│   ├── package.json                  # Dependencias
│   └── ... (otros archivos de configuración)
│
└── README-INSTALACION.md              # Instrucciones de instalación
```

---

## ✅ CHECKLIST ANTES DE ENTREGAR

Verificar que el paquete incluye:

- [ ] Carpeta `src/` completa con todo el código fuente
- [ ] Carpeta `docs/` con toda la documentación
- [ ] Archivo `mock-server.js` para testing local
- [ ] `package.json` y `package-lock.json`
- [ ] Archivos de configuración (angular.json, tsconfig.json, etc.)
- [ ] `README-INSTALACION.md` con instrucciones claras
- [ ] **NO incluye** `node_modules/`
- [ ] **NO incluye** carpetas de caché (`.angular/`, `www/`)

---

## 🔐 INFORMACIÓN DE SEGURIDAD

### Para el Cliente:

**⚠️ IMPORTANTE:**
1. El `mock-server.js` es **SOLO para desarrollo local**
2. **NO subir** `mock-server.js` a un servidor de producción
3. Los tokens de prueba (`test123`, `abc123`, `demo`) son **solo para testing**
4. En producción, implementar autenticación real y segura
5. Configurar HTTPS en el servidor de producción
6. Validar y sanitizar todas las entradas del usuario

---

## 📞 SOPORTE POST-ENTREGA

### Documentación Disponible:

1. **FLUJO-ENDPOINTS.md** - Guía de endpoints y flujos de la app
2. **ESTADO-ACTUAL-IMPLEMENTACION.md** - Estado completo de la implementación
3. **PLANIFICACION-BACKEND-COMUNICACION.md** - Arquitectura del sistema

### Código Bien Documentado:

- Todas las interfaces tienen comentarios JSDoc
- Métodos críticos están documentados
- Logs informativos en consola para debugging

---

## 🎉 RESUMEN

**Para entregar al cliente:**
1. Comprimir toda la carpeta (excluyendo `node_modules/` y carpetas de caché)
2. Incluir `README-INSTALACION.md` con instrucciones claras
3. Asegurarse de que `mock-server.js` esté incluido
4. Verificar que toda la documentación esté presente

**El cliente recibirá:**
- ✅ Código fuente completo y funcional
- ✅ Backend de desarrollo para testing (`mock-server.js`)
- ✅ Documentación completa del sistema
- ✅ Interfaces TypeScript bien definidas
- ✅ Instrucciones de instalación y uso
- ✅ Guía de endpoints para implementar el backend real

---

**Última actualización:** 01 de Febrero, 2026
**Versión del proyecto:** 1.0
**Estado:** ✅ Listo para entrega
