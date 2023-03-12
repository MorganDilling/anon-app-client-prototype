import axios, { AxiosError } from 'axios';
import electronAPI from '../electronAPI';

const urlRegex =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/;

export interface AuthedUser {
  userId: number;
  token: string;
}

export interface AuthStore {
  model: AuthedUser | null;
  onChange: (callback: (auth: AuthedUser | null) => void) => void;
  clear: () => void;
  set: (auth: AuthedUser | null) => void;
}

const verifyUrl = async (url: string) => {
  if (!urlRegex.test(url)) {
    throw new Error('Invalid URL');
  }

  try {
    const response = await axios.get(url);
    return response.status === 200 && response.data['is-alive'] == true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export class DatabaseClient {
  url: string;
  authStore: AuthStore;
  private onChangeCallback: ((auth: AuthedUser | null) => void)[];

  constructor(url: string) {
    if (!verifyUrl(url)) {
      throw new Error('Invalid URL');
    }
    this.url = url;
    this.onChangeCallback = [];
    this.authStore = {
      model: null,
      onChange: (callback: (auth: AuthedUser | null) => void) => {
        this.onChangeCallback.push(callback);
      },
      clear: () => {
        this.authStore.model = null;
      },
      set: (auth: AuthedUser | null) => {
        this.authStore.model = auth;
      },
    };
  }

  private callOnChange() {
    this.onChangeCallback.forEach((callback) => {
      callback(this.authStore.model);
    });
  }

  async register(
    password: string,
    encryptedPrivateKey: string,
    keyRecoveryHash: string,
    publicKey: string
  ) {
    try {
      const response = await axios.post(`${this.url}/v1/users/create`, {
        password,
        encryptedPrivateKey,
        keyRecoveryHash,
        publicKey,
      });

      console.log(response);

      if (response.status !== 201) {
        return 'Error whilst registering';
      }

      return response.data;
    } catch (e) {
      console.error(e);
      return 'Error whilst registering: ' + e;
    }
  }

  async resetPassword(
    userId: number,
    newPassword: string,
    keyRecoveryKey: string,
    keyRecoveryIv: string
  ): Promise<{ success: true } | { success: false; message: string }> {
    try {
      const responseA = await axios.post(
        `${this.url}/v1/password/request-reset-a`,
        {
          userId,
        }
      );

      console.log(responseA);

      if (responseA.status !== 200) {
        return { success: false, message: 'Error whilst resetting password' };
      }

      const privateKey = await electronAPI.keyRecov({
        encryptedPrivateKey: responseA.data.encryptedPrivateKey,
        keyRecoveryKey,
        keyRecoveryIv,
      });

      console.log(privateKey);

      console.log(responseA.data.message);

      const decryptedMessage = await electronAPI.decrypt(
        responseA.data.message,
        privateKey,
        'base64'
      );

      console.log('decrypted message', decryptedMessage);

      const responseB = await axios.post(
        `${this.url}/v1/password/request-reset-b`,
        {
          userId,
          decryptedMessage,
          newPassword,
        }
      );

      console.log(responseB);

      if (responseB.status !== 200) {
        return { success: false, message: 'Error whilst resetting password' };
      }

      return { success: true };
    } catch (e) {
      console.error(e);
      return {
        success: false,
        message: 'Error whilst resetting password: ' + e,
      };
    }
  }

  async login(
    userId: number,
    password: string
  ): Promise<
    | { success: true; encryptedPrivateKey: string }
    | { success: false; error: string }
  > {
    try {
      const response = await axios.post(`${this.url}/v1/auth/login`, {
        userId,
        password,
      });

      console.log(response.data);
      console.log(response.status);

      if (
        response.status !== 200 ||
        (response.status === 200 && response.data.access === false)
      ) {
        return { success: false, error: 'Invalid credentials' };
      }

      const token = response.data.token;

      const userResponse = await axios.get(`${this.url}/v1/users/${userId}`, {
        headers: {
          token,
        },
      });

      if (userResponse.status !== 200) {
        return { success: false, error: 'Cannot find user' };
      }

      this.authStore.model = { userId: userResponse.data.user.id, token };

      this.callOnChange();

      return {
        success: true,
        encryptedPrivateKey: response.data.encryptedPrivateKey,
      };
    } catch (e: unknown) {
      console.log(e);

      switch ((e as AxiosError).response?.status) {
        case 404: {
          return { success: false, error: `Could not find user: ${userId}` };
          break;
        }
        case 401: {
          return {
            success: false,
            error: `Incorrect credentials for user: ${userId}`,
          };
          break;
        }
        default: {
          return { success: false, error: String(e) };
        }
      }
    }
  }

  async logout(): Promise<void> {
    if (this.authStore.model === null) {
      return;
    }

    const response = await axios.post(
      `${this.url}/v1/auth/logout`,
      {
        token: this.authStore.model.token,
      },
      {
        headers: {
          token: this.authStore.model.token,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error('Error whilst logging out');
    }

    this.authStore.clear();
    this.callOnChange();
  }

  async verifyToken(token?: string): Promise<boolean> {
    if (this.authStore.model === null && token === undefined) {
      return false;
    }

    const checkToken = this.authStore.model?.token ?? token;

    try {
      const response = await axios.post(
        `${this.url}/v1/auth/verify-token`,
        {
          token: checkToken,
        },
        {
          headers: {
            token: checkToken,
          },
        }
      );

      if (response.status !== 200) {
        return false;
      }

      return response.data.access;
    } catch (e) {
      return false;
    }
  }
}
