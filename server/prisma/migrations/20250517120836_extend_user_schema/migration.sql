-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('email', 'google', 'github');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTwoFactorEnabled" BOOLEAN DEFAULT false,
ADD COLUMN     "provider" "AuthProvider" NOT NULL DEFAULT 'email',
ADD COLUMN     "twoFactorSecret" TEXT;
