export declare const generateData: () => {
  sentToServer: {
    /** Key as ciphertext, useless without {@link passwordResetKey} */
    privateKeyEncrypted: string;
    /** Used to validate password resets & to retrieve the correct key, as this should be stored alongside the key */
    passwordResetHash: string;
    /** User's Public Key */
    publicKey: string;
  };
  storedForAppLocally: {
    privateKey: string;
  };
  storedForResetOnUSB: {
    /** password reset key, additionally used to encrypt the {@link privateKey} */
    passwordResetKey: string;
    /** password reset initialization vector; useless on its own without password reset key/cyphertext */
    passwordResetIv: string;
    /** used to derive passwordResetHash in combination with {@link passwordResetKey} */
    passwordResetHmacKey: string;
  };
};
type RecovParams = {
  privateKeyEncrypted: string;
  passwordResetKey: string;
  passwordResetIv: string;
}
export declare const findKeyFromPassResetKeyAndEncryptedPrivateKey: ({ privateKeyEncrypted, passwordResetKey, passwordResetIv }: RecovParams) => string;

export type electronAPI = {
  genKey: () => Promise<ReturnType<typeof generateData>>,
  keyRecov: (recovData: RecovParams) => Promise<string>
}

// @ts-ignore export typed window.electronAPI - see preload.ts
export default window.electronAPI as electronAPI