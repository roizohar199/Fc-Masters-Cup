# Database Configuration Improvements

## Overview
This document describes the database configuration improvements implemented to enforce foreign key constraints and optimize performance.

## Changes Made

### 1. Foreign Key Enforcement
- **Added `db.pragma("foreign_keys = ON")` to all database connections**
- **Created centralized `createDbConnection()` function** in `server/src/db.ts`
- **Updated all database connection points** to use the centralized function

### 2. Performance Indexes
Added recommended indexes for `tournament_registrations` table:
```sql
CREATE INDEX IF NOT EXISTS idx_tr_userId ON tournament_registrations(userId);
CREATE INDEX IF NOT EXISTS idx_tr_tournamentId ON tournament_registrations(tournamentId);
```

### 3. Centralized Database Configuration
Created `createDbConnection()` function that ensures:
- Foreign keys are always enabled
- WAL mode is set for better concurrency
- Consistent database path resolution

## Files Modified

### Core Database Configuration
- `server/src/db.ts` - Main database configuration with centralized function

### Updated Database Connections
- `server/src/modules/admin/routes.ts`
- `server/src/services/selectionService.ts`
- `server/src/routes/adminSelection.ts`
- `server/src/modules/admin/smtp.routes.ts`
- `server/src/modules/mail/mailer.ts`
- `server/src/modules/notifications/model.ts`
- `server/src/modules/tournaments/selection.ts`
- `server/src/resetUsers.ts`
- `server/src/index.ts`

## Deployment Protection

### Database File Exclusion
Created `deploy-with-rsync.sh` with proper exclusions:
```bash
--exclude="*.sqlite"
--exclude="*.sqlite-shm"
--exclude="*.sqlite-wal"
```

This prevents database files from being overwritten during deployment.

## Benefits

### Data Integrity
- Foreign key constraints prevent orphaned records
- Referential integrity is maintained across all operations
- Data consistency is enforced at the database level

### Performance
- Indexes on `tournament_registrations` improve query performance
- Faster joins and lookups for tournament-related operations
- Better performance for user-tournament relationship queries

### Deployment Safety
- Database files are protected during deployments
- No risk of data loss from code deployments
- Consistent database state across deployments

## Usage

### Using the Centralized Database Function
```typescript
import { createDbConnection } from "../db.js";

// This automatically enables foreign keys and WAL mode
const db = createDbConnection();
```

### Deployment with Database Protection
```bash
# Use the new deployment script
chmod +x deploy-with-rsync.sh
./deploy-with-rsync.sh
```

## Verification

### Check Foreign Key Enforcement
```sql
PRAGMA foreign_keys;
-- Should return 1 (enabled)
```

### Check Indexes
```sql
.indexes tournament_registrations
-- Should show all indexes including the new ones
```

### Test Foreign Key Constraints
```sql
-- This should fail if foreign keys are working
INSERT INTO tournament_registrations (tournamentId, userId) 
VALUES ('non-existent-tournament', 'non-existent-user');
```

## Migration Notes

- All existing database connections have been updated
- No data migration is required
- Indexes are created with `IF NOT EXISTS` to avoid conflicts
- Foreign key enforcement is applied to all new connections

## Best Practices

1. **Always use `createDbConnection()`** for new database connections
2. **Never deploy database files** - use rsync exclusions
3. **Test foreign key constraints** after any schema changes
4. **Monitor query performance** with the new indexes
5. **Backup database** before any major changes

## Troubleshooting

### Foreign Keys Not Working
- Check that `PRAGMA foreign_keys = ON` is set
- Verify the database connection uses `createDbConnection()`
- Ensure foreign key constraints are properly defined in schema

### Performance Issues
- Check that indexes exist: `.indexes tournament_registrations`
- Analyze query plans with `EXPLAIN QUERY PLAN`
- Consider additional indexes for frequently queried columns

### Deployment Issues
- Verify rsync exclusions are working
- Check that database files are not being overwritten
- Ensure backup procedures are in place
