# Ruleta Zodiaco Chino — Guía de Pruebas

## Arrancar la app

Requiere Node.js instalado. Ejecutar en la carpeta `www/`:

```bash
npx serve .
```

Abrir `http://localhost:3000` en el browser.

---

## Probar la app

Las pruebas se hacen desde la consola del browser (`F12 → Console`).

### 1. Iniciar sesión

```javascript
adminLogin("admin", "ruleta2025")
```

### 2. Comandos de prueba

```javascript
// Giro con posiciones aleatorias y texto de resultado
adminSpinResult("MOROCHA")
adminSpinResult("DUPLA ESPECIAL")

// Giro con posiciones específicas y texto de resultado
adminSpinManual("7", "5", "DUPLA")

// Giro sin texto (termina sin animación de resultado)
adminSpinManual()
```

### 3. Cerrar sesión

```javascript
adminLogout()
```

---

## Notas

- La app no requiere conexión a internet.
- El indicador de conexión aparecerá en rojo — es normal, no hay servidor en esta versión de prueba.
- Los comandos no pueden ejecutarse si hay un giro en curso.
