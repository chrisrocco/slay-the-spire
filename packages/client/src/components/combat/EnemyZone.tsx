import { For, Show } from 'solid-js';
import { EnemyCardComponent } from './EnemyCard.tsx';
import type { EnemyCombatInfo } from './EnemyCard.tsx';
import styles from './EnemyZone.module.css';

export interface EnemyZoneProps {
  activeEnemies: string[];
  enemyCombatStates: Record<string, EnemyCombatInfo>;
  selectedCard: string | null;
  onEnemyClick: (enemyId: string) => void;
  dieResult: number | null;
}

export function EnemyZone(props: EnemyZoneProps) {
  return (
    <div class={styles.enemyZone}>
      <Show
        when={props.activeEnemies.length > 0}
        fallback={<div class={styles.empty}>No enemies</div>}
      >
        <For each={props.activeEnemies}>
          {(enemyId) => {
            const combatState = () => props.enemyCombatStates[enemyId];
            const isDead = () => combatState()?.isDead ?? false;
            const isTargetable = () => props.selectedCard !== null && !isDead();

            return (
              <EnemyCardComponent
                enemyId={enemyId}
                combatState={combatState()}
                targetable={isTargetable()}
                onClick={props.onEnemyClick}
                dieResult={props.dieResult}
              />
            );
          }}
        </For>
      </Show>
    </div>
  );
}
