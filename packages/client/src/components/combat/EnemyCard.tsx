import { Show } from 'solid-js';
import { getEnemyOrPlaceholder } from '../../utils/enemyLookup.ts';
import styles from './EnemyCard.module.css';

export interface EnemyCombatInfo {
  hp: number;
  maxHp: number;
  block: number;
  isDead: boolean;
  vulnerableTokens: number;
  weakTokens: number;
  strengthTokens: number;
  poisonTokens: number;
}

export interface EnemyCardProps {
  enemyId: string;
  combatState?: EnemyCombatInfo | undefined;
  targetable?: boolean | undefined;
  onClick?: ((enemyId: string) => void) | undefined;
}

export function EnemyCardComponent(props: EnemyCardProps) {
  const enemy = () => getEnemyOrPlaceholder(props.enemyId);
  const isBoss = () => enemy().category === 'boss';
  const isDead = () => props.combatState?.isDead ?? false;

  const hpPercent = () => {
    if (!props.combatState) return 100;
    return Math.max(0, Math.min(100, (props.combatState.hp / props.combatState.maxHp) * 100));
  };

  const hpText = () => {
    if (!props.combatState) return '???';
    return `${props.combatState.hp}/${props.combatState.maxHp}`;
  };

  function handleClick() {
    if (props.targetable && !isDead()) {
      props.onClick?.(props.enemyId);
    }
  }

  // Category emoji for portrait placeholder
  const portraitEmoji = () => {
    switch (enemy().category) {
      case 'boss': return '\u{1F480}'; // skull
      case 'elite': return '\u{2694}'; // swords
      default: return '\u{1F47E}'; // alien monster
    }
  };

  return (
    <div
      class={styles.enemyCard}
      classList={{
        [styles.boss!]: isBoss(),
        [styles.dead!]: isDead(),
        [styles.targetable!]: props.targetable === true && !isDead(),
      }}
      onClick={handleClick}
    >
      <div class={styles.header}>{enemy().name}</div>
      <div class={styles.portrait}>{portraitEmoji()}</div>

      <div class={styles.hpSection}>
        <div class={styles.hpBar}>
          <div class={styles.hpFill} style={{ width: `${hpPercent()}%` }} />
        </div>
        <div class={styles.hpText}>{hpText()}</div>
      </div>

      <div class={styles.statusRow}>
        <Show when={props.combatState && props.combatState.block > 0}>
          <span class={styles.blockBadge}>{'\u{1F6E1}'} {props.combatState!.block}</span>
        </Show>
        <Show when={props.combatState && props.combatState.vulnerableTokens > 0}>
          <span class={`${styles.token} ${styles.vulnerable}`}>Vuln x{props.combatState!.vulnerableTokens}</span>
        </Show>
        <Show when={props.combatState && props.combatState.weakTokens > 0}>
          <span class={`${styles.token} ${styles.weak}`}>Weak x{props.combatState!.weakTokens}</span>
        </Show>
        <Show when={props.combatState && props.combatState.strengthTokens > 0}>
          <span class={`${styles.token} ${styles.strength}`}>+{props.combatState!.strengthTokens} Str</span>
        </Show>
        <Show when={props.combatState && props.combatState.poisonTokens > 0}>
          <span class={`${styles.token} ${styles.poison}`}>Psn x{props.combatState!.poisonTokens}</span>
        </Show>
      </div>
    </div>
  );
}
