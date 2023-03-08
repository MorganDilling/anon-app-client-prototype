<script lang="ts">
  import electronAPI from '../electronAPI';

  const data = (async () => {
    const data = await electronAPI.genKey();
    return [
      data,
      (async () => {
        return await electronAPI.keyRecov({
          passwordResetIv: data.storedForResetOnUSB.passwordResetIv,
          passwordResetKey: data.storedForResetOnUSB.passwordResetKey,
          privateKeyEncrypted: data.sentToServer.privateKeyEncrypted,
        });
      })(),
    ];
  })();
</script>

<main>
  {#await data}
    <h2>Generating Key</h2>
  {:then [keyData, getRecov]}
    <h2>Generated Key, inclusive Pass Reset Data:</h2>
    <p>
      {JSON.stringify(keyData, null, 2)}
    </p>
    {#await getRecov}
      <h3>Recovering Key based on USB & Server Data...</h3>
    {:then recovData}
      <h2>Data Derived from USB & Server Data</h2>
      {JSON.stringify(recovData, null, 2)}
    {/await}
  {/await}
</main>

<!-- bad styles ik stfu -->
<style lang="scss">
  main {
    font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
