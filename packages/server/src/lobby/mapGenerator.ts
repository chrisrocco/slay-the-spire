export type RoomType =
  | 'encounter'
  | 'elite'
  | 'event'
  | 'campfire'
  | 'treasure'
  | 'merchant'
  | 'boss';

export interface MapNode {
  id: string; // e.g., "1-0", "2-1" (floor-position)
  floor: number; // 0-based floor number
  type: RoomType;
  connections: string[]; // IDs of nodes this connects to (on next floor)
}

export interface GameMap {
  nodes: MapNode[];
  bossNodeId: string;
  currentNodeId: string | null; // null = not yet on map (at Neow)
}

// Room type pools for each floor range
function getFloorType(floor: number, rng: () => number): RoomType {
  if (floor === 0) return 'encounter';
  if (floor === 6) return 'treasure';
  if (floor === 9) return 'campfire';
  if (floor === 13) return 'campfire';
  if (floor === 14) return 'boss';

  const roll = rng();

  if (floor >= 1 && floor <= 5) {
    // Early floors: mostly encounters, some events
    if (roll < 0.65) return 'encounter';
    if (roll < 0.90) return 'event';
    return 'merchant';
  }

  if (floor >= 7 && floor <= 8) {
    // Mid floors: elites possible
    if (roll < 0.35) return 'encounter';
    if (roll < 0.55) return 'elite';
    if (roll < 0.80) return 'event';
    return 'merchant';
  }

  // Floors 10-12: mixed
  if (roll < 0.30) return 'encounter';
  if (roll < 0.50) return 'elite';
  if (roll < 0.70) return 'event';
  if (roll < 0.85) return 'merchant';
  return 'campfire';
}

/**
 * Generate an Act 1 map with 15 floors (0-14).
 * Floor 0: starting encounters (3 nodes)
 * Floors 1-13: 3-4 nodes per floor with branching paths
 * Floor 14: 1 boss node
 *
 * Guaranteed rooms:
 * - Floor 0: encounters
 * - Floor 6: treasure
 * - Floor 9: campfire
 * - Floor 13: campfire
 * - Floor 14: boss
 */
export function generateMap(rng: () => number = Math.random): GameMap {
  const nodes: MapNode[] = [];

  // Generate nodes for each floor
  for (let floor = 0; floor <= 14; floor++) {
    const nodeCount = floor === 14 ? 1 : floor === 0 ? 3 : 3 + (rng() < 0.4 ? 1 : 0);

    for (let pos = 0; pos < nodeCount; pos++) {
      const id = `${floor}-${pos}`;
      const type = getFloorType(floor, rng);
      nodes.push({ id, floor, type, connections: [] });
    }
  }

  // Connect nodes between floors
  for (let floor = 0; floor < 14; floor++) {
    const currentFloorNodes = nodes.filter((n) => n.floor === floor);
    const nextFloorNodes = nodes.filter((n) => n.floor === floor + 1);

    if (nextFloorNodes.length === 0) continue;

    // Ensure every current node connects to at least 1 next node
    // and every next node has at least 1 incoming connection
    for (const node of currentFloorNodes) {
      // Connect to 1-2 next floor nodes
      const connectCount = rng() < 0.5 ? 1 : Math.min(2, nextFloorNodes.length);
      const shuffled = [...nextFloorNodes].sort(() => rng() - 0.5);
      const targets = shuffled.slice(0, connectCount);
      for (const target of targets) {
        if (!node.connections.includes(target.id)) {
          node.connections.push(target.id);
        }
      }
    }

    // Ensure every next floor node has at least one incoming connection
    for (const nextNode of nextFloorNodes) {
      const hasIncoming = currentFloorNodes.some((n) =>
        n.connections.includes(nextNode.id),
      );
      if (!hasIncoming) {
        // Pick a random current floor node to connect
        const source =
          currentFloorNodes[Math.floor(rng() * currentFloorNodes.length)]!;
        source.connections.push(nextNode.id);
      }
    }
  }

  const bossNode = nodes.find((n) => n.floor === 14)!;

  return {
    nodes,
    bossNodeId: bossNode.id,
    currentNodeId: null,
  };
}
