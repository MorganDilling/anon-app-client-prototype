<script lang="ts">
  interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
  }

  import {
    authedUser,
    login,
    logout,
    resetPassword as resetPasswordFunc,
  } from '@lib/databaseWrapper';
  import { fly } from 'svelte/transition';
  import { linear } from 'svelte/easing';

  import electronAPI, { type RecovParams } from '../../electronAPI';

  import blob from '@lib/blob';

  import { Upload } from 'svelte-bootstrap-icons';

  import padlock from '@lib/assets/padlock.svg';
  import { goto } from '$app/navigation';

  let step = 0;

  let passwordResetNotice: string;

  let file: File | undefined;
  let fileContent: string;

  let resetFile: File | undefined;
  let resetFileContent: string;

  let debounce = false;

  let userId: string;
  let password: string;

  let resetUserId: string;
  let resetPassword: string;
  let resetConfirmPassword: string;

  let idValid = true;
  let pswValid = true;

  let resetIdValid = true;
  let resetPswValid = true;

  let errorMessage: string | undefined;
  let resetErrorMessage: string | undefined;

  const forward = () => {
    step++;
  };

  const backward = () => {
    step--;
  };

  const getFileData = (
    event: Event
  ): Promise<{ content: string; file: File }> => {
    return new Promise((resolve, reject) => {
      const fileInput = event.target as HTMLInputElement;

      if (!fileInput.files || fileInput.files.length === 0) {
        reject('No file selected');
        return;
      }

      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const content = reader.result as string;
        resolve({ content, file });
      };

      reader.onerror = () => {
        reject(reader.error);
      };

      reader.readAsText(file);
    });
  };

  const resetForm = (e: Event) => {
    const target = e.target as HTMLFormElement;

    target.reset();
  };

  const validateInputs = ():
    | { valid: true }
    | { valid: false; error: string } => {
    if (!resetPassword || resetPassword === '') {
      return { valid: false, error: 'Password must not be empty.' };
    }
    if (resetPassword.length < 12)
      return {
        valid: false,
        error: 'Password must be at least 12 characters long.',
      };

    if (resetPassword === resetPassword.toLowerCase())
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter.',
      };

    if (resetPassword === resetPassword.toUpperCase())
      return {
        valid: false,
        error: 'Password must contain at least one lowercase letter.',
      };

    if (!resetPassword.match(/[0-9]+/giu))
      return {
        valid: false,
        error: 'Password must contain at least one number.',
      };

    if (resetPassword !== resetConfirmPassword) {
      return { valid: false, error: 'Passwords do not match.' };
    }

    return { valid: true };
  };

  const ResetPassword = async (): Promise<void> => {
    if (!resetFile) {
      resetErrorMessage = 'Please upload your recovery data file';
      debounce = false;
      return;
    }

    const valid = validateInputs();

    pswValid = valid.valid;

    if (!valid.valid) {
      resetErrorMessage = valid.error;
      debounce = false;
      return;
    }

    const { keyRecoveryKey, keyRecoveryIv } = JSON.parse(
      atob(resetFileContent)
    );

    const response = await resetPasswordFunc(
      Number(resetUserId),
      resetPassword,
      keyRecoveryKey,
      keyRecoveryIv
    );

    if (response.success) {
      passwordResetNotice = 'Password reset successfully';
      forward();
    } else {
      resetErrorMessage = response.message;
    }
  };

  const Login = async (): Promise<void> => {
    if (debounce) return;
    debounce = true;

    if (!file) {
      errorMessage = 'Please upload your recovery data file';
      debounce = false;
      return;
    }

    const response = await login(Number(userId), password);

    if (response.success) {
      const fileContentDecodedObject = JSON.parse(atob(fileContent));
      try {
        const privateKey = await electronAPI.keyRecov({
          encryptedPrivateKey: response.encryptedPrivateKey,
          keyRecoveryKey: fileContentDecodedObject.keyRecoveryKey,
          keyRecoveryIv: fileContentDecodedObject.keyRecoveryIv,
        });
        if (
          privateKey &&
          privateKey.startsWith('-----BEGIN PRIVATE KEY-----')
        ) {
          localStorage.setItem('privateKey', privateKey);
        }
      } catch (e) {
        console.error(e);
        errorMessage = 'Invalid recovery data file';
        debounce = false;
        logout();
        return;
      }
    }

    if (response.success) {
      goto('/app');
    } else {
      errorMessage = response.error;
    }

    debounce = false;
  };
