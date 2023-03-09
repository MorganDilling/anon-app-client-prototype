<script lang="ts">
  import { authedUser, login, logout } from '@lib/databaseWrapper';

  let userId: number;
  let password: string;

  const Login = () => {
    login(Number(userId), password);
  };
</script>

{#if $authedUser}
  <p>Signed in as user: {$authedUser.userId}</p>
  <form>
    <button type="submit" on:click={logout}>Logout</button>
  </form>
  <!-- <slot /> -->
{:else}
  <form on:submit|preventDefault>
    <input
      type="text"
      inputmode="numeric"
      placeholder="User ID"
      bind:value={userId}
    />
    <input type="password" placeholder="Password" bind:value={password} />
    <button type="submit" on:click={Login}>Login</button>
    <a href="/register">Register</a>
  </form>
{/if}
