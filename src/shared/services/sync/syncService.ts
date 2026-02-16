/**
 * CaStar — Sync Service (stub)
 * Will handle offline-first synchronization when backend is ready.
 *
 * Architecture:
 * 1. All write operations go to local SQLite first
 * 2. Changes are queued in sync_queue table
 * 3. When online, queue items are sent to the server
 * 4. Server responses update local records with remote_id
 * 5. Conflicts resolved via last-write-wins
 */

export class SyncService {
  private isOnline = true;

  setOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.processQueue();
    }
  }

  async queueChange(tableName: string, recordId: string, action: 'create' | 'update' | 'delete', data: unknown) {
    // TODO: Insert into sync_queue table when DB is connected
    console.log(`[Sync] Queued ${action} for ${tableName}:${recordId}`);
  }

  async processQueue() {
    if (!this.isOnline) return;
    // TODO: Process sync_queue items when backend is ready
    console.log('[Sync] Processing queue...');
  }
}

export const syncService = new SyncService();
