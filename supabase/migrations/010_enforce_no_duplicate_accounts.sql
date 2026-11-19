-- MudayHub Freelance - Migration 010
-- Strict Duplicate Account Prevention
-- Ensures no duplicate email, phone number, or telebirr payout destinations across accounts

-- 1. Partial unique index on non-null/non-empty telebirr_number in profiles
CREATE UNIQUE INDEX IF NOT EXISTS profiles_telebirr_number_unique_idx
  ON profiles (telebirr_number)
  WHERE telebirr_number IS NOT NULL AND telebirr_number <> '';

-- 2. Ensure case-insensitive uniqueness check on email via auth.users
-- auth.users in Supabase standardly enforces unique emails; profiles.phone has UNIQUE constraint from migration 001.

COMMENT ON INDEX profiles_telebirr_number_unique_idx IS
  'Prevents duplicate accounts from registering or binding the same Telebirr payout wallet.';
