import { For, Show, createEffect, onMount } from 'solid-js';
import styles from './CombatLog.module.css';

export interface CombatLogProps {
  entries: string[];
}

export function CombatLog(props: CombatLogProps) {
  let entriesRef: HTMLDivElement | undefined;

  // Auto-scroll to bottom on new entries
  createEffect(() => {
    const _len = props.entries.length; // Track dependency
    void _len;
    if (entriesRef) {
      entriesRef.scrollTop = entriesRef.scrollHeight;
    }
  });

  onMount(() => {
    if (entriesRef) {
      entriesRef.scrollTop = entriesRef.scrollHeight;
    }
  });

  // Show last 50 entries
  const displayEntries = () => props.entries.slice(-50);

  return (
    <div class={styles.combatLog}>
      <div class={styles.header}>Combat Log</div>
      <div class={styles.entries} ref={entriesRef}>
        <Show
          when={displayEntries().length > 0}
          fallback={<div class={styles.empty}>No events yet</div>}
        >
          <For each={displayEntries()}>
            {(entry) => <div class={styles.entry}>{entry}</div>}
          </For>
        </Show>
      </div>
    </div>
  );
}
