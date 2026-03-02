import { createSignal, For, Show } from 'solid-js';
import type { ClientMessage, GameState, RewardState } from '@slay-online/shared';
import { relicMap, potionMap } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { getMyPlayer } from '../../stores/gameStore.ts';
import { getCardOrPlaceholder } from '../../utils/cardLookup.ts';
import { Card } from '../combat/Card.tsx';
import styles from './RewardView.module.css';

export interface RewardViewProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
}

function getPlayerName(state: AppState, playerId: string): string {
  return state.game?.players.find((p) => p.id === playerId)?.nickname ?? playerId;
}

function hasPlayerChosen(rewardState: RewardState, playerId: string): boolean {
  const choices = rewardState.playerChoices[playerId];
  if (!choices) return false;
  return choices.cardPicked !== null || choices.potionPicked || choices.relicPicked || choices.skipped;
}

export function RewardView(props: RewardViewProps) {
  const [cardPicked, setCardPicked] = createSignal(false);
  const [potionPicked, setPotionPicked] = createSignal(false);
  const [relicPicked, setRelicPicked] = createSignal(false);

  const game = (): GameState => props.state.game!;
  const rewardState = (): RewardState => game().rewardState!;
  const myPlayer = () => getMyPlayer(props.state);
  const myPlayerId = () => props.state.playerId ?? '';

  // Find this player's card reward (one per player based on their index)
  const myCardRewardIndex = () => {
    const players = game().players;
    return players.findIndex((p) => p.id === myPlayerId());
  };

  const myCardReward = () => {
    const idx = myCardRewardIndex();
    const rewards = rewardState().cardRewards;
    return idx >= 0 && idx < rewards.length ? rewards[idx] : null;
  };

  const myChoices = () => rewardState().playerChoices[myPlayerId()];
  const hasChosen = () => hasPlayerChosen(rewardState(), myPlayerId());

  const potionAtLimit = () => {
    const player = myPlayer();
    if (!player) return true;
    const hasPotionBelt = player.relics.includes('potion_belt');
    const maxPotions = hasPotionBelt ? 5 : 3;
    return player.potions.length >= maxPotions;
  };

  function handlePickCard(cardId: string) {
    if (myChoices()?.cardPicked !== null && myChoices()?.cardPicked !== undefined) return;
    props.send({ type: 'REWARD_PICK_CARD', cardId });
    setCardPicked(true);
  }

  function handlePickPotion() {
    if (myChoices()?.potionPicked) return;
    props.send({ type: 'REWARD_PICK_POTION' });
    setPotionPicked(true);
  }

  function handlePickRelic() {
    if (myChoices()?.relicPicked) return;
    props.send({ type: 'REWARD_PICK_RELIC' });
    setRelicPicked(true);
  }

  function handleSkip() {
    if (hasChosen()) return;
    props.send({ type: 'REWARD_SKIP' });
  }

  const allChosen = () => {
    const state = rewardState();
    return game().players.every((p) => hasPlayerChosen(state, p.id));
  };

  return (
    <Show when={game() && rewardState()}>
      <div class={styles.rewardView}>
        <h2 class={styles.title}>Combat Rewards</h2>

        {/* Gold reward — auto-collected */}
        <Show when={rewardState().gold > 0}>
          <div class={styles.goldReward}>
            <span class={styles.coinIcon}>&#9733;</span>
            <span class={styles.goldAmount}>+{rewardState().gold} Gold</span>
            <span class={styles.autoCollected}>(auto-collected)</span>
          </div>
        </Show>

        {/* Card Reward */}
        <Show when={myCardReward()}>
          {(cardReward) => (
            <div class={styles.rewardSection}>
              <div class={styles.sectionLabel}>Card Reward</div>
              <Show when={!myChoices()?.cardPicked && !cardPicked()}>
                <div class={styles.cardRow}>
                  <For each={cardReward().cardIds}>
                    {(cardId) => {
                      const card = getCardOrPlaceholder(cardId);
                      return (
                        <div class={styles.rewardCardWrapper}>
                          <Card
                            cardId={cardId}
                            onSelect={() => handlePickCard(cardId)}
                          />
                          <div class={styles.cardName}>{card.name}</div>
                        </div>
                      );
                    }}
                  </For>
                </div>
                <button class={styles.skipButton} onClick={handleSkip}>
                  Skip Card
                </button>
              </Show>
              <Show when={myChoices()?.cardPicked || cardPicked()}>
                <div class={styles.pickedMessage}>
                  Card added to deck: {getCardOrPlaceholder(myChoices()?.cardPicked ?? '').name}
                </div>
              </Show>
            </div>
          )}
        </Show>

        {/* Potion Reward */}
        <Show when={rewardState().potionReward}>
          {(potionId) => {
            const potion = () => potionMap[potionId()];
            return (
              <div class={styles.rewardSection}>
                <div class={styles.sectionLabel}>Potion Reward</div>
                <div class={styles.itemCard}>
                  <div class={styles.itemName}>{potion()?.name ?? potionId()}</div>
                  <div class={styles.itemText}>{potion()?.text ?? ''}</div>
                  <div class={styles.itemActions}>
                    <Show when={!myChoices()?.potionPicked && !potionPicked()}>
                      <button
                        class={styles.takeButton}
                        classList={{ [styles.disabled!]: potionAtLimit() }}
                        onClick={handlePickPotion}
                        disabled={potionAtLimit()}
                        title={potionAtLimit() ? 'Potion slots full' : ''}
                      >
                        Take Potion
                      </button>
                      <button class={styles.skipButton} onClick={handleSkip}>
                        Skip
                      </button>
                    </Show>
                    <Show when={myChoices()?.potionPicked || potionPicked()}>
                      <div class={styles.pickedMessage}>Potion taken!</div>
                    </Show>
                  </div>
                </div>
              </div>
            );
          }}
        </Show>

        {/* Relic Reward */}
        <Show when={rewardState().relicReward}>
          {(relicId) => {
            const relic = () => relicMap[relicId()];
            return (
              <div class={styles.rewardSection}>
                <div class={styles.sectionLabel}>Relic Reward</div>
                <div class={styles.itemCard}>
                  <div class={styles.itemName}>{relic()?.name ?? relicId()}</div>
                  <div class={styles.itemText}>{relic()?.text ?? ''}</div>
                  <div class={styles.itemActions}>
                    <Show when={!myChoices()?.relicPicked && !relicPicked()}>
                      <button class={styles.takeButton} onClick={handlePickRelic}>
                        Take Relic
                      </button>
                    </Show>
                    <Show when={myChoices()?.relicPicked || relicPicked()}>
                      <div class={styles.pickedMessage}>Relic taken!</div>
                    </Show>
                  </div>
                </div>
              </div>
            );
          }}
        </Show>

        {/* Player choice status */}
        <div class={styles.playerStatusSection}>
          <Show when={!allChosen()}>
            <div class={styles.waitingText}>Waiting for other players...</div>
          </Show>
          <div class={styles.playerStatusList}>
            <For each={game().players}>
              {(player) => (
                <div class={styles.playerStatus}>
                  <span class={styles.playerStatusIcon}>
                    {hasPlayerChosen(rewardState(), player.id) ? '\u2713' : '\u29d6'}
                  </span>
                  <span class={styles.playerStatusName}>{player.nickname}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}
