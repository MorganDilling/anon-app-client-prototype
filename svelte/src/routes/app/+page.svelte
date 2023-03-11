<script lang="ts">
  import { authedUser, logout } from '@lib/databaseWrapper';
  import { goto } from '$app/navigation';

  const user = localStorage.getItem('authedUser');

  const Logout = () => {
    logout();
    goto('/register');
  };

  if (user === 'null') goto('/register');

  const privateKey = localStorage.getItem('privateKey');
</script>

<main>
  <p>Signed in as user: {$authedUser?.userId}</p>
  <code>{privateKey}</code>
  <br />

  <a href="/">home</a>
  <form>
    <button type="submit" on:click={Logout}>Logout</button>
  </form>
</main>

<style>
  code {
    display: block;
    font-size: smaller;
    word-wrap: break-word;
    width: 450px;
  }
  main {
    color: white;
  }
</style>
