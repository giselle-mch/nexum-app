# Guía de Completación de Migración Firebase

## Pasos Finales para Completar la Migración

### 1. Configurar Firebase Service Account (Backend)

El backend necesita acceder a Firestore. Para esto:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto `nexum-ba05a`
3. Ve a Project Settings > Service Accounts
4. Haz clic en "Generate new private key"
5. Se descargará un archivo JSON
6. Guarda ese archivo localmente en:
  backend/keys/firebase-service-account.json
7. Actualiza tu backend/.env con:
  FIREBASE_SERVICE_ACCOUNT_PATH=backend/keys/firebase-service-account.json
8. Solo si necesitas compatibilidad legacy, usa base64 en FIREBASE_SERVICE_ACCOUNT_BASE64.

### 2. Instalar Dependencias

**Backend:**
```bash
cd backend
npm install
```

**Mobile:**
```bash
cd mobile
npm install
```

### 3. Verificar Configuración

**Backend:**
- Verifica que `.env` tenga las variables Firebase configuradas
- Prueba que el servidor inicia: `npm start`
- Debería mostrar: `Servidor escuchando en puerto 3000`

**Mobile:**
- Verifica que `firebase.ts` tiene la configuración correcta
- Prueba que compila: `npm run web` (o `npm start` para Expo)

### 4. Flujo de Autenticación

#### Registro:
1. Usuario ingresa email, contraseña, nombre, teléfono (opcional), rol
2. Firebase Auth crea la cuenta vía `createUserWithEmailAndPassword`
3. Se obtiene el ID token de Firebase
4. Se llama a `/api/auth/register` con el UID para crear el documento en Firestore
5. Se guardan token y usuario en AsyncStorage
6. Usuario es redirigido a la pantalla principal

#### Login:
1. Usuario ingresa email y contraseña
2. Firebase Auth autentica vía `signInWithEmailAndPassword`
3. Se obtiene el ID token
4. Se llama a `/api/auth/user-profile` para obtener datos del usuario desde Firestore
5. Se guardan token y usuario en AsyncStorage
6. Usuario es redirigido a la pantalla principal

#### Recuperación de Contraseña:
1. Usuario ingresa su email
2. Firebase envía email de reseteo vía `sendPasswordResetEmail`
3. Usuario hace clic en el link del email y restablece su contraseña
4. Vuelve a intentar login con la nueva contraseña

### 5. Estructura de Firestore

#### Colecciones:
- **users**: Document ID = Firebase UID
  ```json
  {
    "id": 1,
    "nombre": "Juan",
    "email": "juan@example.com",
    "telefono": "+34123456789",
    "rol": "usuario",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
  ```

- **properties**: Document ID = numeric string (e.g., "1", "2")
  ```json
  {
    "id": 1,
    "titulo": "Apartamento céntrico",
    "descripcion": "...",
    "precio": 500,
    "ubicacion": "Madrid",
    "latitud": 40.4168,
    "longitud": -3.7038,
    "imagenes": ["https://example.com/img1.jpg"],
    "propietarioId": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
  ```

- **conversations**: Document ID = numeric string
  ```json
  {
    "id": 1,
    "propertyId": 1,
    "clienteId": 5,
    "participantes": [5, 3],
    "ultimoMensaje": "¿Disponible para visita?",
    "ultimoMensajeEn": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "messages": [
      {
        "id": 1,
        "remitente": 5,
        "mensaje": "Hola, ¿está disponible?",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ]
  }
  ```

### 6. Variables de Entorno Necesarias

**Backend (.env):**
```
PORT=3000
FIREBASE_API_KEY=AIzaSyAX_MFVf0s0UOX5HCpV1lg4ZJGSiLP1pjc
FIREBASE_SERVICE_ACCOUNT_PATH=backend/keys/firebase-service-account.json
# Optional legacy fallback
FIREBASE_SERVICE_ACCOUNT_BASE64=
```

**Mobile (.env o Constants):**
- Las variables de Firebase están hardcodeadas en `mobile/src/services/firebase.ts`
- Para cambiarlas, actualiza el objeto `firebaseConfig`

### 7. Seguridad de Firestore

Las reglas de seguridad ya están configuradas en `backend/firestore.rules`:
- Usuarios pueden leer/escribir solo su documento
- Propiedades: lectura pública, escritura solo del propietario
- Conversaciones: acceso solo para participantes
- Favoritos y pagos: acceso solo del propietario

### 8. Prueba Rápida

1. Inicia el backend: `npm start`
2. Inicia la mobile app
3. Registra un nuevo usuario
4. Login con el usuario creado
5. Verifica que los datos aparecen en Firestore Console

### Troubleshooting

**Error: "FIREBASE_SERVICE_ACCOUNT_PATH invalido"**
- Verifica que el archivo exista en backend/keys/firebase-service-account.json
- Verifica permisos de lectura del archivo

**Error: "FIREBASE_SERVICE_ACCOUNT_BASE64 invalido"**
- Solo aplica si usas fallback legacy por base64
- Verifica formato base64 sin cortes ni caracteres extra

**Error: "Permiso denegado" en Firestore**
- Verifica que el usuario está autenticado (authMiddleware)
- Revisa las reglas de seguridad en `backend/firestore.rules`

**Error: "No se puede conectar a Firebase"**
- Verifica que `FIREBASE_API_KEY` es correcto
- Asegúrate que Firebase Auth está habilitado en la consola

### Rotación de credenciales recomendada

Si una clave privada fue expuesta:
1. Revoca la clave vieja en Google Cloud IAM para la service account usada.
2. Genera una nueva clave JSON.
3. Reemplaza el archivo local en backend/keys/firebase-service-account.json.
4. Reinicia el backend.

**Error en mobile: "Cannot find module 'firebase'"**
- Corre `npm install` en el directorio mobile
- Limpia la caché: `npm cache clean --force`
