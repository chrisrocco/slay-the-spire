import { For, Show, createEffect, createSignal, onMount } from 'solid-js';
import type { ChatMessage } from '../../stores/gameStore.ts';
import styles from './ChatPanel.module.css';

export interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

export function ChatPanel(props: ChatPanelProps) {
  const [inputText, setInputText] = createSignal('');
  let messagesRef: HTMLDivElement | undefined;

  // Auto-scroll to bottom on new messages
  createEffect(() => {
    const _len = props.messages.length;
    void _len;
    if (messagesRef) {
      messagesRef.scrollTop = messagesRef.scrollHeight;
    }
  });

  onMount(() => {
    if (messagesRef) {
      messagesRef.scrollTop = messagesRef.scrollHeight;
    }
  });

  function handleSend() {
    const text = inputText().trim();
    if (text.length === 0) return;
    props.onSend(text);
    setInputText('');
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div class={styles.chatPanel}>
      <div class={styles.header}>Chat</div>
      <div class={styles.messages} ref={messagesRef}>
        <Show
          when={props.messages.length > 0}
          fallback={<div class={styles.empty}>No messages yet</div>}
        >
          <For each={props.messages}>
            {(msg) => (
              <div class={styles.message}>
                <span class={styles.nickname}>{msg.nickname}:</span>
                {msg.text}
              </div>
            )}
          </For>
        </Show>
      </div>
      <div class={styles.inputRow}>
        <input
          class={styles.input}
          type="text"
          placeholder="Type a message..."
          value={inputText()}
          onInput={(e) => setInputText(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <button class={styles.sendButton} onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
