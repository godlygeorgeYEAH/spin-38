// --- AÑADE ESTA LÍNEA ---
console.log('Iniciando la generación del hash...'); 

const CryptoJS = require('crypto-js');

const MI_CONTRASENA_SECRETA = 'ruleta2025';
const MI_SAL_SECRETA = 'una-cadena-aleatoria-y-larga-para-dificultar';

const saltedPassword = MI_CONTRASENA_SECRETA + MI_SAL_SECRETA;
const hash = CryptoJS.SHA256(saltedPassword).toString(CryptoJS.enc.Hex);

console.log('Tu Sal (SALT):', MI_SAL_SECRETA);
console.log('Tu Hash final (HASH):', hash);