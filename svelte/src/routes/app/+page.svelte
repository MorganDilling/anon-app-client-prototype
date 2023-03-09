<script lang="ts">
  import { authedUser } from '@lib/databaseWrapper';
</script>

<p>Signed in as user: {$authedUser?.userId}</p>
<a href="/">home</a>
