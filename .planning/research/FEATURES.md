# Feature Research

**Domain:** Online multiplayer board/card game web application (cooperative, lobby-based)
**Researched:** 2026-03-01
**Confidence:** MEDIUM — based on analysis of BGA, TTS, Tabletopia, BuddyBoardGames, and the existing STS:TBG TTS mod. Core findings are consistent across multiple sources. Game-specific UX patterns drawn from community evidence.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Room code / invite link | Every "play with friends" web game uses this. BuddyBoardGames, Skribbl.io, Spyfall, PlayingCards.io all follow this pattern. Without it, "playing with friends" is broken. | LOW | Generate short alphanumeric code on room create; share URL also acceptable. 6-char code is convention. |
| No account required to join | BuddyBoardGames, Tabletopia guest mode, Skribbl.io — the pattern is "create room with nickname, share code." Requiring sign-up before playing kills conversion. | LOW | Host may pick a name; joiners enter name + code. Session cookie handles identity. |
| Player name display | All players need to see who is who at all times. "Player 1" is disorienting. | LOW | Set at lobby join, displayed on player board. |
| Real-time game state sync | Cards played, HP changed, tokens moved — all players see immediately. Anything less and the game is unplayable. | HIGH | WebSocket broadcast of state deltas. All moves visible to all players in real time. |
| Visual player boards | Each player needs a visible workspace: hand, energy, HP, block, discard pile count. The TTS mod community specifically noted needing better hand/board proximity. | HIGH | Per-player section of the UI. Core game canvas. |
| Card tooltip / text on hover or tap | Players cannot memorize 85+ cards per character. BGA shows card text on hover; TTS mod requires physical card inspection. Tooltip/click-to-enlarge is the expected solution. | MEDIUM | Show full card text including keywords. For a board game faithful to rules, this is critical for play. |
| In-game text chat | Without voice (out of scope) text chat is the only communication channel. Competitive analysis: TTS has chat, BGA has chat, every co-op online game platform has chat. | MEDIUM | Real-time chat panel visible during play. Floating emoji or quick emote reactions are optional enhancement. |
| "End Turn" / "Ready" signal | Simultaneous turns require each player to signal readiness. All players must confirm before enemy phase resolves. | MEDIUM | Per-player ready button with visual indicator showing who has/hasn't ended turn. Enemy phase auto-triggers when all players signal ready. |
| Turn/phase indicators | Players must know what phase the game is in (player turns, enemy resolution, reward, event, etc.). Without this, players are confused about what they can do. | MEDIUM | Global phase indicator. Current phase visible to all. |
| Waiting/loading states | Between phases (enemy resolution, card reward draws), UI must communicate the game is computing, not frozen. | LOW | Spinner or status message during server-side resolution. |
| Disconnect detection and rejoin | Network drops happen. If a disconnected player cannot rejoin, the session is ruined for all players. The TTS mod community mentioned this as a problem even with TTS infrastructure. | HIGH | Preserve game state in memory keyed by room code. Reconnecting client gets full state on re-join. Grace period before marking player as disconnected. |
| Game action log / event feed | BGA has a move log. boardgame.io highlights time-travel logs as a key feature. Co-op players need to review: "what did that card do?", "why did enemy attack for X?". | MEDIUM | Scrollable log showing card plays, damage events, status effects applied. Persistent for session. |
| Win / lose state resolution | Clear visual win screen or game-over screen with reason. Without it, players don't know if the session is over. | LOW | Modal or overlay stating outcome. Option to return to lobby. |
| Shared game components visible to all | Die result, enemy intent, boss HP, map state — anything the physical board would show all players must be visible to all players. | HIGH | Single shared canvas area showing communal game state. |

### Differentiators (Competitive Advantage)

