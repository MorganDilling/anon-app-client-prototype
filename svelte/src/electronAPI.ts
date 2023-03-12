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

export declare const isDev: () => boolean;

export declare const encrypt: (
  data: string,
  publicKey: string
) => Promise<string>;

export declare const decrypt: (
  data: string,
  privateKey: string
) => Promise<string>;

export type electronAPI = {
  genData: () => Promise<ReturnType<typeof generateData>>;
  keyRecov: (recovData: RecovParams) => Promise<string>;
  isDev: () => boolean;
  encrypt: (data: string, publicKey: string) => Promise<string>;
  decrypt: (
    data: string,
    privateKey: string,
    encoding: BufferEncoding
  ) => Promise<string>;
};

// @ts-ignore export typed window.electronAPI - see preload.ts
export default window.electronAPI as electronAPI;
