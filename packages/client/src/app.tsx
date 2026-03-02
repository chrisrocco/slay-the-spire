import { createEffect, onMount, Show } from 'solid-js';
import { createGameConnection } from './services/websocket.ts';
import { createAppStore, handleServerMessage } from './stores/gameStore.ts';
import { CombatView } from './components/combat/CombatView.tsx';
import { MapView } from './components/map/MapView.tsx';
import { EventView } from './components/rooms/EventView.tsx';
import { CampfireView } from './components/rooms/CampfireView.tsx';
import { TreasureView } from './components/rooms/TreasureView.tsx';
import { MerchantView } from './components/rooms/MerchantView.tsx';
import { RewardView } from './components/rewards/RewardView.tsx';
import { BossRelicView } from './components/rewards/BossRelicView.tsx';
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

  createEffect(() => {
    if (connection.connected()) {
      if (store.state.phase === 'connecting') {
        store.setPhase('lobby');
      }
    } else {
      // Revert to connecting only if not currently in a game
      if (store.state.phase !== 'game') {
        store.setPhase('connecting');
      }
    }
  });

  function handleReturnToLobby() {
    // Simple approach: reload the page to reset everything
    window.location.reload();
  }

  const gamePhase = () => store.state.game?.gamePhase;

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

      {/* Game views - routed by gamePhase */}
      <Show when={store.state.phase === 'game' && store.state.game}>
        <>
          {/* MAP phase */}
          <Show when={gamePhase() === 'MAP'}>
            <MapView
              state={store.state}
              send={connection.send}
            />
          </Show>

          {/* COMBAT phase with map toggle */}
          <Show when={gamePhase() === 'COMBAT'}>
            <div class={styles.combatWrapper}>
              <CombatView
                state={store.state}
                send={connection.send}
                onReturnToLobby={handleReturnToLobby}
              />
              {/* Map toggle button */}
              <button
                class={styles.mapToggleButton}
                onClick={() => store.toggleMap()}
                title="Toggle Map"
                aria-label="Toggle map view"
              >
                Map
              </button>
              {/* Map overlay (read-only) */}
              <Show when={store.state.mapVisible}>
                <div class={styles.mapOverlay}>
                  <MapView
                    state={store.state}
                    send={connection.send}
                    readOnly
                    onClose={() => store.toggleMap()}
                  />
                </div>
              </Show>
            </div>
          </Show>

          {/* EVENT phase */}
          <Show when={gamePhase() === 'EVENT'}>
            <div class={styles.roomWrapper}>
              <EventView
                state={store.state}
                send={connection.send}
              />
            </div>
          </Show>

          {/* CAMPFIRE phase */}
          <Show when={gamePhase() === 'CAMPFIRE'}>
            <div class={styles.roomWrapper}>
              <CampfireView
                state={store.state}
                send={connection.send}
              />
            </div>
          </Show>

          {/* TREASURE phase */}
          <Show when={gamePhase() === 'TREASURE'}>
            <div class={styles.roomWrapper}>
              <TreasureView state={store.state} />
            </div>
          </Show>

          {/* MERCHANT phase */}
          <Show when={gamePhase() === 'MERCHANT'}>
            <div class={styles.roomWrapper}>
              <MerchantView
                state={store.state}
                send={connection.send}
              />
            </div>
          </Show>

          {/* REWARDS phase */}
          <Show when={gamePhase() === 'REWARDS'}>
            <RewardView
              state={store.state}
              send={connection.send}
            />
          </Show>

          {/* BOSS_REWARD phase */}
          <Show when={gamePhase() === 'BOSS_REWARD'}>
            <BossRelicView
              state={store.state}
              send={connection.send}
            />
          </Show>
        </>
      </Show>
    </div>
  );
}
