// TODO: Filled in by Plan 07 — Act 1 event cards from rulebook

export interface EventChoice {
  text: string;
  effect: string;
}

export interface EventCard {
  id: string;
  name: string;
  text: string;
  choices: EventChoice[];
}

export const events: readonly EventCard[] = [];

export const eventMap: Record<string, EventCard> = Object.fromEntries(
  events.map(e => [e.id, e])
);
