# Nexum App

Nexum App corre con Firebase y Expo. No usa una base de datos relacional.

## Qué necesitas

- Node.js 20 o 22
- npm
- Cuenta y proyecto en Firebase
- Expo Go en el celular si quieres probar en dispositivo

## Qué hace cada carpeta

- `mobile/`: app principal en Expo
- `backend/`: backend ligero con Firebase Admin para autenticación y perfil

## Antes de correr

### 1. Crear el archivo de backend

Crea `backend/.env` con esto:

```env
PORT=3000
FIREBASE_SERVICE_ACCOUNT_PATH=backend/keys/firebase-service-account.json
FIREBASE_DATABASE_URL=https://nexum-ba05a-default-rtdb.firebaseio.com
```

### 2. Guardar la service account

Descarga la llave JSON de Firebase Admin y guárdala en:

```text
backend/keys/firebase-service-account.json
```

No subas ese archivo a Git.

### 3. Crear el archivo de mobile

Crea `mobile/.env` con esto:

```env
EXPO_PUBLIC_API_URL=
```

## Instalar dependencias

En PowerShell o terminal:

```powershell
Set-Location C:\Users\erick\Desktop\nexum-app\backend
npm install

Set-Location ..\mobile
npm install
```

## Cómo correr el programa

### Opción recomendada: correr solo la app móvil

Si solo quieres usar la app, esto basta:

```powershell
Set-Location C:\Users\erick\Desktop\nexum-app\mobile
npm start
```

Después:
- presiona `w` para abrir web, o
- escanea el QR con Expo Go en el celular

### Opción completa: backend + mobile

Si también quieres levantar el backend ligero:

Terminal 1:

```powershell
Set-Location C:\Users\erick\Desktop\nexum-app\backend
npm run dev
```

Terminal 2:

```powershell
Set-Location C:\Users\erick\Desktop\nexum-app\mobile
npm start
```

## Orden correcto para probar que todo funciona

1. Inicia Firebase y confirma que las reglas ya estén desplegadas.
2. Arranca `mobile` con `npm start`.
3. Haz login o registro.
4. Abre la lista de inmuebles.
5. Abre el detalle de un inmueble.
6. Publica o edita un inmueble si tu cuenta es arrendador.
7. Agrega y quita un favorito.

## Comandos de verificación

### Mobile

```powershell
Set-Location C:\Users\erick\Desktop\nexum-app\mobile
npm run check:all
```

### Backend

```powershell
Set-Location C:\Users\erick\Desktop\nexum-app\backend
npm run lint
npm test
```

## Si algo falla

### No abre la app
- Verifica que `npm install` ya se haya ejecutado en `mobile`.
- Verifica que Expo esté corriendo con `npm start` dentro de `mobile`.

### Error de autenticación
- Verifica que el proyecto de Firebase en `mobile/src/services/firebase.ts` sea el correcto.
- Cierra sesión y vuelve a entrar.

### Error al guardar o quitar favoritos
- Verifica que las reglas de Firestore estén desplegadas.
- Verifica que el usuario esté autenticado.

### Error con imágenes
- Usa links `https://...` válidos.
- Si la imagen no existe, la app mostrará el estado local sin romperse.

## Resumen corto

Si quieres correrlo rápido, usa esto:

```powershell
Set-Location C:\Users\erick\Desktop\nexum-app\mobile
npm start
```

Si además quieres el backend:

```powershell
Set-Location C:\Users\erick\Desktop\nexum-app\backend
npm run dev
```
