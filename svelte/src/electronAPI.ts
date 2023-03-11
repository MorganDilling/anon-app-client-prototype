export declare const generateData: () => {
  sentToServer: {
    /** Key as ciphertext, useless without {@link passwordResetKey} */
    encryptedPrivateKey: string;
    /** Used to validate password resets & to retrieve the correct key, as this should be stored alongside the key */
    passwordResetHash: string;
    /** User's Public Key */
    publicKey: string;
  };
  storedLocally: {
    privateKey: string;
  };
  storedForRecoveryFile: {
    /** password reset key, additionally used to encrypt the {@link privateKey} */
    passwordResetKey: string;
    /** password reset initialization vector; useless on its own without password reset key/cyphertext */
    passwordResetIv: string;
    /** used to derive passwordResetHash in combination with {@link passwordResetKey} */
    passwordResetHmacKey: string;
  };
};
export type RecovParams = {
  encryptedPrivateKey: string;
  passwordResetKey: string;
  passwordResetIv: string;
};
export declare const findKeyFromPassResetKeyAndEncryptedPrivateKey: ({
  encryptedPrivateKey,
  passwordResetKey,
  passwordResetIv,
}: RecovParams) => string;

export type electronAPI = {
  genData: () => Promise<ReturnType<typeof generateData>>;
  keyRecov: (recovData: RecovParams) => Promise<string>;
  isDev: () => boolean;
};

// @ts-ignore export typed window.electronAPI - see preload.ts
export default window.electronAPI as electronAPI;
