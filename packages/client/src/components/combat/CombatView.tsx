import { createSignal, Show } from 'solid-js';
import type { ClientMessage } from '@slay-online/shared';
import type { AppState } from '../../stores/gameStore.ts';
import { getCard } from '../../utils/cardLookup.ts';
import { EnemyZone } from './EnemyZone.tsx';
import { SharedInfo } from './SharedInfo.tsx';
import { PlayerBoard } from './PlayerBoard.tsx';
import { TeamSidebar } from './TeamSidebar.tsx';
import { CombatLog } from './CombatLog.tsx';
import { CombatEnd } from './CombatEnd.tsx';
import { ChatPanel } from '../chat/ChatPanel.tsx';
import type { EnemyCombatInfo } from './EnemyCard.tsx';
import styles from './CombatView.module.css';

export interface CombatViewProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
  onReturnToLobby: () => void;
}

export function CombatView(props: CombatViewProps) {
  const [selectedCard, setSelectedCard] = createSignal<string | null>(null);

  const game = () => props.state.game;

  // Extract enemy combat states from the server's CombatGameState
  // The server sends CombatGameState which extends GameState with enemyCombatStates
  const enemyCombatStates = (): Record<string, EnemyCombatInfo> => {
    const g = game();
    if (!g) return {};
    // The server broadcasts CombatGameState which includes enemyCombatStates
    // Access it via type assertion since GameState schema doesn't declare it
    return (g as Record<string, unknown>)['enemyCombatStates'] as Record<string, EnemyCombatInfo> ?? {};
  };

  function handleCardSelected(cardId: string | null) {
    if (cardId === null) {
      setSelectedCard(null);
      return;
    }

    // For non-targeted cards (Skills, Powers), auto-play immediately
    const card = getCard(cardId);
    if (card && card.type !== 'Attack') {
      props.send({ type: 'PLAY_CARD', cardId });
      setSelectedCard(null);
      return;
    }

    // For Attack cards, select and wait for target click
    setSelectedCard(cardId);
  }

  function handleEnemyClick(enemyId: string) {
    const card = selectedCard();
    if (card) {
      props.send({ type: 'PLAY_CARD', cardId: card, targetIds: [enemyId] });
      setSelectedCard(null);
    }
  }

  function handleChatSend(text: string) {
    props.send({ type: 'SEND_CHAT', text });
  }

  const playerTurnStatuses = () =>
    (game()?.players ?? []).map((p) => ({
      id: p.id,
      nickname: p.nickname,
      endedTurn: p.endedTurn,
    }));

  return (
    <Show when={game()}>
      {(g) => (
        <div class={styles.combatView}>
          {/* Top: Enemy Zone */}
          <div class={styles.enemies}>
            <EnemyZone
              activeEnemies={g().activeEnemies}
              enemyCombatStates={enemyCombatStates()}
              selectedCard={selectedCard()}
              onEnemyClick={handleEnemyClick}
              dieResult={g().dieResult}
            />
          </div>

          {/* Middle: Shared Info */}
          <div class={styles.shared}>
            <SharedInfo
              dieResult={g().dieResult}
              phase={g().phase}
              round={g().round}
              players={playerTurnStatuses()}
            />
          </div>

          {/* Center: Player Board */}
          <div class={styles.board}>
            <PlayerBoard
              state={props.state}
              send={props.send}
              onCardSelected={handleCardSelected}
            />
          </div>

          {/* Right: Team Sidebar */}
          <div class={styles.sidebar}>
            <TeamSidebar
              players={g().players}
              myPlayerId={props.state.playerId}
            />
          </div>

          {/* Bottom-left: Combat Log */}
          <div class={styles.logArea}>
            <CombatLog entries={g().combatLog} />
          </div>

          {/* Bottom-right: Chat */}
          <div class={styles.chatArea}>
            <ChatPanel
              messages={props.state.chatMessages}
              onSend={handleChatSend}
            />
          </div>

          {/* Overlay: Combat End */}
          <CombatEnd
            gameState={g()}
            onReturnToLobby={props.onReturnToLobby}
          />
        </div>
      )}
    </Show>
  );
}
