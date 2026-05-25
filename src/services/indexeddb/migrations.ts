import type { IDBPDatabase } from 'idb'
import { STORES } from '@/services/indexeddb/schema'

export type MigrationFn = (db: IDBPDatabase) => void

function createMetaIfMissing(db: IDBPDatabase): void {
  if (!db.objectStoreNames.contains(STORES.meta)) {
    db.createObjectStore(STORES.meta)
  }
}

function migrateV10(db: IDBPDatabase): void {
  if (!db.objectStoreNames.contains(STORES.profiles)) {
    db.createObjectStore(STORES.profiles, { keyPath: 'id' })
  }
  if (!db.objectStoreNames.contains(STORES.auditLogs)) {
    const audit = db.createObjectStore(STORES.auditLogs, { keyPath: 'id' })
    audit.createIndex('by-created', 'createdAt')
  }
  if (!db.objectStoreNames.contains(STORES.securityLogs)) {
    const security = db.createObjectStore(STORES.securityLogs, { keyPath: 'id' })
    security.createIndex('by-created', 'createdAt')
  }
  if (!db.objectStoreNames.contains(STORES.userSessions)) {
    const sessions = db.createObjectStore(STORES.userSessions, { keyPath: 'id' })
    sessions.createIndex('by-user', 'userId')
  }
}

function migrateV12(db: IDBPDatabase): void {
  if (!db.objectStoreNames.contains(STORES.calendarSyncLinks)) {
    const links = db.createObjectStore(STORES.calendarSyncLinks, { keyPath: 'interventionId' })
    links.createIndex('by-google-event', 'googleEventId')
    links.createIndex('by-status', 'status')
  }
  if (!db.objectStoreNames.contains(STORES.googleCalendarQueue)) {
    const queue = db.createObjectStore(STORES.googleCalendarQueue, { keyPath: 'id' })
    queue.createIndex('by-intervention', 'interventionId')
  }
}

/** Migrations séquentielles v1 → vN — idempotentes */
export const MIGRATIONS: Record<number, MigrationFn> = {
  1: (db) => {
    createMetaIfMissing(db)
    if (!db.objectStoreNames.contains(STORES.syncQueue)) {
      const queue = db.createObjectStore(STORES.syncQueue, { keyPath: 'id' })
      queue.createIndex('by-status', 'status')
    }
    if (!db.objectStoreNames.contains(STORES.clients)) {
      db.createObjectStore(STORES.clients, { keyPath: 'id' })
    }
  },
  2: (db) => {
    if (!db.objectStoreNames.contains(STORES.interventions)) {
      db.createObjectStore(STORES.interventions, { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains(STORES.devices)) {
      db.createObjectStore(STORES.devices, { keyPath: 'id' })
    }
  },
  3: (db) => {
    if (!db.objectStoreNames.contains(STORES.interventionPhotos)) {
      const photos = db.createObjectStore(STORES.interventionPhotos, { keyPath: 'id' })
      photos.createIndex('by-intervention', 'interventionId')
    }
  },
  4: (db) => {
    if (!db.objectStoreNames.contains(STORES.quotes)) {
      db.createObjectStore(STORES.quotes, { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains(STORES.invoices)) {
      db.createObjectStore(STORES.invoices, { keyPath: 'id' })
    }
  },
  5: (db) => {
    if (!db.objectStoreNames.contains(STORES.spareParts)) {
      db.createObjectStore(STORES.spareParts, { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains(STORES.stockMovements)) {
      const movements = db.createObjectStore(STORES.stockMovements, { keyPath: 'id' })
      movements.createIndex('by-part', 'partId')
    }
  },
  6: (db) => {
    if (!db.objectStoreNames.contains(STORES.activityFeed)) {
      const feed = db.createObjectStore(STORES.activityFeed, { keyPath: 'id' })
      feed.createIndex('by-created', 'createdAt')
    }
  },
  7: (db) => {
    if (!db.objectStoreNames.contains(STORES.aiConversations)) {
      const ai = db.createObjectStore(STORES.aiConversations, { keyPath: 'id' })
      ai.createIndex('by-updated', 'updatedAt')
    }
  },
  8: (_db) => {
    /* réservé */
  },
  9: (db) => {
    if (!db.objectStoreNames.contains(STORES.backupSnapshots)) {
      const backup = db.createObjectStore(STORES.backupSnapshots, { keyPath: 'id' })
      backup.createIndex('by-created', 'createdAt')
    }
  },
  10: migrateV10,
  11: migrateV10,
  12: migrateV12,
  13: migrateV12,
  14: (db) => {
    if (!db.objectStoreNames.contains(STORES.portalCache)) {
      db.createObjectStore(STORES.portalCache)
    }
  },
  15: (db) => {
    if (!db.objectStoreNames.contains(STORES.interventionDocuments)) {
      const docs = db.createObjectStore(STORES.interventionDocuments, { keyPath: 'id' })
      docs.createIndex('by-intervention', 'interventionId')
      docs.createIndex('by-client', 'clientId')
    }
  },
  16: (db) => {
    if (!db.objectStoreNames.contains(STORES.interventionDocumentEvents)) {
      const events = db.createObjectStore(STORES.interventionDocumentEvents, { keyPath: 'id' })
      events.createIndex('by-intervention', 'interventionId')
      events.createIndex('by-document', 'documentId')
    }
    if (!db.objectStoreNames.contains(STORES.interventionDocumentBlobs)) {
      db.createObjectStore(STORES.interventionDocumentBlobs, { keyPath: 'id' })
    }
  },
}

export function runAllMigrations(
  db: IDBPDatabase,
  fromExclusive: number,
  toInclusive: number,
): void {
  for (let version = Math.max(1, fromExclusive + 1); version <= toInclusive; version += 1) {
    const migrate = MIGRATIONS[version]
    if (migrate) {
      console.info(`[idb:migration] applying v${version}`)
      migrate(db)
    }
  }
}

export const META_SCHEMA_VERSION_KEY = 'schema_version'
