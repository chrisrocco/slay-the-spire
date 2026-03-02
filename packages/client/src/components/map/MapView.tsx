import { For, Show, createEffect, createMemo } from 'solid-js';
import type { ClientMessage, MapNode as MapNodeData } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { MapNode } from './MapNode.tsx';
import styles from './MapView.module.css';

export interface MapViewProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
  /** When true, renders as a read-only overlay (e.g., during combat) */
  readOnly?: boolean;
  onClose?: () => void;
}

export function MapView(props: MapViewProps) {
  let containerRef: HTMLDivElement | undefined;

  const game = () => props.state.game;
  const map = () => game()?.map;
  const currentNodeId = () => map()?.currentNodeId ?? null;

  // Determine the current player's ID
  const myId = () => props.state.playerId ?? '';

  // Host is the first player
  const isHost = () => {
    const g = game();
    if (!g || !myId()) return false;
    return g.players[0]?.id === myId();
  };

  // Group nodes by floor, sorted by floor ascending (0 at bottom, 14 at top when rendered)
  const floorMap = createMemo(() => {
    const nodes = map()?.nodes ?? [];
    const floors = new Map<number, MapNodeData[]>();
    for (const node of nodes) {
      if (!floors.has(node.floor)) floors.set(node.floor, []);
      floors.get(node.floor)!.push(node);
    }
    // Sort each floor's nodes by id for consistent ordering
    for (const [, nodesInFloor] of floors) {
      nodesInFloor.sort((a, b) => a.id.localeCompare(b.id));
    }
    return floors;
  });

  // Sorted floor numbers (descending so floor 14/boss is at top)
  const floorNumbers = createMemo(() => {
    const nums = Array.from(floorMap().keys());
    nums.sort((a, b) => b - a);
    return nums;
  });

  // Determine which nodes are available (can be clicked next)
  const availableNodeIds = createMemo(() => {
    const nodes = map()?.nodes ?? [];
    const curId = currentNodeId();
    if (!curId) {
      // No current node: all floor-0 nodes are available
      return new Set(nodes.filter(n => n.floor === 0).map(n => n.id));
    }
    const curNode = nodes.find(n => n.id === curId);
    if (!curNode) return new Set<string>();
    return new Set(curNode.connections);
  });

  // Determine which nodes have been visited (floor < currentFloor, or current)
  const visitedNodeIds = createMemo(() => {
    const nodes = map()?.nodes ?? [];
    const curId = currentNodeId();
    if (!curId) return new Set<string>();
    const curNode = nodes.find(n => n.id === curId);
    if (!curNode) return new Set<string>();
    // Mark all nodes on floors <= current as visited (rough approximation)
    return new Set(nodes.filter(n => n.floor < curNode.floor).map(n => n.id));
  });

  // Build connection lines: each node has connections (child ids)
  // We'll render SVG lines between parent and child nodes
  // For simplicity, we track pairs as (parentId -> childId)
  const connectionPairs = createMemo(() => {
    const nodes = map()?.nodes ?? [];
    const pairs: Array<{ from: string; to: string }> = [];
    for (const node of nodes) {
      for (const childId of node.connections) {
        pairs.push({ from: node.id, to: childId });
      }
    }
    return pairs;
  });

  function handleNodeClick(nodeId: string) {
    if (!props.readOnly) {
      props.send({ type: 'SELECT_NODE', nodeId });
    }
  }

  // Auto-scroll to current node when it changes
  createEffect(() => {
    const curId = currentNodeId();
    if (!curId || !containerRef) return;
    const el = containerRef.querySelector(`[data-node-id="${curId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  return (
    <Show when={map()}>
      {(m) => (
        <div class={props.readOnly ? `${styles.mapView} ${styles.overlay}` : styles.mapView}>
          <div class={styles.header}>
            <h2 class={styles.title}>Act 1 Map</h2>
            {props.onClose && (
              <button class={styles.closeBtn} onClick={props.onClose} aria-label="Close map">
                X
              </button>
            )}
          </div>

          <div class={styles.mapContainer} ref={containerRef}>
            <For each={floorNumbers()}>
              {(floor) => {
                const nodesOnFloor = () => floorMap().get(floor) ?? [];
                const floorLabel = floor === 0 ? 'Start' : floor === 14 ? 'Boss' : `Floor ${floor + 1}`;
                return (
                  <div class={styles.floorRow} data-floor={floor}>
                    <div class={styles.floorLabel}>{floorLabel}</div>
                    <div class={styles.floorNodes}>
                      <For each={nodesOnFloor()}>
                        {(node) => (
                          <div data-node-id={node.id} class={styles.nodeCell}>
                            <MapNode
                              node={node}
                              isCurrent={currentNodeId() === node.id}
                              isAvailable={!props.readOnly && availableNodeIds().has(node.id)}
                              isVisited={visitedNodeIds().has(node.id)}
                              isHost={isHost() && !props.readOnly}
                              onClick={() => handleNodeClick(node.id)}
                            />
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>

          {/* Connection lines via SVG overlay - simplified vertical connector lines */}
          <div class={styles.connectionInfo}>
            {connectionPairs().length > 0 && (
              <span class={styles.connectionHint}>
                {currentNodeId()
                  ? `${availableNodeIds().size} path${availableNodeIds().size !== 1 ? 's' : ''} available`
                  : 'Choose a starting path'}
              </span>
            )}
          </div>
        </div>
      )}
    </Show>
  );
}
