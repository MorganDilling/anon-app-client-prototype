<script lang="ts">
  import { authedUser, login, register } from '@lib/databaseWrapper';

  let password: string;

  const Register = async () => {
    const data = await register(password);

    if (data?.responseData.user) {
      login(data.responseData.user.id, password);
    }
  };
</script>

<!-- {#if $authedUser}
  <p>Registered as {$authedUser.userId}</p>
  <a href="/app">Go to app</a>
{:else}
  <form on:submit|preventDefault>
    <input type="password" placeholder="Password" bind:value={password} />
    <button type="submit" on:click={Register}>Register</button>
    <a href="/login">Login</a>
  </form>
{/if} -->

<div class="container">
  <div class="filler-container" />
  <div class="content-container" />
</div>

<style lang="scss">
  @use '../../styles/colours.scss' as colours;

  .container {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  .filler-container {
    flex: 60%;
    height: 100%;
    background-color: colours.$background-primary;
  }

  .content-container {
    flex: 40%;
    height: 100%;
    background-color: colours.$background-white;
  }
</style>
