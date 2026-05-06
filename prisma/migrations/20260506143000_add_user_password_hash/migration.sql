-- Add password hashes for credentials-based login.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
