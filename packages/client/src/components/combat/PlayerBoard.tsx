import { createSignal, Show } from 'solid-js';
import type { ClientMessage } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { getMyPlayer } from '../../stores/gameStore.ts';
import { HandZone } from './HandZone.tsx';
import { PlayerStats } from './PlayerStats.tsx';
import { EndTurnButton } from './EndTurnButton.tsx';
import { CardTooltip } from './CardTooltip.tsx';
import { PotionSlots } from './PotionSlots.tsx';
import styles from './PlayerBoard.module.css';

export interface PlayerBoardProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
  onCardSelected?: (cardId: string | null) => void;
}

export function PlayerBoard(props: PlayerBoardProps) {
  const [selectedCard, setSelectedCard] = createSignal<string | null>(null);
  const [hoveredCard, setHoveredCard] = createSignal<string | null>(null);
  const [hoverRect, setHoverRect] = createSignal<{ x: number; y: number; width: number; height: number } | undefined>(undefined);

  const player = () => getMyPlayer(props.state);

  function handleCardSelect(cardId: string | null) {
    setSelectedCard(cardId);
    props.onCardSelected?.(cardId);
  }

  function handleCardHover(cardId: string | null, rect?: DOMRect) {
    setHoveredCard(cardId);
    if (rect) {
      setHoverRect({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    } else {
      setHoverRect(undefined);
    }
  }

  function handleEndTurn() {
    props.send({ type: 'END_TURN' });
  }

  return (
    <Show when={player()}>
      {(p) => (
        <div class={styles.playerBoard}>
          <div class={styles.topRow}>
            <div class={styles.statsArea}>
              <PlayerStats player={p()} />
            </div>
            <div class={styles.potionArea}>
              <PotionSlots state={props.state} send={props.send} />
            </div>
            <div class={styles.endTurnArea}>
              <EndTurnButton
                endedTurn={p().endedTurn}
                phase={props.state.game!.phase}
                onEndTurn={handleEndTurn}
              />
            </div>
          </div>

          <Show when={props.state.game?.phase === 'WAITING_FOR_ALL_PLAYERS'}>
            <div class={styles.waitingMessage}>
              Waiting for other players to end their turn...
            </div>
          </Show>

          <div class={styles.handArea}>
            <HandZone
              hand={p().hand}
              energy={p().energy}
              phase={props.state.game!.phase}
              endedTurn={p().endedTurn}
              selectedCard={selectedCard()}
              onSelectCard={handleCardSelect}
              onHoverCard={handleCardHover}
            />
            <CardTooltip
              cardId={hoveredCard()}
              anchorRect={hoverRect()}
            />
          </div>
        </div>
      )}
    </Show>
  );
}
