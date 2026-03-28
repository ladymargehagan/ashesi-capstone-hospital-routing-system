import os
import sys

from core.db import db_cursor

def run_migration():
    print("Starting migration...")
    with db_cursor() as cur:
        # Create TRANSIT_UPDATES table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS TRANSIT_UPDATES (
                update_id SERIAL PRIMARY KEY,
                referral_id INTEGER NOT NULL REFERENCES REFERRALS(referral_id) ON DELETE CASCADE,
                update_text TEXT NOT NULL,
                logged_by INTEGER NOT NULL REFERENCES USERS(user_id),
                logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("Created TRANSIT_UPDATES table.")

        # Temporarily drop constraints on REFERRALS.status
        cur.execute("""
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'REFERRALS'::regclass AND contype = 'c';
        """)
        constraints = cur.fetchall()
        for constr in constraints:
            conname = constr["conname"]
            if "status" in conname:
                cur.execute(f"ALTER TABLE REFERRALS DROP CONSTRAINT {conname};")
                print(f"Dropped constraint {conname} on REFERRALS")

        # Update data
        cur.execute("""
            UPDATE REFERRALS SET status = 'in_transit' WHERE status = 'en_route';
        """)
        print("Updated existing en_route referrals to in_transit.")

        # Recreate constraint on REFERRALS
        cur.execute("""
            ALTER TABLE REFERRALS ADD CONSTRAINT referrals_status_check 
            CHECK (status IN ('pending', 'approved', 'rejected', 'in_transit', 'arrived', 'completed', 'cancelled', 'no_capacity'));
        """)
        print("Recreated status constraint on REFERRALS.")

        # Temporarily drop constraints on NOTIFICATIONS.type
        cur.execute("""
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'NOTIFICATIONS'::regclass AND contype = 'c';
        """)
        constraints = cur.fetchall()
        for constr in constraints:
            conname = constr["conname"]
            if "type" in conname:
                cur.execute(f"ALTER TABLE NOTIFICATIONS DROP CONSTRAINT {conname};")
                print(f"Dropped constraint {conname} on NOTIFICATIONS")

        # Recreate constraint on NOTIFICATIONS
        cur.execute("""
            ALTER TABLE NOTIFICATIONS ADD CONSTRAINT notifications_type_check 
            CHECK (type IN (
                'hospital_approval', 'hospital_rejection',
                'physician_verification', 'physician_rejection',
                'referral_created', 'referral_approved', 'referral_rejected',
                'referral_completed', 'referral_cancelled',
                'referral_assigned', 'referral_assigned_update',
                'referral_no_capacity', 'referral_status_changed',
                'patient_arrived', 'data_flagged',
                'account_approved', 'account_rejected',
                'patient_dispatched', 'transit_update'
            ));
        """)
        print("Recreated type constraint on NOTIFICATIONS.")
        
    print("Migration finished successfully.")

if __name__ == "__main__":
    run_migration()
