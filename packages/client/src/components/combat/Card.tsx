import { Show } from 'solid-js';
import { getCardOrPlaceholder } from '../../utils/cardLookup.ts';
import styles from './Card.module.css';

const CHARACTER_COLORS: Record<string, string> = {
  ironclad: '#c62828',
  silent: '#2e7d32',
  defect: '#1565c0',
  watcher: '#6a1b9a',
  colorless: '#666',
};

export interface CardProps {
  cardId: string;
  selected?: boolean;
  playable?: boolean;
  onSelect?: (cardId: string) => void;
  onHover?: (cardId: string | null, rect?: DOMRect) => void;
}

export function Card(props: CardProps) {
  const card = () => getCardOrPlaceholder(props.cardId);
  const charColor = () => CHARACTER_COLORS[card().character] ?? '#666';

  function handleClick() {
    props.onSelect?.(props.cardId);
  }

  function handleMouseEnter(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    props.onHover?.(props.cardId, rect);
  }

  function handleMouseLeave() {
    props.onHover?.(null);
  }

  const costDisplay = () => {
    const c = card().cost;
    if (c === 'unplayable') return '-';
    if (c === 'X') return 'X';
    return String(c);
  };

  const keywordList = () => {
    const kw: string[] = [];
    if (card().exhaust) kw.push('Exhaust');
    if (card().ethereal) kw.push('Ethereal');
    if (card().retain) kw.push('Retain');
    if (card().innate) kw.push('Innate');
    return kw;
  };

  return (
    <div
      class={styles.card}
      classList={{
        [styles.selected!]: props.selected === true,
        [styles.dimmed!]: props.playable === false,
        [styles.upgraded!]: card().upgraded,
      }}
      style={{ '--char-color': charColor() }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div class={styles.cost}>{costDisplay()}</div>
      <div class={styles.header}>{card().name}</div>
      <div class={styles.artPlaceholder} />
      <div class={styles.text}>{card().text}</div>
      <div class={styles.footer}>
        <span class={styles.type}>{card().type}</span>
        <Show when={keywordList().length > 0}>
          <div class={styles.keywords}>
            {keywordList().map((kw) => (
              <span class={styles.keyword}>{kw}</span>
            ))}
          </div>
        </Show>
      </div>
    </div>
  );
}
