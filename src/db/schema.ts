import Dexie, { type Table } from "dexie";

type OrderStatus = "NEW" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
type LocalSyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
type SyncOperationType = "CREATE_ORDER" | "UPDATE_STATUS";
type SyncEntityType = "ORDER" | "ORDER_STATUS";
type SyncOperationStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";

interface LocalCategory {
  id: string;
  name: string;
  updatedAt: string;
}

interface LocalProduct {
  id: string;
  categoryId: string;
  name: string;
  price: string;
  active: boolean;
  updatedAt: string;
}

interface LocalOrder {
  id: string;
  orderNumber: string;
  terminalId: string;
  status: OrderStatus;
  total: string;
  clientModifiedAt: string;
  createdAt: string;
  syncStatus: LocalSyncStatus;
}

interface LocalOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtOrder: string;
  createdAt: string;
}

interface LocalOrderStatusEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  terminalId: string;
  clientModifiedAt: string;
  createdAt: string;
  syncStatus: LocalSyncStatus;
}

interface LocalSyncOperation {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperationType;
  payload: Record<string, unknown>;
  status: SyncOperationStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  nextAttemptAt: string;
  permanentFailure: boolean;
}

interface TerminalMeta {
  key: string;
  terminalId: string;
  terminalPrefix: string;
  lastOrderSequence: number;
  createdAt: string;
}

class SariSaloDatabase extends Dexie {
  categories!: Table<LocalCategory, string>;
  products!: Table<LocalProduct, string>;
  orders!: Table<LocalOrder, string>;
  orderItems!: Table<LocalOrderItem, string>;
  orderStatusEvents!: Table<LocalOrderStatusEvent, string>;
  syncOperations!: Table<LocalSyncOperation, string>;
  meta!: Table<TerminalMeta, string>;

  constructor() {
    super("sari-salo");

    this.version(1).stores({
      categories: "id",
      products: "id, categoryId, active",
      orders: "id, syncStatus, status, createdAt",
      orderItems: "id, orderId",
      orderStatusEvents: "id, orderId, syncStatus, createdAt",
      syncOperations:
        "id, status, entityType, [status+createdAt], [status+nextAttemptAt]",
      meta: "key",
    });
  }
}

export const db = new SariSaloDatabase();
