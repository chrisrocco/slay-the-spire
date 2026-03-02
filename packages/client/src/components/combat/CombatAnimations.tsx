import { Show } from 'solid-js';
import styles from './CombatAnimations.module.css';

export interface AnimationEvent {
  type: 'attack' | 'defend';
  targetEnemyId?: string;
}

export interface CombatAnimationsProps {
  animation: AnimationEvent | null;
}

export function CombatAnimations(props: CombatAnimationsProps) {
  return (
    <>
      <Show when={props.animation?.type === 'attack'}>
        <div class={styles.attackOverlay} />
      </Show>
      <Show when={props.animation?.type === 'defend'}>
        <div class={styles.defendOverlay} />
      </Show>
    </>
  );
}
