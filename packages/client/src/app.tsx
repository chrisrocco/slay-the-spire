import { onMount, Show } from 'solid-js';
import { createGameConnection } from './services/websocket.ts';
import { createAppStore, handleServerMessage } from './stores/gameStore.ts';
import themeStyles from './styles/variables.module.css';
import styles from './app.module.css';

export function App() {
  const store = createAppStore();
  const serverUrl = import.meta.env.DEV ? 'ws://localhost:8080' : `ws://${window.location.host}`;
  const connection = createGameConnection(serverUrl);

  onMount(() => {
    connection.onMessage((msg) => handleServerMessage(store, msg));
    connection.connect();
  });

  return (
    <div class={`${themeStyles.theme} ${styles.app}`}>
      {/* Error banner */}
      <Show when={store.state.error}>
        <div class={styles.errorBanner}>
          <span>{store.state.error}</span>
          <button class={styles.errorDismiss} onClick={() => store.setError(null)}>
            Dismiss
          </button>
        </div>
      </Show>

      {/* Main content based on phase */}
      <Show when={store.state.phase === 'connecting'}>
        <div class={styles.connecting}>
          <div class={styles.connectingTitle}>Slay the Spire Online</div>
          <div class={styles.spinner} />
          <div class={styles.connectingText}>Connecting to server...</div>
        </div>
      </Show>

      <Show when={store.state.phase === 'lobby'}>
        <div class={styles.lobby}>
          <div class={styles.lobbyTitle}>Lobby</div>
          <div>Room: {store.state.roomCode ?? 'Waiting for room...'}</div>
          <div>Lobby UI — Phase 3</div>
        </div>
      </Show>

      <Show when={store.state.phase === 'combat'}>
        <div>Combat View — loading...</div>
      </Show>
    </div>
  );
}
