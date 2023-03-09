import { DatabaseClient } from './database';
import { writable } from 'svelte/store';
import electronAPI from '../electronAPI';

export const client = new DatabaseClient('http://127.0.0.1:7020');

export const authedUser = writable(client.authStore.model);

const user = localStorage.getItem('authedUser');

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

export const login = async (userId: number, password: string) => {
  await client.login(userId, password);
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
  return { responseData: data, recoveryData: '' };
};

export const logout = async () => {
  console.log('logout');

  await client.logout();
};

client.authStore.onChange((auth) => {
  console.log('authStore.onChange', auth);
  authedUser.set(client.authStore.model);
  localStorage.setItem('authedUser', JSON.stringify(client.authStore.model));
});
