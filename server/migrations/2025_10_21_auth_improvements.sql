-- Migration for auth improvements: unique email index and password_hash column

-- Add password_hash column if it doesn't exist (for future bcrypt migration if needed)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll handle this gracefully in the migration script

-- Create unique index on email (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email);

-- Ensure passwordHash column exists (current field name)
-- The table already uses 'passwordHash' based on the auth.ts code

