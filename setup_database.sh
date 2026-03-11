#!/bin/bash

# Configuration
DB_NAME="hrsdb"
DB_USER="nanaamoako"

echo "🚀 Initializing HRS Database..."

# 1. Create database if it doesn't exist
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "✅ Database $DB_NAME already exists."
else
    echo "🟡 Creating database $DB_NAME..."
    createdb "$DB_NAME"
fi

# 2. Apply base schema
echo "📄 Applying base schema (HRSdb.sql)..."
psql -d "$DB_NAME" -f HRSdb.sql

# 3. Apply emergency type migration
echo "📄 Applying emergency type migration..."
psql -d "$DB_NAME" -f migration_add_emergency_type.sql

# 4. Seed initial data
echo "🌱 Seeding data (seed_data.sql)..."
psql -d "$DB_NAME" -f seed_data.sql

# 5. Apply Notification System Migrations (from v2 git pull)
echo "🔧 Applying v2 schema migrations (Notifications & Users)..."
psql -d "$DB_NAME" << 'EOF'
-- Users v2 columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;

-- Physicians v2 columns
ALTER TABLE physicians ADD COLUMN IF NOT EXISTS title VARCHAR(20);
ALTER TABLE physicians ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE physicians ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

-- Notifications update
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

-- Resource display renaming fix (if needed for the engine)
-- ALTER TABLE hospitals RENAME COLUMN tier TO level; -- Careful if this exists or not
EOF

echo "✅ Database initialization complete!"
