import { createSignal, For, Show } from 'solid-js';
import type { ClientMessage, GameState } from '@slay-online/shared';
import { relicMap, potionMap } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { getMyPlayer } from '../../stores/gameStore.ts';
import { getCardOrPlaceholder } from '../../utils/cardLookup.ts';
import styles from './MerchantView.module.css';

export interface MerchantViewProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
}

export function MerchantView(props: MerchantViewProps) {
  const [showCardRemover, setShowCardRemover] = createSignal(false);

  const game = (): GameState => props.state.game!;
  const myPlayerId = () => props.state.playerId ?? '';
  const myPlayer = () => getMyPlayer(props.state);
  const merchantState = () => game().merchantState!;

  const myGold = () => myPlayer()?.gold ?? 0;
  const alreadyRemoved = () => merchantState().playersRemoved.includes(myPlayerId());

  const deckCards = () => {
    const player = myPlayer();
    if (!player) return [];
    return [...new Set([...player.drawPile, ...player.discardPile, ...player.hand])];
  };

  function handleBuyCard(cardId: string) {
    props.send({ type: 'MERCHANT_BUY', itemType: 'card', itemId: cardId });
  }

  function handleBuyRelic(relicId: string) {
    props.send({ type: 'MERCHANT_BUY', itemType: 'relic', itemId: relicId });
  }

  function handleBuyPotion(potionId: string) {
    props.send({ type: 'MERCHANT_BUY', itemType: 'potion', itemId: potionId });
  }

  function handleRemoveCard(cardId: string) {
    props.send({ type: 'MERCHANT_REMOVE_CARD', cardId });
    setShowCardRemover(false);
  }

  function handleLeave() {
    props.send({ type: 'MERCHANT_LEAVE' });
  }

  return (
    <div class={styles.merchantView}>
      <h2 class={styles.title}>Merchant</h2>
      <div class={styles.goldDisplay}>
        <span class={styles.goldIcon}>&#9733;</span>
        <span class={styles.goldAmount}>{myGold()} Gold</span>
      </div>

      {/* Cards for Sale */}
      <section class={styles.section}>
        <h3 class={styles.sectionTitle}>Cards for Sale</h3>
        <div class={styles.itemGrid}>
          <For each={merchantState().cardPool}>
            {({ cardId, price }) => {
              const card = getCardOrPlaceholder(cardId);
              const canAfford = () => myGold() >= price;
              return (
                <div class={styles.itemCard} classList={{ [styles.unaffordable!]: !canAfford() }}>
                  <div class={styles.itemName}>{card.name}</div>
                  <div class={styles.itemType}>{card.type}</div>
                  <div class={styles.itemText}>{card.text}</div>
                  <div class={styles.itemFooter}>
                    <span class={styles.itemPrice}>&#9733; {price}</span>
                    <button
                      class={styles.buyButton}
                      disabled={!canAfford()}
                      onClick={() => handleBuyCard(cardId)}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </section>

      {/* Relics for Sale */}
      <section class={styles.section}>
        <h3 class={styles.sectionTitle}>Relics for Sale</h3>
        <div class={styles.itemGrid}>
          <For each={merchantState().relicPool}>
            {({ relicId, price }) => {
              const relic = relicMap[relicId];
              const canAfford = () => myGold() >= price;
              return (
                <div class={styles.itemCard} classList={{ [styles.unaffordable!]: !canAfford() }}>
                  <div class={styles.itemName}>{relic?.name ?? relicId}</div>
                  <div class={styles.itemType}>{relic?.category ?? ''}</div>
                  <div class={styles.itemText}>{relic?.text ?? ''}</div>
                  <div class={styles.itemFooter}>
                    <span class={styles.itemPrice}>&#9733; {price}</span>
                    <button
                      class={styles.buyButton}
                      disabled={!canAfford()}
                      onClick={() => handleBuyRelic(relicId)}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </section>

      {/* Potions for Sale */}
      <section class={styles.section}>
        <h3 class={styles.sectionTitle}>Potions for Sale</h3>
        <div class={styles.itemGrid}>
          <For each={merchantState().potionPool}>
            {({ potionId, price }) => {
              const potion = potionMap[potionId];
              const canAfford = () => myGold() >= price;
              return (
                <div class={styles.itemCard} classList={{ [styles.unaffordable!]: !canAfford() }}>
                  <div class={styles.itemName}>{potion?.name ?? potionId}</div>
                  <div class={styles.itemText}>{potion?.text ?? ''}</div>
                  <div class={styles.itemFooter}>
                    <span class={styles.itemPrice}>&#9733; {price}</span>
                    <button
                      class={styles.buyButton}
                      disabled={!canAfford()}
                      onClick={() => handleBuyPotion(potionId)}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </section>

      {/* Card Removal */}
      <section class={styles.section}>
        <h3 class={styles.sectionTitle}>Card Removal</h3>
        <div class={styles.removalSection}>
          <div class={styles.removalCost}>
            Cost: &#9733; {merchantState().removeCost}
          </div>
          <Show
            when={!alreadyRemoved()}
            fallback={
              <div class={styles.removalDone}>Already removed a card this visit.</div>
            }
          >
            <button
              class={styles.removeButton}
              disabled={myGold() < merchantState().removeCost}
              onClick={() => setShowCardRemover(true)}
            >
              Remove a Card
            </button>
          </Show>
        </div>

        {/* Card selection for removal */}
        <Show when={showCardRemover()}>
          <div class={styles.cardRemoverList}>
            <h4 class={styles.cardRemoverTitle}>Select a card to remove:</h4>
            <For each={deckCards()}>
              {(cardId) => {
                const card = getCardOrPlaceholder(cardId);
                return (
                  <button class={styles.cardRemoverItem} onClick={() => handleRemoveCard(cardId)}>
                    {card.name} ({card.type})
                  </button>
                );
              }}
            </For>
            <button class={styles.cancelButton} onClick={() => setShowCardRemover(false)}>
              Cancel
            </button>
          </div>
        </Show>
      </section>

      <button class={styles.leaveButton} onClick={handleLeave}>
        Leave Shop
      </button>
    </div>
  );
}
