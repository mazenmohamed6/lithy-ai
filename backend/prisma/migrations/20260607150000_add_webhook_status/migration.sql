-- AlterTable: add status lifecycle fields to webhook_events
ALTER TABLE "webhook_events" 
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'RECEIVED',
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webhook_events_status_createdAt_idx" ON "webhook_events"("status", "createdAt");
