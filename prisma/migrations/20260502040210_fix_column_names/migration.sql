/*
  Warnings:

  - You are about to drop the column `dailyCount` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `dailyResetAt` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "dailyCount",
DROP COLUMN "dailyResetAt",
ADD COLUMN     "daily_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "daily_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
