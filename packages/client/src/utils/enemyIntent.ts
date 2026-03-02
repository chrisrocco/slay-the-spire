import { getEnemyOrPlaceholder } from './enemyLookup.ts';

export type IntentType = 'attack' | 'block' | 'buff' | 'debuff' | 'mixed' | 'unknown';

export interface IntentInfo {
  type: IntentType;
  text: string;     // The raw action text (e.g., "Deal 3 damage. Gain 1 Strength.")
  summary: string;  // Short display (e.g., "3 dmg + 1 Str")
  icon: string;     // Unicode icon for the intent type
}

const INTENT_ICONS: Record<IntentType, string> = {
  attack:  '\u2694',  // ⚔ crossed swords
  block:   '\u{1F6E1}', // 🛡 shield
  buff:    '\u2B06',  // ⬆ up arrow
  debuff:  '\u2B07',  // ⬇ down arrow
  mixed:   '\u26A1',  // ⚡ lightning
  unknown: '\u2753',  // ❓ question mark
};

/**
 * Parse the intent type from an action description string.
 * Checks for keywords to categorise the action.
 */
function parseIntentType(text: string): IntentType {
  const lower = text.toLowerCase();

  const hasAttack = lower.includes('deal') && lower.includes('damage');
  const hasBlock  = lower.includes('gain') && lower.includes('block');
  const hasBuff   = (lower.includes('gain') && lower.includes('strength')) ||
                    (lower.includes('gain') && lower.includes('ritual')) ||
                    (lower.includes('gain') && lower.includes('metallicize')) ||
                    (lower.includes('gain') && lower.includes('thorns'));
  const hasDebuff = lower.includes('apply') && (
    lower.includes('vulnerable') || lower.includes('weak') || lower.includes('poison')
  );

  const activeCount = [hasAttack, hasBlock, hasBuff, hasDebuff].filter(Boolean).length;

  if (activeCount > 1) return 'mixed';
  if (hasAttack)  return 'attack';
  if (hasBlock)   return 'block';
  if (hasBuff)    return 'buff';
  if (hasDebuff)  return 'debuff';
  return 'unknown';
}

/**
 * Parse a compact summary from an action description.
 *
 * Examples:
 *   "Deal 3 damage." -> "3 dmg"
 *   "Gain 5 Block."  -> "5 blk"
 *   "Apply 2 Vulnerable." -> "2 Vuln"
 *   "Deal 3 damage. Gain 1 Strength." -> "3 dmg + 1 Str"
 */
function parseSummary(text: string): string {
  const parts: string[] = [];

  // Deal X damage
  const damageMatch = text.match(/[Dd]eal (\d+) damage/);
  if (damageMatch) parts.push(`${damageMatch[1]} dmg`);

  // Gain X Block
  const blockMatch = text.match(/[Gg]ain (\d+) [Bb]lock/);
  if (blockMatch) parts.push(`${blockMatch[1]} blk`);

  // Gain X Strength
  const strengthMatch = text.match(/[Gg]ain (\d+) [Ss]trength/);
  if (strengthMatch) parts.push(`${strengthMatch[1]} Str`);

  // Apply X Vulnerable
  const vulnMatch = text.match(/[Aa]pply (\d+) [Vv]ulnerable/);
  if (vulnMatch) parts.push(`${vulnMatch[1]} Vuln`);

  // Apply X Weak
  const weakMatch = text.match(/[Aa]pply (\d+) [Ww]eak/);
  if (weakMatch) parts.push(`${weakMatch[1]} Weak`);

  // Apply X Poison
  const poisonMatch = text.match(/[Aa]pply (\d+) [Pp]oison/);
  if (poisonMatch) parts.push(`${poisonMatch[1]} Psn`);

  // Gain X Ritual
  const ritualMatch = text.match(/[Gg]ain (\d+) [Rr]itual/);
  if (ritualMatch) parts.push(`${ritualMatch[1]} Ritual`);

  // Gain X Metallicize
  const metallicizeMatch = text.match(/[Gg]ain (\d+) [Mm]etallicize/);
  if (metallicizeMatch) parts.push(`${metallicizeMatch[1]} Metal`);

  // Gain X Thorns
  const thornsMatch = text.match(/[Gg]ain (\d+) [Tt]horns/);
  if (thornsMatch) parts.push(`${thornsMatch[1]} Thorns`);

  if (parts.length === 0) {
    // Fallback: truncate raw text if it's too long
    return text.length > 20 ? text.slice(0, 18) + '…' : text;
  }

  return parts.join(' + ');
}

/**
 * Resolve the current intent for an enemy given its ID, cube position, and die result.
 *
 * - single-pattern enemies always show their one action description
 * - die-pattern enemies look up the action by dieResult key
 * - cube-pattern enemies look up the action at slots[cubePosition]
 */
export function getEnemyIntent(
  enemyId: string,
  cubePosition: number,
  dieResult: number | null,
): IntentInfo {
  const enemy = getEnemyOrPlaceholder(enemyId);
  const { pattern } = enemy;

  let rawText: string;

  switch (pattern.kind) {
    case 'single': {
      rawText = pattern.description;
      break;
    }
    case 'die': {
      if (dieResult === null) {
        return {
          type: 'unknown',
          text: 'Waiting for die',
          summary: 'Waiting…',
          icon: INTENT_ICONS.unknown,
        };
      }
      rawText = pattern.actions[String(dieResult)] ?? pattern.description;
      break;
    }
    case 'cube': {
      const slot = pattern.slots[cubePosition];
      rawText = slot?.text ?? pattern.description;
      break;
    }
    default: {
      rawText = '???';
    }
  }

  const type = parseIntentType(rawText);

  return {
    type,
    text: rawText,
    summary: parseSummary(rawText),
    icon: INTENT_ICONS[type],
  };
}
