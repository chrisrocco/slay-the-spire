import type { MapNode as MapNodeData } from '@slay-online/shared';
import styles from './MapNode.module.css';

export interface MapNodeProps {
  node: MapNodeData;
  isCurrent: boolean;
  isAvailable: boolean;
  isVisited: boolean;
  isHost: boolean;
  onClick: () => void;
}

function getRoomIcon(type: MapNodeData['type']): string {
  switch (type) {
    case 'encounter': return '\u2694\uFE0F';  // Crossed swords
    case 'elite': return '\u2620\uFE0F';      // Skull
    case 'event': return '?';
    case 'campfire': return '\uD83D\uDD25';   // Flame
    case 'treasure': return '\uD83D\uDCE6';  // Package/chest
    case 'merchant': return '\uD83D\uDCB0';  // Money bag
    case 'boss': return '\uD83D\uDC51';       // Crown
    default: return '?';
  }
}

function getRoomLabel(type: MapNodeData['type']): string {
  switch (type) {
    case 'encounter': return 'Monster';
    case 'elite': return 'Elite';
    case 'event': return 'Event';
    case 'campfire': return 'Campfire';
    case 'treasure': return 'Treasure';
    case 'merchant': return 'Shop';
    case 'boss': return 'Boss';
    default: return type;
  }
}

export function MapNode(props: MapNodeProps) {
  const nodeClass = () => {
    const classes = [styles.node];
    if (props.isCurrent) classes.push(styles.current);
    else if (props.isAvailable) classes.push(styles.available);
    else if (props.isVisited) classes.push(styles.visited);
    else classes.push(styles.unavailable);
    if (props.isAvailable && props.isHost) classes.push(styles.clickable);
    return classes.join(' ');
  };

  function handleClick() {
    if (props.isAvailable && props.isHost) {
      props.onClick();
    }
  }

  return (
    <div class={styles.nodeWrapper}>
      <button
        class={nodeClass()}
        onClick={handleClick}
        disabled={!(props.isAvailable && props.isHost)}
        title={getRoomLabel(props.node.type)}
        aria-label={`${getRoomLabel(props.node.type)} room${props.isCurrent ? ' (current)' : ''}${props.isAvailable ? ' (available)' : ''}`}
      >
        <span class={styles.icon} aria-hidden="true">{getRoomIcon(props.node.type)}</span>
      </button>
      {props.isCurrent && (
        <div class={styles.bootMeeple} title="Current position">
          <span aria-label="Current position">&#x1F462;</span>
        </div>
      )}
    </div>
  );
}
