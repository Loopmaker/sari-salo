-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerName" TEXT;

-- CreateTable
CREATE TABLE "DailyOrderCounter" (
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyOrderCounter_pkey" PRIMARY KEY ("date")
);
