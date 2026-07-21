# Instrucciones de Ejecucion (Firebase-only)

Este proyecto corre sin PostgreSQL.

## Requisitos

- Node.js 20 o 22
- npm 10+
- Proyecto Firebase activo (`nexum-ba05a`)
- Reglas de Firestore y Storage desplegadas

## 1) Configurar Backend (opcional)

El backend existe para utilidades de autenticacion/perfil con Firebase Admin. No usa PostgreSQL.

Crea `backend/.env` con:

```env
PORT=3000
FIREBASE_SERVICE_ACCOUNT_PATH=backend/keys/firebase-service-account.json
FIREBASE_DATABASE_URL=https://nexum-ba05a-default-rtdb.firebaseio.com
```

Guarda tu llave en:

- `backend/keys/firebase-service-account.json`

## 2) Configurar Mobile (requerido)

Crea `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=
```

## 3) Instalar dependencias

```bash
cd backend
npm install

cd ../mobile
npm install
```

## 4) Ejecutar

Terminal 1 (backend opcional):

```bash
cd backend
npm run dev
```

Terminal 2 (mobile):

```bash
cd mobile
npm start
```

## 5) Validaciones rapidas

```bash
cd mobile
npm run check:all

cd ../backend
npm run lint
npm test
```

## 6) Deploy de reglas Firebase

```bash
npx --yes firebase-tools@13.32.0 deploy --only firestore:rules,storage --project nexum-ba05a
```

## Notas

- La app usa Firebase Auth + Firestore.
- Las imagenes se manejan por links persistidos (sin depender de PostgreSQL).
- No pegues credenciales en chats o logs. Rotar llaves si se exponen.
