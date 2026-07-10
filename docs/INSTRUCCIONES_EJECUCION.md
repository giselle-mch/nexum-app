# Instrucciones para ejecutar NEXUM

Esta guia resume que archivos locales se necesitan, que se debe subir a Git y como arrancar backend y app movil sin errores de conexion.

## 1. Archivos locales que deben existir

Estos archivos son necesarios para correr el proyecto en tu computadora, pero no deben subirse a Git porque tienen datos locales o secretos.

### Backend

Crear este archivo:

```text
backend/.env
```

Contenido ejemplo:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexum
DB_USER=postgres
DB_PASSWORD=*****
JWT_SECRET=*****
```

Si falta `DB_PASSWORD`, el backend puede fallar con:

```text
client password must be a string
```

### Mobile

Crear este archivo:

```text
mobile/.env
```

Contenido ejemplo:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

La IP debe ser la que muestra Expo en la terminal. Por ejemplo, si Expo muestra:

```text
Metro waiting on exp://192.168.100.27:8081
```

Entonces `mobile/.env` debe ser:

```env
EXPO_PUBLIC_API_URL=http://192.168.100.27:3000
```

## 2. Archivos que si se suben a Git

Estos si deben estar en el repositorio:

```text
backend/.env.example
mobile/.env.example
backend/src/config/env.js
backend/server.js
backend/src/config/database.js
mobile/src/services/api.ts
mobile/src/components/maps/
mobile/src/screens/user/MapScreen.tsx
mobile/src/screens/user/LocationPickerScreen.tsx
mobile/tsconfig.json
mobile/package.json
mobile/package-lock.json
```

Los `.env.example` solo son plantillas. No deben tener contrasenas reales.

## 3. Archivos que no se suben a Git

No subir:

```text
backend/.env
mobile/.env
node_modules/
mobile/node_modules/
backend/node_modules/
dist/
dist-check/
```

## 4. Como arrancar el backend

Desde la carpeta del backend:

```powershell
cd backend
npm install
npm run dev
```

Debe salir algo como:

```text
Conectado a PostgreSQL
Servidor Nexum corriendo en puerto 3000
```

Para probarlo:

```text
http://localhost:3000/health
```

Debe responder:

```json
{"status":"ok"}
```

## 5. Como arrancar la app movil

Desde la carpeta mobile:

```powershell
cd mobile
npm install
npx expo start -c
```

Usar `-c` limpia la cache de Expo. Es importante cuando cambiaste `.env` o la IP del backend.

## 6. Error de 10.0.2.2

Si la app dice:

```text
No se pudo conectar al backend (http://10.0.2.2:3000)
```

Significa que no esta leyendo `mobile/.env` o que Expo tiene cache vieja.

Solucion:

1. Revisar que exista `mobile/.env`.
2. Confirmar que tenga la IP correcta:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

3. Reiniciar Expo:

```powershell
npx expo start -c
```

4. Cerrar Expo Go completamente en el celular y volver a escanear el QR.

## 7. Error de react-native-maps en web

Si al abrir web sale un error parecido a:

```text
Importing native-only module "react-native/Libraries/Utilities/codegenNativeCommands" on web
```

Significa que una pantalla web esta importando directamente `react-native-maps`.

La solucion correcta es usar componentes separados:

```text
PropertyMap.web.tsx
PropertyMap.native.tsx
LocationPickerMap.web.tsx
LocationPickerMap.native.tsx
```

En web se usa Leaflet y en Android/iOS se usa `react-native-maps`.

## 8. Antes de hacer push

Revisar estado:

```powershell
git status
```

Agregar solo lo que pertenece al cambio:

```powershell
git add archivo1 archivo2
git commit -m "Mensaje claro del cambio"
git push
```

No usar `git add .` si hay archivos modificados que no sabes de donde salieron.

## 9. Checklist rapido

- Backend tiene `backend/.env`.
- Mobile tiene `mobile/.env`.
- La IP de `mobile/.env` coincide con la IP que muestra Expo.
- PostgreSQL esta encendido.
- Backend responde en `/health`.
- Expo se reinicio con `npx expo start -c`.
- No se suben `.env` reales a Git.
