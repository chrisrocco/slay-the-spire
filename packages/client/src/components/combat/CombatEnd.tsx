import { Show } from 'solid-js';
import type { GameState } from '@slay-online/shared';
import styles from './CombatEnd.module.css';

export interface CombatEndProps {
  gameState: GameState;
  onReturnToLobby: () => void;
}

export function CombatEnd(props: CombatEndProps) {
  // Determine win/loss: if any player has HP > 0, it's a win
  const isVictory = () =>
    props.gameState.players.some((p) => p.hp > 0);

  return (
    <Show when={props.gameState.phase === 'COMBAT_END'}>
      <div class={styles.overlay}>
        <div class={styles.modal}>
          <Show
            when={isVictory()}
            fallback={
              <>
                <div class={styles.defeat}>Defeat</div>
                <div class={styles.subtitle}>Your party has been defeated.</div>
              </>
            }
          >
            <div class={styles.victory}>Victory!</div>
            <div class={styles.subtitle}>All enemies have been vanquished.</div>
          </Show>

          <button class={styles.returnButton} onClick={props.onReturnToLobby}>
            Return to Lobby
          </button>
        </div>
      </div>
    </Show>
  );
}
