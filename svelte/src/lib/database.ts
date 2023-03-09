import axios from 'axios';

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
    passwordResetHash: string,
    publicKey: string
  ) {
    const response = await axios.post(`${this.url}/v1/users/create`, {
      password,
      encryptedPrivateKey,
      passwordResetHash,
      publicKey,
    });

    console.log(response);

    if (response.status !== 201) {
      throw new Error('Error whilst registering');
    }

    return response.data;
  }

  async login(userId: number, password: string): Promise<void> {
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
      throw new Error('Invalid credentials');
    }

    const token = response.data.token;

    const userResponse = await axios.get(`${this.url}/v1/users/${userId}`, {
      headers: {
        token,
      },
    });

    if (userResponse.status !== 200) {
      throw new Error('Cannot find user');
    }

    this.authStore.model = { userId: userResponse.data.user.id, token };

    this.callOnChange();
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