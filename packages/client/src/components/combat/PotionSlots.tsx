import { createSignal, For, Show } from 'solid-js';
import type { ClientMessage, GameState } from '@slay-online/shared';
import { potionMap } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { getMyPlayer } from '../../stores/gameStore.ts';
import styles from './PotionSlots.module.css';

export interface PotionSlotsProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
}

export function PotionSlots(props: PotionSlotsProps) {
  const [expandedSlot, setExpandedSlot] = createSignal<number | null>(null);

  const game = (): GameState => props.state.game!;
  const myPlayer = () => getMyPlayer(props.state);

  const potions = () => myPlayer()?.potions ?? [];
  const hasPotionBelt = () => myPlayer()?.relics.includes('potion_belt') ?? false;
  const maxSlots = () => hasPotionBelt() ? 5 : 3;

  // Combat phase detection
  const inCombat = () => game()?.gamePhase === 'COMBAT';

  // Other players (for pass targets)
  const otherPlayers = () =>
    game()?.players.filter((p) => p.id !== props.state.playerId) ?? [];

  function handleToggle(idx: number) {
    setExpandedSlot((prev) => prev === idx ? null : idx);
  }

  function handleUsePotion(potionId: string) {
    props.send({ type: 'USE_POTION', potionId });
    setExpandedSlot(null);
  }

  function handlePassPotion(potionId: string, targetPlayerId: string) {
    props.send({ type: 'PASS_POTION', potionId, targetPlayerId });
    setExpandedSlot(null);
  }

  function handleDiscardPotion(potionId: string) {
    props.send({ type: 'DISCARD_POTION', potionId });
    setExpandedSlot(null);
  }

  // Build slot list: filled + empty up to maxSlots
  const slots = () => {
    const p = potions();
    const total = maxSlots();
    return Array.from({ length: total }, (_, i) => p[i] ?? null);
  };

  return (
    <div class={styles.potionSlots}>
      <For each={slots()}>
        {(potionId, i) => {
          const isExpanded = () => expandedSlot() === i();
          const potion = () => potionId ? potionMap[potionId] : null;

          if (!potionId) {
            return <div class={styles.emptySlot} title="Empty potion slot" />;
          }

          return (
            <div class={styles.potionSlotWrapper}>
              <button
                class={styles.potionSlot}
                classList={{ [styles.expanded!]: isExpanded() }}
                onClick={() => handleToggle(i())}
                title={potion()?.text ?? potionId}
              >
                <span class={styles.potionIcon}>&#x1F9EA;</span>
                <span class={styles.potionName}>{potion()?.name ?? potionId}</span>
              </button>

              {/* Action menu */}
              <Show when={isExpanded()}>
                <div class={styles.actionMenu}>
                  <div class={styles.potionTooltip}>
                    <div class={styles.tooltipName}>{potion()?.name ?? potionId}</div>
                    <div class={styles.tooltipText}>{potion()?.text ?? ''}</div>
                  </div>

                  {/* Use - only in combat */}
                  <Show when={inCombat()}>
                    <button
                      class={styles.actionButton}
                      onClick={() => handleUsePotion(potionId)}
                    >
                      Use
                    </button>
                  </Show>

                  {/* Pass - only outside combat (MAP phase) */}
                  <Show when={!inCombat() && otherPlayers().length > 0}>
                    <div class={styles.passSection}>
                      <span class={styles.passLabel}>Pass to:</span>
                      <For each={otherPlayers()}>
                        {(player) => (
                          <button
                            class={styles.actionButton}
                            onClick={() => handlePassPotion(potionId, player.id)}
                          >
                            {player.nickname}
                          </button>
                        )}
                      </For>
                    </div>
                  </Show>

                  {/* Discard - always available */}
                  <button
                    class={`${styles.actionButton} ${styles.discardButton}`}
                    onClick={() => handleDiscardPotion(potionId)}
                  >
                    Discard
                  </button>

                  {/* Close */}
                  <button
                    class={styles.closeButton}
                    onClick={() => setExpandedSlot(null)}
                  >
                    Close
                  </button>
                </div>
              </Show>
            </div>
          );
        }}
      </For>
    </div>
  );
}