Features that set this product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Rules-enforced automated play | BGA enforces rules; TTS does not. The STS:TBG TTS mod is the current benchmark and it requires players to self-enforce most rules. A rules-enforced implementation eliminates rule disputes, catches illegal plays, and lowers the learning curve for new players. | HIGH | This is the single biggest differentiator vs. the TTS mod. Every game action validated server-side before applying. |
| Automated enemy AI execution | TTS mod requires players to manually move enemy cards, resolve actions, count damage. Automated enemy AI that resolves per the rules (single/die/cube actions, row targeting, summons) is a major quality-of-life upgrade. | HIGH | Enemy resolution logic runs server-side after all players end turn. Animates result client-side. |
| Automated die rolling | TTS mod community specifically called out "necessity of moving dice around manually" as slow and clunky. A digital die roll with visible result broadcast to all players removes this friction. | LOW | Server-side RNG, result displayed prominently to all players. Animated roll optional but appreciated. |
| Automated status token tracking | Physical tokens cap at board game limits (Strength 8, Poison 30, Block 20, etc.). Automation removes counting errors and token fumbling. | MEDIUM | Server tracks token counts. UI renders current values. Enforces caps. |
| Card hand visible to teammates | In the STS board game, players can freely share hand information. The TTS mod has a community workaround (clicking to join "team hearts" to share hand info). Native hand visibility to teammates without a workaround is a QoL win. | MEDIUM | Per-player toggle: "share hand with team" — all teammates see your cards. Default ON for cooperative play. |
| Integrated optional rules toggle | "Last Stand" and "Choose Your Relic" are defined optional rules. Pre-game lobby allows enabling/disabling these without the host having to explain them verbally. | LOW | Lobby settings checkboxes. Rules description shown on hover. State passed to game engine on start. |
| Visual map navigation | The Act 1 map with node types (encounter, elite, boss, event, campfire, treasure, merchant) displayed visually. Players vote or agree on which path to take. | HIGH | Interactive map component. Current position shown. Available paths highlighted. |
| Animated card effects | Card plays, damage, status applications with light animation provide feedback that sells the impact of actions (BGA and digital card games universally use this). | MEDIUM | CSS transitions / GSAP for card play, damage number pop-ups, status icons appearing. |
| Character-specific UI regions | Defect's orb slots, Watcher's stance indicator, Silent's shiv count — surfaced as part of each player's board section rather than buried in card text. | MEDIUM | Character-aware player board component rendering specific UI slots per character. |
| Reward phase UI | After combat, structured reward screen: choose card reward, see gold, pick relic, manage potions. TTS mod requires players to manually search reward deck. Structured UI removes ambiguity. | HIGH | Phase-specific UI overlay. Deck browsing for card choice. Relic reveal for "Choose Your Relic" optional rule. |
| Keyboard shortcuts / accessibility | Power users want to play card by pressing a key, not clicking. Accessibility benefits players with motor limitations. | MEDIUM | Assignable hotkeys for common actions (end turn, play selected card). Deferred to post-MVP. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create real problems for this project's scope and goals.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Undo / take-back moves | Players make mistakes; physical games allow "oops I meant to play that other card." BGA even has documented undo policy. | In simultaneous play, an undo by one player potentially invalidates another player's already-committed action. Creates race conditions, complex state rewind logic, and conflict between players. BGA's own policy says undo must never make another player redo moves — which is nearly impossible in simultaneous turns. | Clear card preview before play. Confirmation dialog for irreversible actions (e.g., exhaust a card, remove from deck). |
| Persistent accounts / profiles / stats | Players want to track their progress, win rates, etc. | Full auth system (passwords, sessions, account recovery) is significant scope creep for v1. The target audience is friends playing together — they know who they are. | Session-scoped nickname. Post-MVP: optional lightweight account (OAuth only, no passwords). |
| Asynchronous / turn-based "play later" mode | BGA supports async turns so games can span days. Would appeal to players who can't coordinate schedules. | Requires persistent storage (database), notification system (email/push), long-lived session management. Fundamentally different architecture from in-memory real-time. Out of scope for v1. | Real-time play is the core experience. Friends scheduling a session is the intended UX. |
| Spectator mode | Allow non-players to watch an ongoing game. | Requires separate permission tier in room management, careful information hiding (don't show private hand cards to spectators), non-trivial WebSocket connection management. Medium complexity for marginal v1 value. | Share screen externally (Discord, etc.). Room code can be shared post-game if replay is desired. Post-MVP consideration. |
| Matchmaking / public lobbies | Let strangers join games looking for players. | The game is a cooperative game with complex rules targeting friends who own the board game. Random matchmaking with strangers who don't know the rules produces miserable sessions. | Lobby codes for friend groups only. Public matchmaking is a v2+ feature if user research validates demand. |
| Save and resume / persistent game state | Players want to save mid-game and come back later. | Database requirement, session expiry handling, save slot management, partial game state validation. Significant complexity increase. Explicitly out of scope per PROJECT.md. | Sessions are single-sitting. The game is 60-120 minutes — a reasonable single-session commitment. |
| Mobile-first touch UX | Expanding the addressable market to phone players. | Card games with complex interactions require larger tap targets, different layout hierarchy, and responsive design trade-offs that conflict with desktop-first information density. Adds significant design and testing scope. | Desktop/laptop web browser is the primary target. Responsive enough to not break on tablet, but not optimized for phone. |
| Voice chat integration | Players want to talk while playing (the physical table experience). | WebRTC voice integration is a substantial separate engineering domain. Latency, browser permission flows, echo cancellation — none of this is trivial. | Explicitly out of scope per PROJECT.md. Players use Discord/phone. |
| Full card animations (elaborate) | Players want Hearthstone-style attack sequences and card effects. | High animation budget competes with development time for game logic correctness. A faithful rules implementation is more valuable than flashy animations. | Lightweight feedback animations (damage pop, status flash) for functional feedback. No elaborate sequences. |

---

## Feature Dependencies

```
[Room code / invite link]
    └──requires──> [No account required (nickname only)]
                       └──enables──> [Player name display]

[Real-time game state sync] (WebSocket infrastructure)
    └──required by──> [End Turn / Ready signal]
    └──required by──> [Action log / event feed]
    └──required by──> [Disconnect detection and rejoin]
    └──required by──> [Shared game components visible to all]
    └──required by──> [In-game text chat]

[Visual player boards]
    └──requires──> [Real-time game state sync]
    └──required by──> [Character-specific UI regions]
    └──required by──> [Card hand visible to teammates]

[Card tooltip / text on hover]
    └──requires──> [Card data structured (extracted from reference images)]

[Automated enemy AI execution]
    └──requires──> [End Turn / Ready signal] (enemy resolves after all players ready)
    └──requires──> [Automated die rolling] (many enemy actions are die-dependent)
    └──required by──> [Status token tracking automation]

[Visual map navigation]
    └──requires──> [Win / lose state per combat] (map only advances after combat resolution)
    └──required by──> [Reward phase UI]

[Rules-enforced automated play]
    └──requires──> [Full card data] (validation requires knowing what each card does)
    └──requires──> [Real-time game state sync]
    └──requires──> [Automated enemy AI execution]

[Optional rules toggle] ──enhances──> [Room code / invite link / lobby]

[Animated card effects] ──enhances──> [Visual player boards]
```

### Dependency Notes

- **Card data extraction must precede game logic implementation:** Without structured card data (name, cost, effects, keywords), no validation, tooltip, or reward phase logic can function. This is a day-zero prerequisite.
- **WebSocket infrastructure gates almost everything:** Real-time sync is the spine. Every interactive feature depends on it. Build this before any game feature.
- **End Turn signal requires enemy AI:** The ready signal only makes sense if something happens when all players are ready. Enemy resolution must be implemented together with the ready signal, not deferred.
- **Reward phase conflicts with map navigation until combat is resolved:** These are sequential — combat must fully close before map state can be updated. Design the phase state machine upfront to avoid wiring conflicts.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what a group of friends needs to play a full Act 1 session online.

- [ ] Room code creation and invite link — friends can find each other
- [ ] Nickname-only join (no account) — zero friction entry
- [ ] Character selection in lobby — 4 characters available
- [ ] Optional rules toggles in lobby (Last Stand, Choose Your Relic)
- [ ] Real-time WebSocket sync of all game state
- [ ] Shared die rolling with result broadcast to all players
- [ ] Visual player boards: hand, energy, HP, block, discard count
- [ ] Card tooltip showing full card text on hover/tap
- [ ] Card play, discard, exhaust, retain mechanics enforced server-side
- [ ] End Turn ready signal with visual indicator of who is waiting
- [ ] Automated enemy AI resolution (single/die/cube actions, row targeting)
- [ ] Automated status token tracking with board game caps enforced
- [ ] In-game text chat
- [ ] Action log / event feed (what happened this turn)
- [ ] Visual map with node types, current position, available paths
- [ ] All room types (encounter, elite, boss, event, campfire, treasure, merchant)
- [ ] Reward phase UI (card choice, gold, relics, potions)
- [ ] Win / lose state detection and display
- [ ] Disconnect grace period + rejoin to running game

### Add After Validation (v1.x)

Features to add once core is working and players have played sessions.

- [ ] Animated card effects (damage pop-ups, status flashes) — functional first, polish second
- [ ] Character-specific UI regions (orb slots, stance indicator, shiv tracker) — surfaced in initial testing
- [ ] Card hand visibility to teammates toggle — QoL, informed by actual play sessions
- [ ] Keyboard shortcuts for end turn and card play — power user request expected

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Persistent accounts / win tracking — requires auth infrastructure
- [ ] Acts 2, 3, 4 — explicitly out of scope for v1
- [ ] Ascension system — meta-progression layer
- [ ] Spectator mode — non-trivial permission scoping
- [ ] Mobile-optimized layout — separate design effort
- [ ] Asynchronous play — requires persistent storage + notification system

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Room code + nickname join | HIGH | LOW | P1 |
| Real-time WebSocket sync | HIGH | HIGH | P1 |
| Visual player boards | HIGH | HIGH | P1 |
| Card tooltip / text | HIGH | MEDIUM | P1 |
| End Turn / Ready signal | HIGH | MEDIUM | P1 |
| Automated enemy AI | HIGH | HIGH | P1 |
| Automated die rolling | HIGH | LOW | P1 |
| Status token tracking | HIGH | MEDIUM | P1 |
| In-game text chat | HIGH | MEDIUM | P1 |
| Win / lose detection | HIGH | LOW | P1 |
| Disconnect + rejoin | HIGH | HIGH | P1 |
| Visual map navigation | HIGH | HIGH | P1 |
| Reward phase UI | HIGH | HIGH | P1 |
| Action log / event feed | MEDIUM | MEDIUM | P1 |
| Optional rules toggles | MEDIUM | LOW | P1 |
| Animated card effects | MEDIUM | MEDIUM | P2 |
| Character-specific UI | MEDIUM | MEDIUM | P2 |
| Hand visibility toggle | MEDIUM | LOW | P2 |
| Keyboard shortcuts | LOW | MEDIUM | P3 |
| Spectator mode | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — game is unplayable or confusing without it
- P2: Should have — adds polish and reduces friction, add in first iteration after core is playable
- P3: Nice to have — future consideration, defer

---

## Competitor Feature Analysis

The most relevant comparisons are the platforms people currently use to play STS:TBG online.

| Feature | TTS + Official Mod (current benchmark) | Board Game Arena (BGA) | Our Approach |
|---------|----------------------------------------|------------------------|--------------|
| Rule enforcement | None — players self-enforce | Full enforcement for all games | Full server-side enforcement — primary differentiator |
| Enemy AI | Manual — players move enemy cards | Fully automated | Fully automated — eliminates the biggest TTS pain point |
| Die rolling | Manual — physically move dice widget | Automated | Automated with visible result broadcast |
| Status tokens | Manual counting, physical tokens | Automated | Automated with caps enforced |
| Account required | Steam account (TTS purchase required) | Account required | No account — nickname only |
| Lobby / invite | TTS Steam invite or lobby code | Account-linked room | Room code + shareable URL |
| Chat | Built into TTS | Yes | Yes |
| Card tooltip | Zoom on physical card image | Full card text on hover | Full card text on hover/tap |
| Reconnect | Depends on TTS session persistence | Graceful rejoin | Explicit rejoin by room code during session |
| Map navigation | Manual token placement | Automated per game | Interactive map with automated state |
| Reward handling | Manual deck search | Automated reveal | Structured reward phase UI |
| Hand visibility | Workaround (join team hearts script) | Per-game rule | Native teammate hand sharing toggle |
| Optional rules | Must communicate verbally or in chat | Game-specific toggles | Lobby checkboxes with rule descriptions |
| Platform cost | Requires TTS (~$20 USD) | Free tier / $42/yr Premium | Free (web, no download) |

---

## Sources

- [Board Game Arena](https://en.boardgamearena.com/) — feature analysis of live platform (chat, game log, undo policy, turn-based/real-time modes)
- [BGA Undo Policy](https://en.boardgamearena.com/doc/BGA_Undo_policy) — authoritative source on why undo is an anti-feature for simultaneous multiplayer. MEDIUM confidence.
- [BGA 2025 Year in Review](https://en.boardgamearena.com/news?id=1025) — current state of BGA features including tournament UI, cross-platform. MEDIUM confidence.
- [BuddyBoardGames](https://buddyboardgames.com/) — no-signup, room-code pattern as table stakes example. MEDIUM confidence.
- [Tabletopia FAQ](https://help.tabletopia.com/faq/) — guest play, no-account join pattern. MEDIUM confidence.
- [STS:TBG TTS Official Mod](https://steamcommunity.com/sharedfiles/filedetails/?id=2884027954) — current benchmark; user pain points inform differentiators. MEDIUM confidence.
- [STS:TBG TTS Improvements Mod](https://steamcommunity.com/sharedfiles/filedetails/?id=2916329543) — community workarounds (hand sharing, die automation) confirm pain points. MEDIUM confidence.
- [boardgame.io GitHub](https://github.com/boardgameio/boardgame.io) — game log / time-travel as standard feature in open-source game engine. MEDIUM confidence.
- [Ably WebSocket Architecture Best Practices](https://ably.com/topic/websocket-architecture-best-practices) — reconnection, session resume, heartbeat patterns. MEDIUM confidence.
- [Platform comparison: Tabletopia vs TTS vs BGA](https://kick.agency/news/online-board-games-4-best-places-to-play/) — feature set comparison across platforms. LOW confidence (single source).
- [Card game UI design lessons](https://medium.com/@acbassettone/5-ux-ui-lessons-from-designing-a-card-game-b689d3f3187) — tooltip, keyword consistency, feedback animation as table stakes for card UIs. LOW confidence (single source).
- [Cooperative game design: dominant player problem](https://boardgamedesigncourse.com/how-to-create-an-amazing-co-op-game/) — action log value in co-op to prevent alpha-player dominance. LOW confidence (single source).

---
*Feature research for: online multiplayer board/card game — Slay the Spire board game web adaptation*
*Researched: 2026-03-01*
