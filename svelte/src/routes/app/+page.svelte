<script lang="ts">
  import { authedUser, logout } from '@lib/databaseWrapper';
  import { goto } from '$app/navigation';

  const Logout = () => {
    logout();
    goto('/register');
  };

  if ($authedUser?.userId === undefined) {
    goto('/register');
  }
</script>

<p>Signed in as user: {$authedUser?.userId}</p>
<a href="/">home</a>
<form>
  <button type="submit" on:click={Logout}>Logout</button>
</form>
