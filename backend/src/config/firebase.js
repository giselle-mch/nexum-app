const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

const getCredentialFromServiceAccountPath = () => {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

  if (!serviceAccountPath) {
    return null
  }

  try {
    const absolutePath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(process.cwd(), serviceAccountPath)

    const content = fs.readFileSync(absolutePath, 'utf8')
    return admin.credential.cert(JSON.parse(content))
  } catch (error) {
    console.error('FIREBASE_SERVICE_ACCOUNT_PATH invalido:', error)
    throw new Error('Credenciales Firebase invalidas (path)', { cause: error })
  }
}

const getCredentialFromBase64 = () => {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64

  if (!encoded) {
    return null
  }

  try {
    const json = Buffer.from(encoded, 'base64').toString('utf8')
    return admin.credential.cert(JSON.parse(json))
  } catch (error) {
    console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 invalido:', error)
    throw new Error('Credenciales Firebase invalidas (base64)', { cause: error })
  }
}

const getCredentials = () => {
  return getCredentialFromServiceAccountPath() || getCredentialFromBase64()
}

if (!admin.apps.length) {
  const credential = getCredentials()
  const databaseURL = process.env.FIREBASE_DATABASE_URL

  if (credential) {
    admin.initializeApp({
      credential,
      ...(databaseURL ? { databaseURL } : {}),
    })
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...(databaseURL ? { databaseURL } : {}),
    })
  }
}

const db = admin.firestore()

module.exports = {
  admin,
  db,
}
