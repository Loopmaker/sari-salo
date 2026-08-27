-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SyncOperationStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "SyncOperationType" AS ENUM ('CREATE_ORDER', 'UPDATE_STATUS');

-- CreateEnum
CREATE TYPE "SyncEntityType" AS ENUM ('ORDER', 'ORDER_STATUS');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "imagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "total" DECIMAL(10,2) NOT NULL,
    "clientModifiedAt" TIMESTAMP(3) NOT NULL,
    "serverUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceAtOrder" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "terminalId" TEXT NOT NULL,
    "clientModifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncOperation" (
    "id" TEXT NOT NULL,
    "entityType" "SyncEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" "SyncOperationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "SyncOperationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_terminalId_orderNumber_key" ON "Order"("terminalId", "orderNumber");

-- CreateIndex
CREATE INDEX "OrderStatusEvent_orderId_createdAt_idx" ON "OrderStatusEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "SyncOperation_status_createdAt_idx" ON "SyncOperation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SyncOperation_entityType_entityId_idx" ON "SyncOperation"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
