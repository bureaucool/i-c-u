<script lang="ts">
  let { taskTitle, onSave, onCancel }: { taskTitle: string; onSave: (minutes: number) => Promise<void> | void; onCancel: () => void } = $props();
  let minutes = $state<number | null>(null);
  function close() { onCancel(); }
  async function submit(e: SubmitEvent) {
    e.preventDefault();
    await onSave(Number(minutes ?? 0) || 0);
  }
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center" onclick={(e) => { if (e.currentTarget === e.target) close(); }}>
  <div class="bg-white p-4 rounded shadow w-full max-w-md" onclick={(e) => e.stopPropagation()}>
    <h3>Complete task</h3>
    <p>{taskTitle}</p>
    <form onsubmit={submit}>
      <input type="number" min="0" step="1" placeholder="Minutes" bind:value={minutes} />
      <button type="submit">Save</button>
      <button type="button" onclick={close}>Cancel</button>
    </form>
  </div>
  <svelte:window onkeydown={(e) => { if (e.key === 'Escape') close(); }} />
</div>


