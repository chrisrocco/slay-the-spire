import { createSignal, For, Show } from 'solid-js';
import type { ClientMessage, GameState } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { getMyPlayer } from '../../stores/gameStore.ts';
import { getCardOrPlaceholder } from '../../utils/cardLookup.ts';
import styles from './CampfireView.module.css';

export interface CampfireViewProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
}

type CampfireOption = 'rest' | 'smith' | 'dig' | 'lift' | 'toke';

export function CampfireView(props: CampfireViewProps) {
  const [selectedOption, setSelectedOption] = createSignal<CampfireOption | null>(null);
  const [smithCardId, setSmithCardId] = createSignal<string | null>(null);

  const game = (): GameState => props.state.game!;
  const myPlayerId = () => props.state.playerId ?? '';
  const myPlayer = () => getMyPlayer(props.state);

  const campfireState = () => game().campfireState;
  const myChoice = () => campfireState()?.playerChoices[myPlayerId()] ?? null;
  const hasChosen = () => myChoice() !== null;

  const myRelics = () => myPlayer()?.relics ?? [];
  const hasRelic = (relicId: string) => myRelics().includes(relicId);

  // Blocked options
  const restBlocked = () => hasRelic('coffee_dripper');
  const smithBlocked = () => hasRelic('fusion_hammer');

  // Available extra options
  const hasShovel = () => hasRelic('shovel');
  const hasGirya = () => hasRelic('girya');
  const hasPeacePipe = () => hasRelic('peace_pipe');

  // Healing amount for Rest
  const restHealAmount = () => {
    let base = 3;
    if (hasRelic('regal_pillow')) base += 3;
    return base;
  };

  // Deck cards for smith/toke
  const deckCards = () => {
    const player = myPlayer();
    if (!player) return [];
    return [...player.drawPile, ...player.discardPile, ...player.hand];
  };

  // Upgradeable cards (smith): exclude already upgraded, curses, statuses
  const upgradeableCards = () => {
    return deckCards().filter((cardId) => {
      const card = getCardOrPlaceholder(cardId);
      return card.type !== 'Curse' && card.type !== 'Status' && card.type !== 'Daze' && !cardId.endsWith('_upgraded');
    });
  };

  // Removable cards (toke): exclude curses that can't be removed
  const removableCards = () => {
    return deckCards().filter((cardId) => {
      const card = getCardOrPlaceholder(cardId);
      return card.type !== 'Status' && card.type !== 'Daze';
    });
  };

  function handleOptionSelect(option: CampfireOption) {
    setSelectedOption(option);
    setSmithCardId(null);
    // For options that don't need a card selection, submit immediately
    if (option !== 'smith' && option !== 'toke') {
      props.send({ type: 'CAMPFIRE_CHOICE', choice: option });
    }
  }

  function handleCardSelect(cardId: string) {
    const opt = selectedOption();
    if (!opt || (opt !== 'smith' && opt !== 'toke')) return;
    setSmithCardId(cardId);
    props.send({ type: 'CAMPFIRE_CHOICE', choice: opt, cardId });
  }

  const isCardSelectionMode = () => {
    const opt = selectedOption();
    return (opt === 'smith' || opt === 'toke') && !smithCardId();
  };

  const playersWhoChose = () => {
    const choices = campfireState()?.playerChoices ?? {};
    return Object.values(choices).filter((v) => v !== null).length;
  };

  return (
    <div class={styles.campfireView}>
      <div class={styles.campfireIcon} aria-hidden="true">&#x1F525;</div>
      <h2 class={styles.title}>Campfire</h2>
      <p class={styles.subtitle}>Rest and recover at the campfire.</p>

      {/* Player status */}
      <div class={styles.playerStatus}>
        <For each={game().players}>
          {(player) => {
            const choice = () => campfireState()?.playerChoices[player.id] ?? null;
            return (
              <div class={`${styles.playerIndicator} ${choice() !== null ? styles.playerChose : ''}`}>
                <span class={styles.playerCheckmark}>{choice() !== null ? '\u2713' : '\u29D6'}</span>
                <span>{player.nickname}</span>
                <Show when={choice() !== null}>
                  <span class={styles.choiceLabel}>{choice()}</span>
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      <Show
        when={!hasChosen()}
        fallback={
          <div class={styles.chosenMessage}>
            <p>You chose: <strong>{myChoice()}</strong></p>
            <p class={styles.waitingText}>
              Waiting for others... ({playersWhoChose()}/{game().players.length})
            </p>
          </div>
        }
      >
        <Show
          when={!isCardSelectionMode()}
          fallback={
            <div class={styles.cardSelection}>
              <h3 class={styles.cardSelectionTitle}>
                {selectedOption() === 'smith' ? 'Select a card to upgrade:' : 'Select a card to remove:'}
              </h3>
              <div class={styles.cardGrid}>
                <For each={selectedOption() === 'smith' ? upgradeableCards() : removableCards()}>
                  {(cardId) => {
                    const card = getCardOrPlaceholder(cardId);
                    return (
                      <button
                        class={styles.cardChoice}
                        onClick={() => handleCardSelect(cardId)}
                      >
                        <div class={styles.cardChoiceName}>{card.name}</div>
                        <div class={styles.cardChoiceType}>{card.type} - {card.character}</div>
                        <div class={styles.cardChoiceText}>{card.text}</div>
                      </button>
                    );
                  }}
                </For>
              </div>
              <button class={styles.cancelButton} onClick={() => setSelectedOption(null)}>
                Cancel
              </button>
            </div>
          }
        >
          <div class={styles.options}>
            {/* Rest */}
            <button
              class={`${styles.optionButton} ${restBlocked() ? styles.blocked : ''}`}
              disabled={restBlocked()}
              onClick={() => !restBlocked() && handleOptionSelect('rest')}
            >
              <span class={styles.optionIcon}>&#x1F6CF;</span>
              <span class={styles.optionName}>Rest</span>
              <span class={styles.optionEffect}>
                {restBlocked()
                  ? 'Blocked by Coffee Dripper'
                  : `Heal ${restHealAmount()} HP${hasRelic('regal_pillow') ? ' (+Regal Pillow)' : ''}`
                }
              </span>
            </button>

            {/* Smith */}
            <button
              class={`${styles.optionButton} ${smithBlocked() ? styles.blocked : ''}`}
              disabled={smithBlocked()}
              onClick={() => !smithBlocked() && handleOptionSelect('smith')}
            >
              <span class={styles.optionIcon}>&#x2694;</span>
              <span class={styles.optionName}>Smith</span>
              <span class={styles.optionEffect}>
                {smithBlocked()
                  ? 'Blocked by Fusion Hammer'
                  : 'Upgrade a card in your deck'
                }
              </span>
            </button>

            {/* Dig (Shovel relic) */}
            <Show when={hasShovel()}>
              <button
                class={styles.optionButton}
                onClick={() => handleOptionSelect('dig')}
              >
                <span class={styles.optionIcon}>&#x26CF;</span>
                <span class={styles.optionName}>Dig</span>
                <span class={styles.optionEffect}>Gain a random relic (Shovel)</span>
              </button>
            </Show>

            {/* Lift (Girya relic) */}
            <Show when={hasGirya()}>
              <button
                class={styles.optionButton}
                onClick={() => handleOptionSelect('lift')}
              >
                <span class={styles.optionIcon}>&#x1F3CB;</span>
                <span class={styles.optionName}>Lift</span>
                <span class={styles.optionEffect}>Gain Strength (Girya)</span>
              </button>
            </Show>

            {/* Toke (Peace Pipe relic) */}
            <Show when={hasPeacePipe()}>
              <button
                class={styles.optionButton}
                onClick={() => handleOptionSelect('toke')}
              >
                <span class={styles.optionIcon}>&#x1FAD7;</span>
                <span class={styles.optionName}>Toke</span>
                <span class={styles.optionEffect}>Remove a card from your deck (Peace Pipe)</span>
              </button>
            </Show>
          </div>
        </Show>
      </Show>
    </div>
  );
}
