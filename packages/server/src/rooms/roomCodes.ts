// Curated list of thematic 4-letter words for room codes
// Easy to say out loud, memorable, game-themed
const ROOM_WORDS = [
  'FIRE', 'SLAM', 'IRON', 'DARK', 'GLOW', 'RUNE', 'MIST',
  'FANG', 'BOLT', 'CLAW', 'DUSK', 'FURY', 'GRIM', 'HAZE',
  'JADE', 'KEEN', 'LASH', 'MYTH', 'ORBS', 'PIKE', 'RAGE',
  'SCAR', 'TOMB', 'VOID', 'WARP', 'ZEAL', 'APEX', 'BANE',
  'CAST', 'DOOM', 'EDGE', 'FLUX', 'GRIP', 'HOWL', 'JINX',
  'KNOT', 'LEAP', 'MAZE', 'NOVA', 'OATH', 'PACT', 'RIFT',
  'SAGE', 'TUSK', 'URGE', 'VEIL', 'WAIL', 'ARCH', 'BLOT',
  'COIL', 'DART', 'ECHO', 'FRAY', 'GALE', 'HUNT', 'JOLT',
  'LOOM', 'MEND', 'NUKE', 'OMEN', 'PYRE', 'RAID', 'SEED',
  'TIDE', 'VALE', 'WARD', 'YOKE', 'BASH', 'CRAG', 'DAZE',
  'FUME', 'GORE', 'HELM', 'INKY', 'LURE', 'MURK', 'NUMB',
  'OPAL', 'PLOY', 'RAZE', 'SOOT', 'TRAP', 'VIAL', 'WHET',
  'AXLE', 'BURN', 'CUBE', 'DEFT', 'EMIT', 'FORK', 'GILT',
  'HUSK', 'LAIR', 'MASK', 'NICK', 'OPUS', 'QUAY', 'RUST',
  'SILK', 'TOIL', 'VANE', 'WRIT',
] as const;

/**
 * Generate a random unused 4-letter word code for a room.
 * @param existingCodes Set of codes currently in use
 * @returns A unique 4-letter word code
 * @throws Error if all codes are exhausted
 */
export function generateRoomCode(existingCodes: Set<string>): string {
  const available = ROOM_WORDS.filter((w) => !existingCodes.has(w));
  if (available.length === 0) {
    throw new Error('No room codes available — all codes in use');
  }
  return available[Math.floor(Math.random() * available.length)]!;
}
