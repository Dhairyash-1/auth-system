/*
  Warnings:

  - Added the required column `browser` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceType` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `os` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Made the column `userAgent` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ip` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "browser" TEXT NOT NULL,
ADD COLUMN     "deviceType" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "os" TEXT NOT NULL,
ALTER COLUMN "userAgent" SET NOT NULL,
ALTER COLUMN "ip" SET NOT NULL;
