import { Show } from 'solid-js';
import { getCardOrPlaceholder } from '../../utils/cardLookup.ts';
import styles from './CardTooltip.module.css';

const CHARACTER_COLORS: Record<string, string> = {
  ironclad: '#c62828',
  silent: '#2e7d32',
  defect: '#1565c0',
  watcher: '#6a1b9a',
  colorless: '#666',
};

export interface CardTooltipProps {
  cardId: string | null;
  anchorRect?: { x: number; y: number; width: number; height: number } | undefined;
}

export function CardTooltip(props: CardTooltipProps) {
  const card = () => (props.cardId ? getCardOrPlaceholder(props.cardId) : null);

  const position = () => {
    if (!props.anchorRect) return { left: 0, top: 0 };

    const tooltipWidth = 240;
    const tooltipHeight = 340;
    const padding = 12;

    // Position above the card, centered horizontally
    let left = props.anchorRect.x + props.anchorRect.width / 2 - tooltipWidth / 2;
    let top = props.anchorRect.y - tooltipHeight - padding;

    // Clamp to viewport
    if (left < padding) left = padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    if (top < padding) {
      // Show below the card if not enough space above
      top = props.anchorRect.y + props.anchorRect.height + padding;
    }

    return { left, top };
  };

  const costDisplay = () => {
    const c = card()?.cost;
    if (c === 'unplayable') return '-';
    if (c === 'X') return 'X';
    return String(c ?? 0);
  };

  const keywordList = () => {
    const c = card();
    if (!c) return [];
    const kw: string[] = [];
    if (c.exhaust) kw.push('Exhaust');
    if (c.ethereal) kw.push('Ethereal');
    if (c.retain) kw.push('Retain');
    if (c.innate) kw.push('Innate');
    return kw;
  };

  return (
    <Show when={props.cardId && card()}>
      <div
        class={styles.tooltip}
        style={{
          '--char-color': CHARACTER_COLORS[card()!.character] ?? '#666',
          left: `${position().left}px`,
          top: `${position().top}px`,
        }}
      >
        <div class={styles.cost}>{costDisplay()}</div>
        <div class={styles.header}>{card()!.name}</div>
        <div class={styles.artPlaceholder} />
        <Show when={keywordList().length > 0}>
          <div class={styles.keywords}>
            {keywordList().map((kw) => (
              <span class={styles.keyword}>{kw}</span>
            ))}
          </div>
        </Show>
        <div class={styles.text}>{card()!.text}</div>
        <div class={styles.footer}>
          <span class={styles.type}>{card()!.type}</span>
          <span class={styles.rarity}>{card()!.rarity}</span>
        </div>
      </div>
    </Show>
  );
}
