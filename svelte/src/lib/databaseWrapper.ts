import { DatabaseClient } from './database';
import { writable } from 'svelte/store';
import electronAPI from '../electronAPI';

let connectionString: string;

if (electronAPI.isDev()) {
  connectionString = 'http://127.0.0.1:31742';
  console.log('isDev true');
} else {
  connectionString = 'http://127.0.0.1:31742'; // same for now
}

export const client = new DatabaseClient(connectionString);

export const authedUser = writable(client.authStore.model);

const user = localStorage.getItem('authedUser');

(async () => {
  if (user !== null) {
    const parsed = JSON.parse(user);

    const valid = await client.verifyToken(parsed?.token);

    console.log('valid', valid);

    if (valid) {
      authedUser.set(parsed);
      client.authStore.set(parsed);
    } else {
      console.log('not valid');

      client.authStore.clear();
      authedUser.set(null);
      localStorage.setItem('authedUser', JSON.stringify(null));
      // navigate('/login', { replace: true });
    }
  }
})();

export const login = async (
  userId: number,
  password: string
): Promise<
  | { success: true; encryptedPrivateKey: string }
  | { success: false; error: string }
> => {
  const response = await client.login(userId, password);

  return response;
};

export const register = async (password: string) => {
  const generatedData = await electronAPI.genData();

  const { encryptedPrivateKey, passwordResetHash, publicKey } =
    generatedData.sentToServer;

  console.log('generatedData', generatedData);

  const recoveryData = btoa(
    JSON.stringify(generatedData.storedForRecoveryFile)
  );

  console.log(
    'recoveryDataJSON',
    JSON.stringify(generatedData.storedForRecoveryFile)
  );

  console.log('recoveryData', recoveryData);

  const data = await client.register(
    password,
    encryptedPrivateKey,
    passwordResetHash,
    publicKey.toString()
  );
  return {
    responseData: data,
    recoveryData,
    local: generatedData.storedLocally,
  };
};

export const logout = async () => {
  console.log('logout');

  await client.logout();
};

client.authStore.onChange((auth) => {
  console.log('authStore.onChange', auth);
  authedUser.set(client.authStore.model);
  localStorage.setItem('authedUser', JSON.stringify(client.authStore.model));

  if (!client.authStore.model) {
    localStorage.setItem('privateKey', 'null');
  }
});
