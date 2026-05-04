Hospital Routing System (HRS)
Ashesi University Capstone Project

GitHub Repository
-----------------
https://github.com/ladymargehagan/ashesi-capstone-hospital-routing-system


Overview
--------
HRS is a web-based platform for managing inter-hospital patient referrals in Ghana.
It routes referral requests to the most suitable receiving hospital using a scoring
engine that weighs resource availability, distance, hospital level, and patient
acuity. Three roles exist: physician, hospital admin, and super admin.

Core features:
- Referral creation with engine-generated ranked recommendations
- Real-time resource and bed availability tracking per hospital
- Automatic timeout cascade: if a hospital does not respond within the severity
  threshold (15-120 minutes), the referral is passed to the next hospital in the queue
- Email notifications at each referral lifecycle stage via Gmail SMTP
- Physician and hospital admin dashboards
- Super admin controls for hospital approval and physician oversight


System Architecture
-------------------
Frontend  -- Next.js 16 (React 19, TypeScript, Tailwind CSS)
Backend   -- FastAPI (Python 3.11, psycopg2, PyJWT)
Database  -- PostgreSQL hosted on Supabase
Auth      -- Supabase Auth (JWT, validated by backend)
Email     -- Gmail SMTP (SSL, port 465)
Maps      -- Google Maps JavaScript API + Haversine fallback


Deployment
----------
Backend is deployed on Render:
  https://hrs-backend.onrender.com

Frontend is deployed on Vercel:
  https://ashesi-capstone-hospital-routing-sy.vercel.app

The backend auto-deploys from main via render.yaml.
The frontend auto-deploys from main via Vercel's GitHub integration.


Prerequisites
-------------
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+ (or a Supabase project)
- A Gmail account with an App Password for SMTP


Database Setup
--------------
1. Create a PostgreSQL database (or use a Supabase project).
2. Run the base schema:

     psql -h <host> -U <user> -d <dbname> -f database/HRSdb_v2.sql

3. Seed reference data:

     psql -h <host> -U <user> -d <dbname> -f database/seed_data_v2.sql
     psql -h <host> -U <user> -d <dbname> -f database/seed_resources.sql

4. Apply migrations in order (only needed when upgrading an existing database):

     psql ... -f database/migration_referral_schema.sql
     psql ... -f database/migration_referral_columns.sql
     psql ... -f database/migration_admin_invites.sql
     psql ... -f database/migration_flags_outcomes.sql
     psql ... -f database/migration_notification_types.sql
     psql ... -f database/migration_new_bed_types.sql
     psql ... -f database/migration_specializations.sql
     psql ... -f database/migration_physician_availability.sql
     psql ... -f database/migration_patient_names.sql
     psql ... -f database/migration_add_emergency_type.sql

   Alternatively, run:

     bash database/setup_database.sh


Backend Setup (Local)
---------------------
1. Change into the Backend directory:

     cd Backend

2. Create and activate a virtual environment:

     python3 -m venv hrs_venv
     source hrs_venv/bin/activate        # macOS/Linux
     hrs_venv\Scripts\activate.bat       # Windows

3. Install dependencies:

     pip install -r requirements.txt

4. Create Backend/.env with the following variables:

     DB_NAME=<database name>
     DB_USER=<database user>
     DB_PASS=<database password>
     DB_HOST=<database host>
     DB_PORT=5432
     DB_SSLMODE=require

     SUPABASE_URL=https://<project>.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=<service role key>
     SUPABASE_JWT_SECRET=<jwt secret>

     GOOGLE_MAPS_API_KEY=<your key>

     CORS_ORIGINS=http://localhost:3000

     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=465
     SMTP_USER=<gmail address>
     SMTP_PASSWORD=<gmail app password>
     SMTP_FROM=<gmail address>
     FRONTEND_URL=http://localhost:3000

5. Start the backend:

     uvicorn api:app --reload --host 0.0.0.0 --port 8000

   The API will be available at http://localhost:8000.
   Interactive docs are at http://localhost:8000/docs.


Frontend Setup (Local)
----------------------
1. Change into the frontend directory:

     cd frontend

2. Install dependencies:

     npm install

3. Copy the example env file and fill in values:

     cp .env.example .env.local

   Required variables in .env.local:

     NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
     NEXT_PUBLIC_API_URL=http://localhost:8000

4. Start the development server:

     npm run dev

   The app will be available at http://localhost:3000.


Production Build (Frontend)
----------------------------
     npm run build
     npm run start


Running Both Services Together (Local)
---------------------------------------
A convenience script is provided at the repository root:

     bash run_app.sh

This starts both the backend (uvicorn) and frontend (next dev) in the same terminal.


Seeding Demo Data
-----------------
With the backend running and .env configured, run from inside Backend/:

     python seed_demo.py           # hospitals and resources
     python seed_specialists.py    # physician specialist profiles

Doctor login credentials for the demo environment are written to:
     Backend/doctor_credentials.csv


Testing (Backend)
-----------------
From inside Backend/:

     pytest tests/

Tests cover auth, referral endpoints, admin invite flow, and system integration.


Environment Variables Reference
--------------------------------
Backend (.env):
  DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_SSLMODE
  DATABASE_URL                   -- alternative to individual DB vars
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_JWT_SECRET
  GOOGLE_MAPS_API_KEY            -- optional; falls back to Haversine distance
  CORS_ORIGINS                   -- comma-separated list of allowed origins
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
  FRONTEND_URL                   -- used in email notification links

Frontend (.env.local):
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_API_URL            -- backend base URL


User Roles
----------
physician       -- creates and tracks referrals, manages patients
hospital_admin  -- approves/rejects incoming referrals, updates resources
super_admin     -- approves hospital registrations, oversees all physicians

Hospital admin accounts are created via an invite link generated by a super admin.
Physician accounts are created through the registration flow and require super admin
approval before they can log in.


Referral Lifecycle
------------------
1. Physician submits referral; engine ranks candidate hospitals.
2. Referral is routed to the top-ranked hospital with status "pending".
3. Hospital admin approves or rejects.
4. On approval, admin assigns a receiving physician.
5. Referring physician marks patient "in_transit".
6. Receiving side marks patient "arrived".
7. Receiving side records outcome and marks "completed".
8. If rejected, the next hospital in the routing queue is tried automatically.
   Pending referrals that exceed the severity timeout are also cascaded automatically.


Health Check
------------
     GET /api/health

Returns database connectivity, email configuration, and engine status.
