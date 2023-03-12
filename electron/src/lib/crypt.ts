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

export const asymmetricallyEncrypt = (
  data: Buffer | string,
  publicKey: KeyObject
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data));
      resolve(encrypted.toString('base64'));
    } catch (e) {
      reject(e);
    }
  });
};

export const asymmetricallyDecrypt = (
  data: string,
  privateKey: KeyObject,
  encoding: BufferEncoding
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const decrypted = crypto.privateDecrypt(
        privateKey,
        Buffer.from(data, 'base64')
      );
      resolve(decrypted.toString(encoding));
    } catch (e) {
      reject(e);
    }
  });
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
  keyRecoveryKey,
  keyRecoveryIv,
}: {
  encryptedPrivateKey: string;
  keyRecoveryKey: string;
  keyRecoveryIv: string;
}) => {
  const encryptedPrivateKeyAsBuffer = Buffer.from(
    encryptedPrivateKey,
    'base64'
  );
  const passwordResetKeyAsBuffer = Buffer.from(keyRecoveryKey, 'base64');
  const ivAsBuffer = Buffer.from(keyRecoveryIv, 'base64');
  return symmetricallyDecrypt(
    encryptedPrivateKeyAsBuffer,
    passwordResetKeyAsBuffer,
    ivAsBuffer
  ).toString('utf-8');
};
