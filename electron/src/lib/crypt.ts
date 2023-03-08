import crypto, { KeyObject, type KeyLike } from 'crypto';

export interface KeyPair {
  publicKey: KeyObject;
  privateKey: KeyObject;
}

// RSA Key Generation
export const generateKeyPair = (): KeyPair => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  return { publicKey, privateKey };
};

// AES Key Generation
export const generateSymmetricKey = () =>
  crypto.generateKeySync('aes', { length: 256 });

// HMAC Key Generation
export const generateHmacKey = () =>
  crypto.generateKeySync('hmac', { length: 4096 });

// Generate a random 16-byte initialization vector
export const generateInitialisationVector = () => crypto.randomBytes(16);

// Hmac data using SHA-512
export const hmac = (data: Buffer | string, key: Buffer | string) =>
  crypto.createHmac('sha512', key).update(data).digest();

// Symmetric encryption using AES-256-CBC
export const symmetricallyEncrypt = (
  data: Buffer | string,
  key: Buffer | KeyLike,
  iv: Buffer
): Buffer => {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return encrypted;
};

// Symmetric decryption using AES-256-CBC
export const symmetricallyDecrypt = (
  data: Buffer,
  key: Buffer | KeyLike,
  iv: Buffer
): Buffer => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted;
};

export const generateCryptData = () => {
  const passwordResetKey = generateSymmetricKey(); // stay on device
  const passwordResetIv = generateInitialisationVector(); // stay on device
  const passwordResetHmac = generateHmacKey().export(); // stored with pswd reset key
  const passwordResetHash = hmac(passwordResetKey.export(), passwordResetHmac); // sent to server on pswd reset and registration

  const keypair = generateKeyPair();
  const privateKey = keypair.privateKey.export({
    format: 'pem',
    type: 'pkcs8',
  }); // stored locally
  const publicKey = keypair.publicKey.export({ format: 'pem', type: 'pkcs1' }); // sent to server
  const privateKeyEncrypted = symmetricallyEncrypt(
    privateKey,
    passwordResetKey,
    passwordResetIv
  ); // sent to server alongside password reset hash

  const sentToServer = {
    encryptedPrivateKey: privateKeyEncrypted.toString('base64'),

    // Used to validate password resets & to retrieve the correct key, as this should be stored alongside the key
    passwordResetHash: passwordResetHash.toString('base64'),

    publicKey,
  };

  const storedForRecoveryFile = {
    // password reset key
    passwordResetKey: passwordResetKey.export().toString('base64'),
    // password reset initialisation vector
    passwordResetIv: passwordResetIv.toString('base64'),
    // used to derive password reset hash
    passwordResetHmac: passwordResetHmac.toString('base64'),
  };

  const storedLocally = {
    privateKey,
  };

  return {
    sentToServer,
    storedForRecoveryFile,
    storedLocally,
  };
};

export const findKeyFromPassResetKeyAndEncryptedPrivateKey = ({
  encryptedPrivateKey,
  passwordResetKey,
  passwordResetIv,
}: {
  encryptedPrivateKey: string;
  passwordResetKey: string;
  passwordResetIv: string;
}) => {
  const encryptedPrivateKeyAsBuffer = Buffer.from(
    encryptedPrivateKey,
    'base64'
  );
  const passwordResetKeyAsBuffer = Buffer.from(passwordResetKey, 'base64');
  const ivAsBuffer = Buffer.from(passwordResetIv, 'base64');
  return symmetricallyDecrypt(
    encryptedPrivateKeyAsBuffer,
    passwordResetKeyAsBuffer,
    ivAsBuffer
  ).toString('utf-8');
};
