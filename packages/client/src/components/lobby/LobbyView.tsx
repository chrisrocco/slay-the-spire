import { createSignal, For, Show } from 'solid-js';
import type { AppState } from '../../stores/gameStore.ts';
import type { ClientMessage } from '@slay-online/shared';
import styles from './LobbyView.module.css';

const CHARACTERS = ['ironclad', 'silent', 'defect', 'watcher'] as const;

interface LobbyViewProps {
  state: AppState;
  send: (msg: ClientMessage) => void;
}

export function LobbyView(props: LobbyViewProps) {
  const [nickname, setNickname] = createSignal('');
  const [joinCode, setJoinCode] = createSignal('');

  const inRoom = () => props.state.roomCode != null;
  const lobby = () => props.state.lobby;
  const myPlayer = () => lobby()?.players.find(p => p.id === props.state.playerId);
  const isHost = () => myPlayer()?.isHost ?? false;
  const myCharacter = () => myPlayer()?.character ?? null;

  function handleCreate() {
    const name = nickname().trim();
    if (!name) return;
    props.send({ type: 'CREATE_ROOM', nickname: name });
  }

  function handleJoin() {
    const name = nickname().trim();
    const code = joinCode().trim();
    if (!name || !code) return;
    props.send({ type: 'JOIN_LOBBY', roomCode: code, nickname: name });
  }

  function handleSelectCharacter(character: string) {
    props.send({ type: 'SELECT_CHARACTER', character });
  }

  function handleToggleRule(rule: 'lastStand' | 'chooseYourRelic') {
    props.send({ type: 'TOGGLE_RULE', rule });
  }

  function handleStart() {
    props.send({ type: 'START_GAME' });
  }

  const takenCharacters = () => {
    const players = lobby()?.players ?? [];
    return new Set(players.filter(p => p.id !== props.state.playerId && p.character).map(p => p.character));
  };

  const allReady = () => {
    const players = lobby()?.players ?? [];
    return players.length > 0 && players.every(p => p.character != null);
  };

  function handleKeyDown(e: KeyboardEvent, action: () => void) {
    if (e.key === 'Enter') action();
  }

  return (
    <div class={styles.lobby}>
      <div class={styles.title}>Slay the Spire Online</div>

      <Show when={!inRoom()}>
        <div class={styles.joinSection}>
          <div class={styles.inputGroup}>
            <input
              class={styles.input}
              type="text"
              placeholder="Nickname"
              value={nickname()}
              onInput={e => setNickname(e.currentTarget.value)}
              onKeyDown={e => handleKeyDown(e, handleCreate)}
              maxLength={20}
            />
            <button
              class={styles.btnPrimary}
              onClick={handleCreate}
              disabled={!nickname().trim()}
            >
              Create Room
            </button>
          </div>

          <div class={styles.divider}>or join an existing room</div>

          <div class={styles.inputGroup}>
            <input
              class={styles.input}
              type="text"
              placeholder="Room Code"
              value={joinCode()}
              onInput={e => setJoinCode(e.currentTarget.value.toUpperCase())}
              onKeyDown={e => handleKeyDown(e, handleJoin)}
              maxLength={6}
            />
            <button
              class={styles.btn}
              onClick={handleJoin}
              disabled={!nickname().trim() || !joinCode().trim()}
            >
              Join
            </button>
          </div>
        </div>
      </Show>

      <Show when={inRoom() && lobby()}>
        <div class={styles.roomInfo}>
          <div class={styles.roomLabel}>Room Code</div>
          <div class={styles.roomCode}>{props.state.roomCode}</div>
        </div>

        <div class={styles.players}>
          <For each={lobby()!.players}>
            {player => (
              <div class={styles.playerRow}>
                <div>
                  <span class={styles.playerName}>{player.nickname}</span>
                  <Show when={player.isHost}>
                    <span class={styles.hostBadge}>HOST</span>
                  </Show>
                </div>
                <span class={styles.playerCharacter}>
                  {player.character ?? 'choosing...'}
                </span>
              </div>
            )}
          </For>
        </div>

        <div class={styles.characterSection}>
          <div class={styles.sectionLabel}>Choose Character</div>
          <div class={styles.characters}>
            <For each={[...CHARACTERS]}>
              {character => {
                const selected = () => myCharacter() === character;
                const taken = () => takenCharacters().has(character);
                return (
                  <button
                    class={selected() ? styles.charBtnSelected : styles.charBtn}
                    onClick={() => handleSelectCharacter(character)}
                    disabled={taken()}
                    title={taken() ? 'Taken by another player' : character}
                  >
                    {character}
                  </button>
                );
              }}
            </For>
          </div>
        </div>

        <Show when={isHost()}>
          <div class={styles.rules}>
            <button
              class={lobby()!.optionalRules.lastStand ? styles.ruleToggleActive : styles.ruleToggle}
              onClick={() => handleToggleRule('lastStand')}
            >
              Last Stand
            </button>
            <button
              class={lobby()!.optionalRules.chooseYourRelic ? styles.ruleToggleActive : styles.ruleToggle}
              onClick={() => handleToggleRule('chooseYourRelic')}
            >
              Choose Your Relic
            </button>
          </div>

          <button
            class={styles.btnPrimary}
            onClick={handleStart}
            disabled={!allReady()}
          >
            Start Game
          </button>
        </Show>

        <Show when={!isHost()}>
          <div class={styles.sectionLabel}>
            {allReady() ? 'Waiting for host to start...' : 'Waiting for all players to pick...'}
          </div>
        </Show>
      </Show>
    </div>
  );
}
