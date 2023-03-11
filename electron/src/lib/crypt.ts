import crypto, { KeyObject, type KeyLike } from 'crypto';

export interface KeyPair {
  publicKey: KeyObject;
  privateKey: KeyObject;
}

export const generateKeyPair = (): KeyPair => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  return { publicKey, privateKey };
};

export const generateSymmetricKey = () =>
  crypto.generateKeySync('aes', { length: 256 });

export const generateHmacKey = () =>
  crypto.generateKeySync('hmac', { length: 4096 });

export const generateInitialisationVector = () => crypto.randomBytes(16);

export const hmac = (data: Buffer | string, key: Buffer | string) =>
  crypto.createHmac('sha512', key).update(data).digest();

export const symmetricallyEncrypt = (
  data: Buffer | string,
  key: Buffer | KeyLike,
  iv: Buffer
): Buffer => {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return encrypted;
};

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
  const keyRecoveryKey = generateSymmetricKey();
  const keyRecoveryIv = generateInitialisationVector();
  const keyRecoveryHmac = generateHmacKey().export();
  const keyRecoveryHash = hmac(keyRecoveryKey.export(), keyRecoveryHmac);

  const keypair = generateKeyPair();
  const privateKey = keypair.privateKey.export({
    format: 'pem',
    type: 'pkcs8',
  });
  const publicKey = keypair.publicKey.export({ format: 'pem', type: 'pkcs1' });
  const encryptedPrivateKey = symmetricallyEncrypt(
    privateKey,
    keyRecoveryKey,
    keyRecoveryIv
  );

  const sentToServer = {
    encryptedPrivateKey: encryptedPrivateKey.toString('base64'),
    keyRecoveryHash: keyRecoveryHash.toString('base64'),
    publicKey,
  };

  const storedForRecoveryFile = {
    keyRecoveryKey: keyRecoveryKey.export().toString('base64'),
    keyRecoveryIv: keyRecoveryIv.toString('base64'),
    keyRecoveryHmac: keyRecoveryHmac.toString('base64'),
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
