import { For } from 'solid-js';
import type { TurnPhase } from '@slay-online/shared';
import styles from './SharedInfo.module.css';

export interface PlayerTurnStatus {
  id: string;
  nickname: string;
  endedTurn: boolean;
}

export interface SharedInfoProps {
  dieResult: number | null;
  phase: TurnPhase;
  round: number;
  players: PlayerTurnStatus[];
}

function phaseLabel(phase: TurnPhase): string {
  switch (phase) {
    case 'PLAYER_ACTIONS': return 'Player Actions';
    case 'WAITING_FOR_ALL_PLAYERS': return 'Waiting for Players...';
    case 'ENEMY_TURN': return 'Enemy Turn';
    case 'CLEANUP': return 'Cleanup';
    case 'COMBAT_END': return 'Combat Over';
    default: return '';
  }
}

export function SharedInfo(props: SharedInfoProps) {
  return (
    <div class={styles.sharedInfo}>
      {/* Die Result */}
      <div>
        <div class={styles.dieResult}>
          {props.dieResult !== null ? props.dieResult : '--'}
        </div>
        <div class={styles.dieLabel}>Die</div>
      </div>

      {/* Turn Phase */}
      <div>
        <div class={styles.turnPhase}>{phaseLabel(props.phase)}</div>
        <div class={styles.round}>Round {props.round}</div>
      </div>

      {/* Player End-Turn Status */}
      <div class={styles.playerStatuses}>
        <For each={props.players}>
          {(player) => (
            <div class={styles.playerStatus}>
              {player.endedTurn ? (
                <span class={styles.checkmark}>{'\u2713'}</span>
              ) : (
                <span class={styles.waiting}>{'\u25CB'}</span>
              )}
              <span>{player.nickname}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
