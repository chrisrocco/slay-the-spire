import { createSignal } from 'solid-js';
import type { ClientMessage, ServerMessage } from '@slay-online/shared';

export interface GameConnection {
  connect: () => void;
  disconnect: () => void;
  send: (msg: ClientMessage) => void;
  onMessage: (handler: (msg: ServerMessage) => void) => void;
  connected: () => boolean;
}

/**
 * Create a WebSocket connection to the game server.
 * Handles auto-reconnection with 2-second delay.
 */
export function createGameConnection(url: string): GameConnection {
  const [connected, setConnected] = createSignal(false);
  let ws: WebSocket | null = null;
  let messageHandler: ((msg: ServerMessage) => void) | null = null;
  let shouldReconnect = true;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    shouldReconnect = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    try {
      ws = new WebSocket(url);
    } catch {
      // Connection failed, schedule reconnect
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onclose = () => {
      setConnected(false);
      ws = null;
      if (shouldReconnect) {
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      // Error will trigger onclose, which handles reconnection
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        messageHandler?.(msg);
      } catch {
        console.error('Failed to parse server message');
      }
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (shouldReconnect) {
        connect();
      }
    }, 2000);
  }

  function disconnect() {
    shouldReconnect = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
    setConnected(false);
  }

  function send(msg: ClientMessage) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function onMessage(handler: (msg: ServerMessage) => void) {
    messageHandler = handler;
  }

  return { connect, disconnect, send, onMessage, connected };
}
