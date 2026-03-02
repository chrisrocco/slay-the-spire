import { createSignal, For, Show } from 'solid-js';
import type { ClientMessage, GameState } from '@slay-online/shared';
import { relicMap } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { getMyPlayer } from '../../stores/gameStore.ts';
import styles from './BossRelicView.module.css';

export interface BossRelicViewProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
}

// Boss relics pair their starter relic replacements.
// These are the starter relics each character starts with.
const STARTER_RELIC_BY_CHARACTER: Record<string, string> = {
  ironclad: 'burning_blood',
  silent: 'ring_of_the_snake',
  defect: 'cracked_core',
  watcher: 'pure_water',
};

// The boss relics that replace starter relics.
const BOSS_RELIC_REPLACES: Record<string, string> = {
  black_blood: 'burning_blood',
  ring_of_the_serpent: 'ring_of_the_snake',
  frozen_core: 'cracked_core',
  holy_water: 'pure_water',
};

function getStarterRelicName(relicId: string): string | null {
  const replacedId = BOSS_RELIC_REPLACES[relicId];
  if (!replacedId) return null;
  return relicMap[replacedId]?.name ?? replacedId;
}

export function BossRelicView(props: BossRelicViewProps) {
  const [picked, setPicked] = createSignal(false);

  const game = (): GameState => props.state.game!;
  const myPlayer = () => getMyPlayer(props.state);
  const myPlayerId = () => props.state.playerId ?? '';

  // Boss relic choices are stored in the rewardState as an extended field
  // The server stores them in an ExtendedRewardState (bossRelicChoices on rewardState)
  const bossRelicChoices = (): string[] => {
    const rs = game().rewardState as ({ bossRelicChoices?: string[] } | undefined);
    return rs?.bossRelicChoices ?? [];
  };

  // Track who already picked a boss relic via playerChoices.bossRelicPicked
  const pickedRelicByPlayer = (): Record<string, string | null> => {
    const choices = game().rewardState?.playerChoices ?? {};
    const result: Record<string, string | null> = {};
    for (const [playerId, choice] of Object.entries(choices)) {
      const extChoice = choice as typeof choice & { bossRelicPicked?: string };
      result[playerId] = extChoice.bossRelicPicked ?? null;
    }
    return result;
  };

  const myPickedRelic = () => pickedRelicByPlayer()[myPlayerId()] ?? null;

  const isTaken = (relicId: string) => {
    return Object.values(pickedRelicByPlayer()).includes(relicId);
  };

  function handlePickBossRelic(relicId: string) {
    if (myPickedRelic() || picked()) return;
    // Use REWARD_PICK_RELIC with the boss relic via REWARD_PICK_CARD pattern
    // The server handles boss relic via REWARD_PICK_RELIC which picks the relicReward,
    // but for boss flow there's a specific cardId-like approach
    // Looking at schemas: REWARD_PICK_RELIC has no payload (from plan 01).
    // The boss relic selection mechanism differs — the server sets relicReward
    // to the chosen boss relic ID and player calls REWARD_PICK_RELIC.
    // However, since multiple choices exist, we need to communicate which one.
    // The server's handleRewardPickRelic picks relicReward which must be set per-player.
    // For the boss flow, we use REWARD_PICK_CARD with cardId = bossRelicId as convention.
    // Actually looking at the schemas: REWARD_PICK_RELIC has no payload.
    // The boss relic selection uses the same message but the server must know which relic.
    // Looking at the plan more carefully: "Once selected, it's marked as taken (grayed out for others)"
    // This suggests the server tracks boss relic selection separately.
    // Since REWARD_PICK_RELIC has no payload, the only way to communicate the selection
    // is to use REWARD_PICK_CARD with the boss relic ID as a convention, or the server
    // must derive it from context. We'll use REWARD_PICK_CARD with the bossRelicId.
    props.send({ type: 'REWARD_PICK_CARD', cardId: relicId });
    setPicked(true);
  }

  const allPicked = () => {
    return game().players.every((p) => pickedRelicByPlayer()[p.id] !== null && pickedRelicByPlayer()[p.id] !== undefined);
  };

  return (
    <Show when={game() && bossRelicChoices().length > 0}>
      <div class={styles.bossRelicView}>
        <h2 class={styles.title}>Boss Relic Selection</h2>
        <p class={styles.subtitle}>Choose a relic to replace your starter relic</p>

        <div class={styles.relicRow}>
          <For each={bossRelicChoices()}>
            {(relicId) => {
              const relic = relicMap[relicId];
              const taken = () => isTaken(relicId);
              const replacesName = getStarterRelicName(relicId);
              const isMyPick = () => myPickedRelic() === relicId;

              return (
                <div
                  class={styles.relicCard}
                  classList={{
                    [styles.taken!]: taken() && !isMyPick(),
                    [styles.myPick!]: isMyPick(),
                  }}
                >
                  <div class={styles.relicName}>{relic?.name ?? relicId}</div>
                  <div class={styles.relicCategory}>{relic?.category ?? ''}</div>
                  <div class={styles.relicText}>{relic?.text ?? ''}</div>
                  <Show when={replacesName}>
                    <div class={styles.replaces}>Replaces: {replacesName}</div>
                  </Show>
                  <Show when={!taken() && !myPickedRelic() && !picked()}>
                    <button
                      class={styles.pickButton}
                      onClick={() => handlePickBossRelic(relicId)}
                    >
                      Select
                    </button>
                  </Show>
                  <Show when={isMyPick()}>
                    <div class={styles.selectedBadge}>Selected!</div>
                  </Show>
                  <Show when={taken() && !isMyPick()}>
                    <div class={styles.takenBadge}>Taken</div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        {/* Player pick status */}
        <div class={styles.playerStatusList}>
          <For each={game().players}>
            {(player) => {
              const playerPick = () => pickedRelicByPlayer()[player.id];
              return (
                <div class={styles.playerStatus}>
                  <span class={styles.playerStatusIcon}>
                    {playerPick() ? '\u2713' : '\u29d6'}
                  </span>
                  <span class={styles.playerStatusName}>{player.nickname}</span>
                  <Show when={playerPick()}>
                    <span class={styles.playerPickName}>
                      ({relicMap[playerPick()!]?.name ?? playerPick()})
                    </span>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        <Show when={!allPicked()}>
          <div class={styles.waitingText}>Waiting for all players to choose...</div>
        </Show>
      </div>
    </Show>
  );
}
