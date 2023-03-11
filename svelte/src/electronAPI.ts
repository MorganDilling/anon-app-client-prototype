export declare const generateData: () => {
  sentToServer: {
    encryptedPrivateKey: string;
    keyRecoveryHash: string;
    publicKey: string;
  };
  storedLocally: {
    privateKey: string;
  };
  storedForRecoveryFile: {
    keyRecoveryKey: string;
    keyRecoveryIv: string;
    keyRecoveryHmacKey: string;
  };
};
export type RecovParams = {
  encryptedPrivateKey: string;
  keyRecoveryKey: string;
  keyRecoveryIv: string;
};
export declare const findKeyFromPassResetKeyAndEncryptedPrivateKey: ({
  encryptedPrivateKey,
  keyRecoveryKey,
  keyRecoveryIv,
}: RecovParams) => string;

export type electronAPI = {
  genData: () => Promise<ReturnType<typeof generateData>>;
  keyRecov: (recovData: RecovParams) => Promise<string>;
  isDev: () => boolean;
};

// @ts-ignore export typed window.electronAPI - see preload.ts
export default window.electronAPI as electronAPI;
