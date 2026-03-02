import { For, Show } from 'solid-js';
import type { GameState } from '@slay-online/shared';
import { relicMap } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { getMyPlayer } from '../../stores/gameStore.ts';
import styles from './TreasureView.module.css';

export interface TreasureViewProps {
  state: AppState;
}

export function TreasureView(props: TreasureViewProps) {
  const game = (): GameState => props.state.game!;
  const myPlayer = () => getMyPlayer(props.state);

  // Show the relics each player has most recently acquired
  // Treasure is instant on the server — by the time we see TREASURE phase, players may already have the relics
  // Display each player's relic from their relic list (last relic added)
  const playerRelics = () => {
    return game().players.map((player) => {
      const lastRelicId = player.relics[player.relics.length - 1] ?? null;
      const relic = lastRelicId ? relicMap[lastRelicId] : null;
      return { player, relicId: lastRelicId, relic };
    });
  };

  return (
    <div class={styles.treasureView}>
      <div class={styles.chestIcon} aria-hidden="true">&#x1F4E6;</div>
      <h2 class={styles.title}>Treasure Room</h2>
      <p class={styles.subtitle}>You found a treasure chest!</p>

      <div class={styles.relicList}>
        <For each={playerRelics()}>
          {({ player, relicId, relic }) => (
            <div class={styles.relicEntry}>
              <span class={styles.playerName}>{player.nickname}</span>
              <Show when={relic && relicId} fallback={
                <span class={styles.noRelic}>No relic found</span>
              }>
                <div class={styles.relicCard}>
                  <div class={styles.relicName}>{relic!.name}</div>
                  <div class={styles.relicCategory}>{relic!.category}</div>
                  <div class={styles.relicText}>{relic!.text}</div>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>

      <p class={styles.hint}>The chest resolves automatically...</p>
    </div>
  );
}
