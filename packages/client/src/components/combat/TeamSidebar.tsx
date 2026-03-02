import { For, Show } from 'solid-js';
import type { PlayerState } from '@slay-online/shared';
import styles from './TeamSidebar.module.css';

const CHARACTER_COLORS: Record<string, string> = {
  ironclad: '#c62828',
  silent: '#2e7d32',
  defect: '#1565c0',
  watcher: '#6a1b9a',
};

export interface TeamSidebarProps {
  players: PlayerState[];
  myPlayerId: string | null;
}

export function TeamSidebar(props: TeamSidebarProps) {
  return (
    <div class={styles.sidebar}>
      <div class={styles.sidebarTitle}>Players</div>
      <For each={props.players}>
        {(player) => {
          const isMe = () => player.id === props.myPlayerId;
          const hpPercent = () =>
            Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
          const charColor = () => CHARACTER_COLORS[player.character] ?? '#666';

          return (
            <div
              class={styles.playerCard}
              classList={{ [styles.currentPlayer!]: isMe() }}
            >
              <div class={styles.playerHeader}>
                <div
                  class={styles.characterDot}
                  style={{ background: charColor() }}
                />
                <span class={styles.playerName}>
                  {player.nickname}
                  {isMe() ? ' (You)' : ''}
                </span>
                <Show when={player.endedTurn}>
                  <span class={styles.endedCheck}>{'\u2713'}</span>
                </Show>
              </div>

              <div class={styles.miniStats}>
                {/* HP */}
                <div class={styles.miniStat}>
                  <span class={styles.miniLabel}>HP</span>
                  <div class={styles.miniHpBar}>
                    <div
                      class={styles.miniHpFill}
                      style={{ width: `${hpPercent()}%` }}
                    />
                  </div>
                  <span class={styles.miniHpText}>
                    {player.hp}/{player.maxHp}
                  </span>
                </div>

                {/* Energy */}
                <div class={styles.miniStat}>
                  <span class={styles.miniLabel}>Enrg</span>
                  <span class={styles.miniValue}>{player.energy}</span>
                </div>

                {/* Block */}
                <Show when={player.block > 0}>
                  <div class={styles.miniStat}>
                    <span class={styles.miniLabel}>Blk</span>
                    <span class={styles.miniValue}>{player.block}</span>
                  </div>
                </Show>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
