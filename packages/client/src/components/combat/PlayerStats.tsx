import { Show, For } from 'solid-js';
import type { PlayerState } from '@slay-online/shared';
import styles from './PlayerStats.module.css';

export interface PlayerStatsProps {
  player: PlayerState;
}

export function PlayerStats(props: PlayerStatsProps) {
  const hpPercent = () =>
    Math.max(0, Math.min(100, (props.player.hp / props.player.maxHp) * 100));

  const maxEnergy = 3; // Standard energy cap

  return (
    <div class={styles.statsBar}>
      <div>
        <span class={styles.playerName}>{props.player.nickname}</span>
        <span class={styles.characterBadge}> ({props.player.character})</span>
      </div>

      {/* HP */}
      <div class={styles.stat}>
        <span class={styles.statLabel}>HP</span>
        <div class={styles.hpContainer}>
          <div class={styles.hpBar}>
            <div class={styles.hpFill} style={{ width: `${hpPercent()}%` }} />
          </div>
          <span class={styles.hpText}>
            {props.player.hp}/{props.player.maxHp}
          </span>
        </div>
      </div>

      {/* Energy */}
      <div class={styles.stat}>
        <span class={styles.statLabel}>Energy</span>
        <div class={styles.energyContainer}>
          <For each={Array.from({ length: maxEnergy }, (_, i) => i)}>
            {(i) => (
              <div
                class={styles.energyOrb}
                classList={{
                  [styles.energyFilled!]: i < props.player.energy,
                  [styles.energyEmpty!]: i >= props.player.energy,
                }}
              />
            )}
          </For>
        </div>
      </div>

      {/* Block */}
      <Show when={props.player.block > 0}>
        <div class={styles.stat}>
          <span class={styles.statLabel}>Block</span>
          <span class={styles.blockValue}>{props.player.block}</span>
        </div>
      </Show>

      {/* Pile Counts */}
      <div class={styles.stat}>
        <span class={styles.pileCount}>
          Draw: {props.player.drawPile.length}
          <span class={styles.pileSeparator}>|</span>
          Discard: {props.player.discardPile.length}
          <span class={styles.pileSeparator}>|</span>
          Exhaust: {props.player.exhaustPile.length}
        </span>
      </div>
    </div>
  );
}