</script>

<div class="container">
  <div class="filler-container">
    <img class="centered" width="30%" alt="Padlock" src={padlock} />
    <p
      class="centered"
      style="color: #f2f2f2; font-size:30px; width: 80%; text-align:center; overflow:hidden; max-height: 200px"
    >
      Message securely & privately with end-to-end encryption, completely
      anonymously.
    </p>
  </div>
  <div class="content-container">
    {#if step === 0}
      <div
        class="login-container"
        in:fly={{ duration: 150, easing: linear, x: 25, delay: 75 }}
        out:fly={{ duration: 150, easing: linear, x: -25 }}
      >
        <header style="margin-bottom: 15px;">
          <h1 style="font-size: 50px; font-weight:500; margin-bottom: 10px">
            Login
          </h1>
          <div class="line" />
        </header>
        <form on:submit|preventDefault={resetForm}>
          {#if errorMessage}
            <p class="notice" style="color: #ff0000">
              {errorMessage}
            </p>
          {/if}
          <input
            class={idValid ? '' : 'error'}
            type="text"
            inputmode="numeric"
            placeholder="User ID"
            on:keypress={(e) => {
              if (isNaN(Number(e.key))) e.preventDefault();
            }}
            bind:value={userId}
          />
          <input
            class={pswValid ? '' : 'error'}
            type="password"
            placeholder="Password"
            bind:value={password}
          />
          <p class="notice">
            <a
              href="/login"
              on:click={() => {
                forward();
              }}>Forgot your password?</a
            >
          </p>

          {#if file}
            <p style="display:flex;justify-content:center;align-items:center;">
              {file?.name}
            </p>
          {/if}

          <button
            style="display:flex;justify-content:center;align-items:center;"
            type="button"
            on:click={() => {
              const fileInput = document.getElementById('recovery_data');
              fileInput?.click();
            }}
            ><Upload style="margin-right:5px" />Upload recovery data file</button
          >
          <input
            style="display:none;"
            id="recovery_data"
            type="file"
            accept=".txt"
            on:change={async (e) => {
              const content = await getFileData(e);

              if (content) {
                file = content.file;
                fileContent = content.content;
              }
            }}
          />

          <input
            class={file !== undefined ? '' : 'disabled'}
            type="submit"
            on:click={Login}
            value="Log In →"
          />
          <p class="notice">
            Don't have an account yet? <a href="/register">Register →</a>
          </p>
        </form>
      </div>
    {:else if step === 1}
      <div
        class="login-container"
        in:fly={{ duration: 150, easing: linear, x: 25, delay: 75 }}
        out:fly={{ duration: 150, easing: linear, x: -25 }}
      >
        <header style="margin-bottom: 15px;">
          <h1 style="font-size: 50px; font-weight:500; margin-bottom: 10px">
            Reset password
          </h1>
          <div class="line" />
        </header>
        <p class="important">
          Enter your user identification number, the password you would like to
          reset to and your recovery data file.
        </p>
        <form on:submit|preventDefault={resetForm}>
          {#if resetErrorMessage}
            <p class="notice" style="color: #ff0000">
              {resetErrorMessage}
            </p>
          {/if}
          <input
            class={idValid ? '' : 'error'}
            type="text"
            inputmode="numeric"
            placeholder="User ID"
            on:keypress={(e) => {
              if (isNaN(Number(e.key))) e.preventDefault();
            }}
            bind:value={resetUserId}
          />
          <input
            class={pswValid ? '' : 'error'}
            type="password"
            placeholder="New Password"
            bind:value={resetPassword}
          />
          <input
            class={pswValid ? '' : 'error'}
            type="password"
            placeholder="Confirm New Password"
            bind:value={resetConfirmPassword}
          />

          {#if resetFile}
            <p style="display:flex;justify-content:center;align-items:center;">
              {resetFile?.name}
            </p>
          {/if}

          <button
            style="display:flex;justify-content:center;align-items:center;"
            type="button"
            on:click={() => {
              const fileInput = document.getElementById('recovery_data');
              fileInput?.click();
            }}
            ><Upload style="margin-right:5px" />Upload recovery data file</button
          >
          <input
            style="display:none;"
            id="recovery_data"
            type="file"
            accept=".txt"
            on:change={async (e) => {
              const content = await getFileData(e);

              if (content) {
                resetFile = content.file;
                resetFileContent = content.content;
              }
            }}
          />

          <input
            class={resetFile !== undefined ? '' : 'disabled'}
            type="submit"
            on:click={ResetPassword}
            value="Reset →"
          />
          <p class="notice">
            Remember your login details? <a
              href="/login"
              on:click={() => {
                backward();
              }}>Go back</a
            >
          </p>
        </form>
      </div>
    {:else if step === 2}
      <div
        class="login-container"
        in:fly={{ duration: 150, easing: linear, x: 25, delay: 75 }}
        out:fly={{ duration: 150, easing: linear, x: -25 }}
      >
        <header style="margin-bottom: 15px;">
          <h1 style="font-size: 50px; font-weight:500; margin-bottom: 10px">
            Reset password
          </h1>
          <div class="line" />
        </header>
        <p class="important">
          {passwordResetNotice}
        </p>
        <button
          on:click={() => {
            step = 0;
          }}>Continue to login →</button
        >
      </div>
    {/if}
  </div>
  {#if debounce === true}
    <div class="loading">Loading...</div>
  {/if}
</div>

<style lang="scss">
  @use '../../styles/colours.scss' as colours;

  .loading {
    position: absolute;
    z-index: 100;
    right: 10px;
    bottom: 10px;
  }

  .error {
    box-shadow: 0px 0px 10px 0px rgba(255, 0, 0, 0.4) !important;
  }

  .disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
  }

  .notice {
    margin-top: 0px;
    text-align: center;
    font-style: italic;
    font-weight: 200;
    color: #828282;
  }

  .important {
    margin-top: 0px;
    text-align: center;
    font-weight: 500;
    color: #828282;
  }

  input {
    margin-bottom: 15px;
  }

  input[type='password'] {
    font-style: italic;

    border-radius: 15px;
    width: 100%;
    height: 50px;
    border: 2px solid #b3b3b3;
    background-color: #e6e6e6;
    padding: 0px 10px;
    outline: none;
    font-size: 18px;
    transition: border 0.3s;
  }
  input[type='password']::placeholder {
    font-size: 18px;
    font-weight: 200;
    color: #999999;
    opacity: 1;
  }

  input[type='text'] {
    font-style: italic;

    border-radius: 15px;
    width: 100%;
    height: 50px;
    border: 2px solid #b3b3b3;
    background-color: #e6e6e6;
    padding: 0px 10px;
    outline: none;
    font-size: 18px;
    transition: border 0.3s;
  }
  input[type='text']::placeholder {
    font-size: 18px;
    font-weight: 200;
    color: #999999;
    opacity: 1;
  }

  a {
    color: colours.$background-primary;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  input[type='password']:focus {
    border: 2px solid #24232e;
  }

  input[type='submit'] {
    border-radius: 15px;
    cursor: pointer;
    width: 100%;
    height: 50px;
    background-color: colours.$background-primary;
    border: none;
    color: colours.$background-white;
    font-size: 18px;
    font-weight: 200;
    text-align: left;
    padding: 0px 10px;
    transition: box-shadow 0.3s;
  }

  input[type='submit']:hover {
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.4);
  }

  button {
    border-radius: 15px;
    cursor: pointer;
    width: 100%;
    height: 50px;
    background-color: colours.$background-primary;
    border: none;
    color: colours.$background-white;
    font-size: 18px;
    font-weight: 200;
    text-align: left;
    padding: 0px 10px;
    transition: box-shadow 0.3s;
    margin-bottom: 10px;
  }

  button:hover {
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.4);
  }

  h1,
  p {
    color: colours.$background-primary;
  }

  .container {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  .filler-container {
    flex: 60%;
    height: 100%;
    background-color: colours.$background-primary;
    position: relative;

    .centered {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .content-container {
    flex: 40%;
    height: 100%;
    background-color: colours.$background-white;
    position: relative;
    // display: flex;
    // justify-content: center;
    // align-items: center;

    .login-container {
      width: 80%;

      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      .line {
        width: 15%;
        height: 10px;
        margin-bottom: 15px;
        background-color: colours.$background-primary;
      }
    }
  }
</style>
