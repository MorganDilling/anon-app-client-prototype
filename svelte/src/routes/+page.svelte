<script lang="ts">
  import electronAPI from '../electronAPI';

  const data = (async () => {
    const data = await electronAPI.genData();
    return [
      data,
      (async () => {
        return await electronAPI.keyRecov({
          passwordResetIv: data.storedForRecoveryFile.passwordResetIv,
          passwordResetKey: data.storedForRecoveryFile.passwordResetKey,
          encryptedPrivateKey: data.sentToServer.encryptedPrivateKey,
        });
      })(),
    ];
  })();
</script>

<main>
  {#await data}
    <h3>Generating Key</h3>
  {:then [keyData, getRecov]}
    <h3>Generated Key, inclusive Pass Reset Data:</h3>
    <code style="overflow-wrap:break-word;">
      {JSON.stringify(keyData, null, '\t')}
    </code>
    {#await getRecov}
      <h3>Recovering Key based on recovery & Server Data...</h3>
    {:then recovData}
      <h3>Data Derived from recovery & Server Data</h3>
      <code style="overflow-wrap:break-word;"
        >{JSON.stringify(recovData, null, 4)}</code
      >
    {/await}
  {/await}
  <a href="/register">register</a>
  <a href="/login">login</a>
</main>

<style lang="scss">
  main {
    background: #181818;
    color: #fff;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    padding: 0 10px;
  }
</style>
