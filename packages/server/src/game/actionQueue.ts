/**
 * Per-room FIFO action serializer.
 * Ensures game actions process sequentially to prevent race conditions
 * when multiple players send messages simultaneously.
 */
export class ActionQueue {
  private processing = false;
  private queue: Array<() => void> = [];

  /**
   * Enqueue an action for sequential processing.
   * If no action is currently processing, executes immediately.
   */
  enqueue(fn: () => void): void {
    this.queue.push(fn);
    if (!this.processing) {
      this.processNext();
    }
  }

  private processNext(): void {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const fn = this.queue.shift()!;
    try {
      fn();
    } finally {
      this.processNext();
    }
  }

  /**
   * Number of actions waiting in the queue.
   */
  get pending(): number {
    return this.queue.length;
  }
}
