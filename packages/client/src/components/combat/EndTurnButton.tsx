import type { TurnPhase } from '@slay-online/shared';
import styles from './EndTurnButton.module.css';

export interface EndTurnButtonProps {
  endedTurn: boolean;
  phase: TurnPhase;
  onEndTurn: () => void;
}

export function EndTurnButton(props: EndTurnButtonProps) {
  const buttonText = (): string => {
    if (props.phase === 'COMBAT_END') return 'Combat Over';
    if (props.phase === 'ENEMY_TURN') return 'Enemy Turn';
    if (props.phase === 'CLEANUP') return 'Cleanup...';
    if (props.phase === 'WAITING_FOR_ALL_PLAYERS') return 'Waiting...';
    if (props.endedTurn) return 'Turn Ended \u2713';
    return 'End Turn';
  };

  const isDisabled = (): boolean => {
    return (
      props.endedTurn ||
      props.phase !== 'PLAYER_ACTIONS'
    );
  };

  function handleClick() {
    if (!isDisabled()) {
      props.onEndTurn();
    }
  }

  return (
    <div>
      <button
        class={styles.endTurnButton}
        classList={{
          [styles.disabled!]: isDisabled(),
          [styles.ended!]: props.endedTurn && props.phase === 'PLAYER_ACTIONS',
          [styles.waiting!]: props.phase === 'WAITING_FOR_ALL_PLAYERS',
        }}
        onClick={handleClick}
        disabled={isDisabled()}
      >
        {buttonText()}
      </button>
      <div class={styles.phaseLabel}>
        {phaseLabel(props.phase)}
      </div>
    </div>
  );
}

function phaseLabel(phase: TurnPhase): string {
  switch (phase) {
    case 'PLAYER_ACTIONS': return 'Player Actions';
    case 'WAITING_FOR_ALL_PLAYERS': return 'Waiting for Players';
    case 'ENEMY_TURN': return 'Enemy Turn';
    case 'CLEANUP': return 'Cleanup';
    case 'COMBAT_END': return 'Combat Over';
    default: return '';
  }
}
