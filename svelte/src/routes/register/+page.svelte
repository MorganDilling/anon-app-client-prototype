<script lang="ts">
  import { authedUser, login, register } from '@lib/databaseWrapper';
  import { fly } from 'svelte/transition';
  import { linear } from 'svelte/easing';

  import { Download } from 'svelte-bootstrap-icons';

  import blob from '@lib/blob';

  import padlock from '@lib/assets/padlock.svg';
  import { goto } from '$app/navigation';

  let step = 0;

  let debounce = false;

  let blobUrl: string;

  let password: string;
  let confirmedPassword: string;

  let pswValid = true;

  let errorMessage: string | undefined;

  let downloaded = false;

  const forward = () => {
    step++;
  };

  const backward = () => {
    step--;
  };

  const validateInputs = ():
    | { valid: true }
    | { valid: false; error: string } => {
    if (!password || password === '') {
      return { valid: false, error: 'Password must not be empty.' };
    }
    if (password.length < 12)
      return {
        valid: false,
        error: 'Password must be at least 12 characters long.',
      };

    if (password === password.toLowerCase())
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter.',
      };

    if (password === password.toUpperCase())
      return {
        valid: false,
        error: 'Password must contain at least one lowercase letter.',
      };

    if (!password.match(/[0-9]+/giu))
      return {
        valid: false,
        error: 'Password must contain at least one number.',
      };

    if (password !== confirmedPassword) {
      return { valid: false, error: 'Passwords do not match.' };
    }

    return { valid: true };
  };

  const complete = () => {
    if (!downloaded) {
      alert('Please download your recovery data before continuing.');
      return;
    }

    goto('/app');
  };

  const Register = async () => {
    if (debounce) return;
    debounce = true;
    const validation = validateInputs();
    if (!validation.valid) {
      pswValid = false;
      errorMessage = validation.error;
      debounce = false;
      return;
    }
    pswValid = true;
    errorMessage = undefined;

    const data = await register(password);
    if (typeof data?.responseData === 'string') {
      errorMessage = data.responseData;
      debounce = false;
      return;
    }

    if (data?.responseData.user) {
      login(data.responseData.user.id, password);
    }

    if (data?.recoveryData) {
      blobUrl = blob(data.recoveryData);
    }

    if (data?.local) {
      localStorage.setItem('privateKey', data.local.privateKey);
    }

    forward();
    debounce = false;
  };

  const download = () => {
    downloaded = true;
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
    {#if step == 0}
      <div
        class="register-container"
        in:fly={{ duration: 150, easing: linear, x: 25, delay: 75 }}
        out:fly={{ duration: 150, easing: linear, x: -25 }}
      >
        <header style="margin-bottom: 15px;">
          <h1 style="font-size: 50px; font-weight:500; margin-bottom: 10px">
            Register
          </h1>
          <div class="line" />
        </header>
        <form on:submit|preventDefault>
          {#if errorMessage}
            <p class="notice" style="color: #ff0000">
              {errorMessage}
            </p>
          {/if}
          <input
            class={pswValid ? '' : 'error'}
            type="password"
            placeholder="Password"
            bind:value={password}
          />
          <input
            class={pswValid ? '' : 'error'}
            type="password"
            placeholder="Confirm password"
            bind:value={confirmedPassword}
          />
          <p class="notice">
            Don't worry, you don't need to enter a username as we'll generate a
            unique identification number for you.
          </p>
          <input type="submit" on:click={Register} value="Next step →" />
          <p class="notice">
            Already have an account? <a href="/login">Login →</a>
          </p>
        </form>
      </div>
    {:else if step == 1}
      <div
        class="register-container"
        in:fly={{ duration: 150, easing: linear, x: 25, delay: 75 }}
        out:fly={{ duration: 150, easing: linear, x: -25 }}
      >
        <header style="margin-bottom: 15px;">
          <h1 style="font-size: 50px; font-weight:500; margin-bottom: 10px">
            Recovery data
          </h1>
          <div class="line" />
        </header>
        <p class="important">
          Download the following password recovery file and store it in a safe
          location. It is used to recover your account if you ever forget your
          password and to be able to log in on other devices. Do not share it
          with anyone else.
        </p>
        <a
          class="download"
          href={blobUrl}
          download="anonapp_recovery_data.txt"
          on:click={download}
        >
          <div style="margin-right: 5px; display: flex; align-items:middle;">
            <Download />
          </div>
          Download</a
        >
        <button
          type="submit"
          on:click={complete}
          class={downloaded ? '' : 'disabled'}>Finish setup →</button
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

  .download {
    display: flex;
    align-items: center;
    justify-content: center;

    padding: 10px;
    text-decoration: none !important;

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

  .download:hover {
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

    .register-container {
      width: 80%;

      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      .line {
        width: 20%;
        height: 10px;
        margin-bottom: 15px;
        background-color: colours.$background-primary;
      }
    }
  }
</style>
