import { For, Show } from 'solid-js';
import type { ClientMessage, GameState } from '@slay-online/shared';
import { eventMap } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { getMyPlayer } from '../../stores/gameStore.ts';
import styles from './EventView.module.css';

export interface EventViewProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
}

export function EventView(props: EventViewProps) {
  const game = (): GameState => props.state.game!;
  const myPlayerId = () => props.state.playerId ?? '';
  const myPlayer = () => getMyPlayer(props.state);

  const eventState = () => game().eventState;
  const event = () => {
    const es = eventState();
    if (!es) return null;
    return eventMap[es.eventId] ?? null;
  };

  const myChoiceIndex = () => eventState()?.playerChoices[myPlayerId()] ?? null;
  const hasChosen = () => myChoiceIndex() !== null;

  const playersWhoChose = () => {
    const choices = eventState()?.playerChoices ?? {};
    return Object.entries(choices)
      .filter(([, idx]) => idx !== null)
      .map(([id]) => id);
  };

  function handleChoice(choiceIndex: number) {
    if (!hasChosen()) {
      props.send({ type: 'EVENT_CHOICE', choiceIndex });
    }
  }

  function getPlayerNickname(playerId: string): string {
    return game().players.find((p) => p.id === playerId)?.nickname ?? playerId;
  }

  return (
    <Show when={event()}>
      {(ev) => (
        <div class={styles.eventView}>
          <h2 class={styles.eventName}>{ev().name}</h2>
          <p class={styles.eventText}>{ev().text}</p>

          {/* Player choice indicators */}
          <div class={styles.playerStatus}>
            <For each={game().players}>
              {(player) => {
                const chose = () => eventState()?.playerChoices[player.id] !== null
                  && eventState()?.playerChoices[player.id] !== undefined;
                const choiceIdx = () => eventState()?.playerChoices[player.id];
                return (
                  <div class={`${styles.playerIndicator} ${chose() ? styles.playerChose : ''}`}>
                    <span class={styles.playerCheckmark}>{chose() ? '\u2713' : '\u25CB'}</span>
                    <span class={styles.playerName}>{player.nickname}</span>
                    <Show when={chose() && choiceIdx() !== null && choiceIdx() !== undefined}>
                      <span class={styles.playerChoiceLabel}>
                        {ev().choices[choiceIdx()!]?.text ?? ''}
                      </span>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>

          {/* Choice buttons */}
          <Show
            when={!hasChosen()}
            fallback={
              <div class={styles.waitingMessage}>
                You chose: <strong>{ev().choices[myChoiceIndex()!]?.text ?? ''}</strong>
                <br />
                <span class={styles.waitingText}>
                  Waiting for other players... ({playersWhoChose().length}/{game().players.length})
                </span>
              </div>
            }
          >
            <div class={styles.choices}>
              <For each={ev().choices}>
                {(choice, i) => (
                  <button
                    class={styles.choiceButton}
                    onClick={() => handleChoice(i())}
                  >
                    <span class={styles.choiceText}>{choice.text}</span>
                    <span class={styles.choiceEffect}>{choice.effect}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      )}
    </Show>
  );
}
