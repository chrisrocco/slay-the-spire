import { For, Show } from 'solid-js';
import type { TurnPhase } from '@slay-online/shared';
import { Card } from './Card.tsx';
import { getCard } from '../../utils/cardLookup.ts';
import styles from './HandZone.module.css';

export interface HandZoneProps {
  hand: string[];
  energy: number;
  phase: TurnPhase;
  endedTurn: boolean;
  selectedCard: string | null;
  onSelectCard: (cardId: string | null) => void;
  onHoverCard: (cardId: string | null, rect?: DOMRect) => void;
}

export function HandZone(props: HandZoneProps) {
  function isPlayable(cardId: string): boolean {
    if (props.phase !== 'PLAYER_ACTIONS' || props.endedTurn) return false;
    const card = getCard(cardId);
    if (!card) return false;
    if (card.cost === 'unplayable') return false;
    if (card.cost === 'X') return true; // X-cost cards are always playable
    return typeof card.cost === 'number' && card.cost <= props.energy;
  }

  function handleSelect(cardId: string) {
    if (props.selectedCard === cardId) {
      props.onSelectCard(null); // Deselect
    } else {
      props.onSelectCard(cardId); // Select
    }
  }

  return (
    <div class={styles.handZone}>
      <Show when={props.hand.length > 0} fallback={<div class={styles.empty}>No cards in hand</div>}>
        <For each={props.hand}>
          {(cardId) => (
            <Card
              cardId={cardId}
              selected={props.selectedCard === cardId}
              playable={isPlayable(cardId)}
              onSelect={handleSelect}
              onHover={props.onHoverCard}
            />
          )}
        </For>
      </Show>
    </div>
  );
}
