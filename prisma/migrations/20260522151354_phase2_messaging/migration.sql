/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,contactId,channel]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'received');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "lastMessageAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "fromAddress" TEXT,
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'queued',
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "toAddress" TEXT;

-- CreateIndex
CREATE INDEX "Conversation_tenantId_lastMessageAt_idx" ON "Conversation"("tenantId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_tenantId_contactId_channel_key" ON "Conversation"("tenantId", "contactId", "channel");

-- CreateIndex
CREATE INDEX "Message_providerMessageId_idx" ON "Message"("providerMessageId");
