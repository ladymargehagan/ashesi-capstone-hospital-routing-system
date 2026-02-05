


PRODUCT REQUIREMENTS DOCUMENT
Hospital Routing System (HRS)
Design and Implementation of an Intelligent Hospital Routing System
for Emergency Medical Services in Greater Accra, Ghana


Owner: Lady-Margaret Hagan
Supervisor: Dr. Jamal-deen Abdulai
Ashesi University — CSIS Capstone Project
Version 1.0 | February 2026


1. Executive Summary
Field	Details
Product Name	Hospital Routing System (HRS)
Version	1.0 (Capstone Prototype)
Owner	Lady-Margaret Hagan, Ashesi University
Supervisor	Dr. Jamal-deen Abdulai
Target Defense	March 31, 2026
Geographic Scope	Greater Accra, Ghana

HRS is a web-based decision support platform that provides physicians with hospital resource visibility and intelligent facility recommendations to support faster, more appropriate inter-hospital referral decisions in Greater Accra, Ghana. The system replaces a 30 minute to 1 hour manual calling process with ranked hospital recommendations delivered in under a minute.
2. Problem Statement
2.1 Current State
•	81.3% of emergency cases involve inter-hospital physician referrals (Oduro-Mensah et al., 2021).
•	70% of referrals contain communication defects leading to delays (Oduro-Mensah et al., 2021).
•	Physicians spend 15–30 minutes manually calling hospitals to find available beds, specialists, and equipment (Yevoo et al., 2023).
•	No real-time visibility into hospital capacity, specialist availability, or resource status (Abass et al., 2024).
•	Time-dependent resource availability — nights, weekends, and holidays — creates additional uncertainty.
•	Existing systems (GIMS, LHIMS) are not functional or widely adopted. Physicians rely on WhatsApp and personal relationships.
2.2 Impact
•	Critical delays in patient care where minutes determine outcomes.
•	Wasted clinical time on phone-based searching.
•	Patients arrive at facilities unable to handle their conditions, triggering referral cascades.
•	Poor patient outcomes due to delayed definitive care.
2.3 Root Cause
Information fragmentation. Hospitals operate independent systems with no interoperability. Physicians cannot see which hospitals have available beds, specialists, or equipment in real time.
3. Solution
A web-based hospital routing system where physicians enter patient referral information and receive a ranked list of the top 5 suitable hospitals, complete with resource availability, distance, travel time, and justifications. The physician reviews the recommendations, selects a hospital, and submits a formal referral. The receiving hospital administrator reviews and approves or rejects the referral through the same platform.
3.1 Value Proposition
Replace a 30 minute to 1 hour manual calling process with under a minute of intelligent, data-driven hospital recommendations. The system provides decision support — it does not replace physician clinical judgment.
4. Success Criteria
4.1 Primary Metrics
Metric	Target
Algorithm execution time	< 2 minutes, ideally less than a minute
Physician agreement with top recommendation	> 85%
Time savings vs. manual process	> 80% reduction
System Usability Scale (SUS) score	> 70
Clinical appropriateness	100% — no unsafe recommendations
4.2 Secondary Metrics
•	Referral acceptance rate per hospital.
•	Data freshness — percentage of hospitals updated within 6 hours.
•	System uptime during testing: > 95%.
5. Target Users
5.1 Physicians (Primary — Referring)
•	Location: Greater Accra hospitals, Tier 2 and 3.
•	Use case: Making inter-hospital referrals for patients requiring specialized care.
•	Frequency: 2–10 referrals per day in busy departments.
•	Pain point: Wasting time calling hospitals; uncertainty about real-time capacity.
5.2 Hospital Administrators (Primary — Receiving)
•	Location: Greater Accra Tier 2 and 3 hospitals.
•	Use case: Managing incoming referrals and updating facility resource status.
•	Note: Multiple administrators per hospital are supported.
•	Pain point: No centralized referral visibility; manual resource tracking.
5.3 Super Administrator (Secondary)
•	Role: System oversight, hospital onboarding, user approval, analytics.
•	Frequency: Weekly management tasks.
•	Pain point: Need to manage users and ensure data quality across the system.
5.4 Patients
Patients do not interact with the system. Their data is entered by physicians and stored for referral records only.
6. User Stories
6.1 Physician
1.	As a physician, I want to see which hospitals have available resources so I can refer my patient without calling multiple facilities.
2.	As a physician, I want to see why each hospital is recommended so I can make an informed clinical decision.
3.	As a physician, I want the referral form to pre-fill with data I already entered so I do not repeat myself.
4.	As a physician, I want to know if a hospital accepted or rejected my referral so I can act accordingly.
5.	As a physician, I want to flag when hospital data is inaccurate so the system stays reliable.
6.2 Hospital Administrator
6.	As a hospital administrator, I want to quickly update bed and resource availability so physicians have accurate information.
7.	As a hospital administrator, I want to see all pending referrals in one place so I can manage them efficiently.
8.	As a hospital administrator, I want to approve or reject referrals with reasons so physicians understand our constraints.
6.3 Super Administrator
9.	As a super administrator, I want to approve hospital registrations so only legitimate facilities enter the system.
10.	As a super administrator, I want to view system analytics and audit logs so I can monitor usage and accountability.
 
7. Core Features
7.1 User Authentication and Registration
Hospital Registration: A hospital administrator submits a registration form including hospital name, tier, location (captured via Google Maps autocomplete), license number, and contact details. The Super Administrator reviews and approves or rejects the registration.
Physician Registration: A physician registers by selecting their affiliated hospital and providing their medical license number. The Hospital Administrator at that hospital reviews and approves or rejects the account.
Login: Secure email/password authentication with role-based access control. Password recovery is handled via a token-based system with time-limited reset links.
7.2 Patient Case Entry
Physicians enter patient information when initiating a referral. Required inputs include emergency type, severity, stability, reason for referral, and the required specialist or facility. This input drives the recommendation algorithm — it determines which capabilities are searched for and how the scoring weights are applied.
7.3 Hospital Recommendation Engine
The core of the system. When a physician requests recommendations, the algorithm runs through the following steps:
Step 1 — Geographic Filtering
Hospitals within a 16 km radius are identified using geohash-based spatial indexing on stored GPS coordinates. No Google Maps API call is made at this stage.
Step 2 — Capability Filtering
Hospitals are filtered based on whether they have the required specialist and facility for the patient's condition. The emergency type maps to a predefined set of required resources.
Step 3 — Availability and Time-of-Day Check
For each capable hospital, resource availability is checked. Resources that require an operator (CT scan, X-ray, MRI, theatre, etc.) are only considered available if the associated specialist or technician is currently on duty. This is determined by cross-referencing HOSPITAL_RESOURCES.operator_specialty with the SPECIALISTS table availability schedule and on-call status.
Step 4 — Scoring
Each hospital receives three scores:
•	Capability Score: Specialist match (+40), facility match (+30), available beds ≥ 5 (+20), ICU availability (+10). Maximum 100.
•	Proximity Score: Calculated using Haversine distance from the referring hospital. Normalized to 0–100 based on a 16 km maximum.
•	Freshness Score: Tiered based on hours since last resource update. < 2 hours = 100, < 6 hours = 70, < 12 hours = 40, ≥ 12 hours = 10.
Step 5 — Dynamic Weighting
Weights are adjusted based on patient severity and stability:
Severity / Stability	Capability Weight	Proximity Weight 	Freshness Weight
Critical + Unstable	0.65	0.25 	0.10
Critical or High	0.55	0.30 	0.15
Medium or Low	0.40	0.40 	0.20
Step 6 — Composite Score and Ranking
Composite Score = (Capability × w_c) + (Proximity × w_p) + (Freshness × w_f). Hospitals are sorted descending. Tie-breaking order: fresher data first, then closer proximity. Top 5 are selected.
Step 7 — Google Maps Enrichment
Google Maps Distance Matrix API is called for the top 5 hospitals only to retrieve actual road distance and estimated travel time. This is the only point at which Google Maps is called during the recommendation flow.
7.4 Recommendation Display
Each of the top 5 hospitals is displayed with: rank, hospital name, type, and tier; a resource checklist showing which required resources are available or unavailable; road distance and estimated travel time from Google Maps; last updated timestamp with a warning if data is older than 6 hours; and a text justification explaining why the hospital was ranked at that position.
7.5 Referral Submission
After selecting a hospital, the physician completes a referral form. Patient information, clinical details, examination findings, investigations, and reason for referral are captured. Fields already entered during case entry are pre-populated. The referral is submitted with a "Pending" status and forwarded to the receiving hospital's administrator queue. Note that if the physician so wishes to refer to a particular hospital without asking for reccoemndations, my system should allow for physicians to do that. 
7.6 Referral Approval and Rejection
The hospital administrator reviews the full referral including patient demographics, clinical summary, severity, and required resources. They approve or reject with a mandatory reason. The referring physician is notified of the outcome via in-app notification.
7.7 Hospital Resource Management
Hospital administrators update resource availability manually. This includes bed counts (general, ICU, pediatric, maternity), specialist on-call toggles, and facility operational status (theatre, CT scan, lab, blood bank, etc.). Each update is timestamped automatically and drives the data freshness score.
7.8 Dashboards
•	Physician Dashboard: Referral statistics, pending referrals with status badges, quick access to submit a new referral.
•	Hospital Administrator Dashboard: Pending referrals with summary cards, resource status with last updated timestamp and freshness warning, referral history.
•	Super Administrator Dashboard: Pending hospital and physician registrations, system analytics, data quality flags, audit logs.
7.9 Data Quality and Flagging
Physicians can flag data inaccuracies after a referral has been transported. Flags are logged in the AUDIT_LOGS table and surfaced as notifications to the Super Administrator for review.
7.10 Audit Logging
All system actions are logged automatically: logins, case entries, recommendation generations, referral submissions, approvals, rejections, resource updates, and data flags. Logs are retained for 2 years and accessible only to the Super Administrator.
 
8. Edge Case Handling
Edge Case	System Response
All hospital data is stale (≥ 12 hours)	Results are shown with a warning banner. Each hospital's freshness status is flagged. Physician is advised to confirm by phone before transport.
All hospitals are fully occupied	Hospitals are shown with total capacity only, flagged as currently full. Physician can still attempt referral as capacity may change before patient arrives.
No hospitals within 16 km radius	Radius is automatically expanded to 32 km. If still none, the nearest hospital is shown regardless of distance with a distance warning.
Required specialist not available anywhere	Hospitals that have the specialist but are currently off-duty are shown, flagged with operating hours.
Required facility not available anywhere	Same as above — hospitals with the facility but currently closed are shown with scheduled operating hours.
No hospitals match any requirement	Happens for highly specialized conditions. System shows the nearest Tier 1 hospital with a message indicating no hospitals in range match requirements.
Tied composite scores	Tiebreaker order: higher freshness score first, then closer proximity.
Google Maps API is unavailable	System falls back to Haversine straight-line distance for all calculations. Results are flagged as estimates.
Hospital profile is incomplete (no resources entered)	Hospital is excluded from recommendations entirely.
9. Technical Requirements
9.1 System Architecture
Architecture Style: Component-based Modular Monolith.
Justification: The one-month development timeline and single-developer context make a modular monolith the most practical choice. All components communicate frequently with low latency, so keeping them in one application eliminates network overhead. The expected scale of 50–100 hospitals and under 1,000 referrals per day is well within what a single application handles. Clear module boundaries are maintained so components can be extracted into separate services if the system scales beyond Greater Accra in the future.
Layer	Technology
Frontend	Next.js + Tailwind CSS
Backend API	Python FastAPI (REST)
Database	PostgreSQL with PostGIS
Algorithm	Python (NumPy, custom scoring logic)
External API	Google Maps (Geocoding, Distance Matrix)
Authentication	JWT (JSON Web Tokens)
9.2 Technology Justifications
•	Next.js + Tailwind CSS: Server-side rendering for fast load times. Component-based UI for reusability. Tailwind provides rapid, consistent styling.
•	FastAPI: Handles asynchronous requests concurrently. When a physician requests recommendations, the system queries the database, runs the scoring algorithm, and calls Google Maps simultaneously rather than sequentially. This reduces response time significantly. Auto-generates API documentation via OpenAPI.
•	PostgreSQL + PostGIS: Relational structure for complex referral workflows. ACID compliance ensures data integrity. PostGIS enables efficient geospatial queries for geohash-based radius filtering.
•	Google Maps API: Geocoding for capturing hospital GPS coordinates during registration via autocomplete. Distance Matrix for accurate road distance and travel time for the final top 5 results.
9.3 Database Schema
The database consists of 12 tables organized into the following groups:
Authentication and Authorization
•	USERS — Core user table. Stores login credentials, role assignment, and hospital affiliation. Shared across all user types (physicians, hospital administrators, super administrator).
•	ROLE — Defines the three system roles: physician, hospital_admin, super_admin.
•	PASSWORD_RESETS — Stores time-limited tokens for secure password recovery.
Hospital Management
•	HOSPITALS — Hospital profile including GPS coordinates, tier, type, ownership, and operating status.
•	HOSPITAL_RESOURCES — Row-per-resource model. Each row represents one resource type at one hospital (e.g., CT scan at Korle Bu). Includes operator_required and operator_specialty columns to map resources to the specialists who operate them.
•	SPECIALISTS — Specialist services available at each hospital. Tracks availability schedule and current on-call status. Distinct from PHYSICIANS — specialists are hospital capabilities, physicians are system users.
Clinical
•	PHYSICIANS — System-user physicians. Links to USERS table and hospital affiliation.
•	PATIENTS — Patient records entered by physicians. Includes NHIS number for receiving hospital admission verification.
Referral
•	REFERRALS — Referral logistics: who referred whom, to where, status, severity, stability, timestamps for all status changes.
•	REFERRAL_DETAILS — Clinical content of the referral: diagnosis, examination findings, treatment given, investigations. Separated from REFERRALS so that dashboard list views load quickly without pulling clinical text.
System
•	NOTIFICATIONS — In-app notifications for referral approvals, rejections, and system alerts.
•	AUDIT_LOGS — Logs all system actions for accountability and data quality review.

Key design decisions:
•	admin_id is not stored in HOSPITALS. Any user with role = hospital_admin and the matching hospital_id is an administrator for that hospital. Supports multiple administrators per hospital.
•	GPS coordinates are stored locally in HOSPITALS rather than fetched from Google Maps each time. This avoids 50+ API calls per recommendation request. Google Maps is used once during registration to capture coordinates via autocomplete.
•	Recommendations are generated on the fly and not stored. The algorithm runs each time a physician requests recommendations, ensuring results reflect the latest resource data.
•	HOSPITAL_RESOURCES uses a row-per-resource model with operator_required and operator_specialty. This creates a causal link: if a CT scan requires a radiologist, the system checks whether that radiologist is currently available before marking the CT scan as usable.
 
9.4 Matching Algorithm
Inputs
Input	Source
Patient severity	Physician input (referral form)
Patient stability	Physician input (referral form)
Required specialist	Physician input — derived from emergency type
Required facility	Physician input — derived from emergency type
Referring hospital GPS	HOSPITALS table (stored coordinates)
Candidate hospitals	HOSPITALS table — filtered by geohash radius
Hospital resources	HOSPITAL_RESOURCES table
Specialist availability	SPECIALISTS table — schedule + on_call_available
Current time	System clock — used for time-of-day and freshness checks
Capability Scoring
Condition	Points
Required specialist available and on-call	+40
Required facility available and operational	+30
Available beds ≥ 5	+20
Available beds ≥ 1 but < 5	+10
ICU beds available	+10
Proximity Scoring
Proximity Score = max(0, 100 − (Haversine distance / 16) × 100). Hospitals at 0 km score 100. Hospitals at 16 km score 0.
Freshness Scoring
Hours Since Last Update	Score
< 2 hours	100
< 6 hours	70
< 12 hours	40
≥ 12 hours	10
Time-of-Day Logic
Resources flagged as operator_required are only considered available if the associated specialist is currently on duty. This is checked by comparing the current system time against the specialist's availability_schedule (stored as JSON in the SPECIALISTS table) and their on_call_available boolean. For example, a CT scan may physically exist but is unavailable at 2 AM if no radiologist is on call.
Composite Score
Composite Score = (Capability Score × w_c) + (Proximity Score × w_p) + (Freshness Score × w_f), where weights are determined by patient severity and stability as defined in Section 7.3.
Complexity
•	Scoring: O(n) — one pass through all candidate hospitals.
•	Sorting: O(n log n) — QuickSort on composite scores.
•	Expected runtime: < 2 seconds for 50 hospitals.
9.5 Google Maps API Integration
API	Usage
Geocoding API	Converts hospital address to GPS coordinates during registration. One-time call per hospital.
Autocomplete API	Suggests addresses as hospital admin types during registration. Captures coordinates automatically.
Distance Matrix API	Calculates road distance and travel time for the top 5 ranked hospitals only. Called after scoring is complete.
Fallback: If the Distance Matrix API is unavailable, Haversine straight-line distance is used and results are flagged as estimates. Caching is applied to repeated origin-destination pairs to minimize API calls.
9.6 Security
•	Passwords hashed with bcrypt, cost factor 12.
•	JWT tokens with 24-hour expiry for session management.
•	Role-based access control enforced on all API routes.
•	Hospital administrators can only access data for their own hospital.
•	Physicians can only access their own patients and referrals.
•	HTTPS/TLS for all communications.
•	Parameterized SQL queries to prevent injection.
•	File uploads validated — whitelist PDF, JPG, PNG only, max 5 MB.
9.7 Performance
•	Indexes on: user email, hospital GPS (GiST spatial index), resource type, resource last_updated, specialist hospital and specialty, referral status, referral receiving hospital, notification user and read status.
•	Hospital capabilities cached and invalidated on update.
•	Google Maps results cached for repeated origin-destination pairs.
•	Geohash spatial queries limited to 50 results maximum.
•	Referral lists paginated at 10 per page.
9.8 Error Handling
Error	Response
Missing required fields	Clear validation message per field.
Google Maps API timeout	"Unable to calculate travel time. Using estimated distance." Falls back to Haversine.
No hospitals found in radius	"No capable hospitals within 16 km. Expanding search." Radius doubles to 32 km.
Database connection failure	Error logged. Maintenance message displayed.
Algorithm timeout (> 2 minutes)	Error logged. Cached results shown if available, otherwise error message.
 
10. User Flows
10.1 Physician Referral Flow
11.	Login to system.
12.	Dashboard — click "New Referral."
13.	Enter patient case data: emergency type, severity, stability, reason for referral.
14.	Click "Get Recommendations."
15.	System runs the matching algorithm.
16.	View top 5 ranked hospitals with resource checklists, distances, and justifications.
17.	Select a hospital.
18.	Complete referral form (pre-populated fields plus patient demographics and clinical details).
19.	Submit referral. Status set to "Pending."
20.	Receive notification: Approved or Rejected.
21.	If rejected — view reason, select alternate hospital from original top 5, resubmit.
22.	If approved — arrange transport.
23.	Optional: After transport, flag any data inaccuracies encountered.
10.2 Hospital Administrator Approval Flow
24.	Login. Dashboard shows pending referrals count.
25.	View pending referrals list.
26.	Click a referral to view full clinical and demographic details.
27.	Check current hospital capacity.
28.	Accept or decline the referral. If declining, select a reason from the predefined list.
29.	Referring physician is notified of the outcome.
10.3 Hospital Administrator Resource Update Flow
30.	Login. Dashboard shows last updated timestamp and freshness warning if applicable.
31.	Click "Update Resources."
32.	Current values are pre-filled. Update bed counts, specialist on-call toggles, facility status toggles.
33.	Save. System timestamps the update automatically.
34.	Success confirmation displayed.
10.4 Super Administrator Hospital Onboarding Flow
35.	Login. Dashboard shows pending hospital registrations.
36.	Review registration details: name, location, tier, license, contact.
37.	Verify hospital is Tier 2 or 3, located in Greater Accra, with valid license.
38.	Approve or reject. If approved, hospital administrator receives login credentials. If rejected, reason is provided.
11. Scope and Timeline
11.1 In Scope
•	User authentication and registration with role-based access control.
•	Patient case entry with structured inputs.
•	Hospital recommendation engine — top 5 ranked results.
•	Referral submission, approval, and rejection workflow.
•	Hospital resource management — manual updates by administrators.
•	Dashboards for physicians, hospital administrators, and super administrator.
•	Audit logging and data quality flagging.
•	Edge case handling as defined in Section 8.
11.2 Out of Scope
•	Voice input for patient case entry.
•	Automatic integration with existing hospital management systems (HMS).
•	Native mobile applications — web-responsive only.
•	Real-time push notifications — in-app notifications only.
•	Payment processing or cost estimation.
•	Bed reservation or hold system.
•	National expansion beyond Greater Accra.
•	Multi-language support — English only.
11.3 Development Timeline
Week	Focus
Week 1 (Jan 27 – Feb 2)	Core infrastructure: database setup, authentication, basic UI, hospital and user CRUD.
Week 2 (Feb 3 – 9)	Recommendation engine: geohash indexing, capability matching, Google Maps integration, scoring algorithm.
Week 3 (Feb 10 – 16)	Referral workflow: form pre-population, submission, approval/rejection, notifications.
Week 4 (Feb 17 – 23)	Dashboards and UI polish: physician, hospital admin, and super admin dashboards. Mobile-responsive design.
Week 5 (Feb 24 – Mar 2)	Internal testing: algorithm accuracy, UI/UX, bug fixes, performance optimization.
Week 6 (Mar 3 – 9)	User testing: recruit 2–3 physicians, conduct usability sessions, collect SUS scores and feedback.
Week 7 (Mar 10 – 16)	Post-testing fixes: implement critical feedback, final UI improvements, documentation.
Week 8–9 (Mar 17 – 30)	Thesis documentation: Chapters 4 and 5. Defense preparation.
Week 10 (Mar 31)	Capstone defense.
12. Risks and Dependencies
12.1 Dependencies
•	Google Maps API: Free tier must be sufficient for testing. Rate limit: 40,000 requests per month.
•	Email service: Required for password resets and notification emails. SMTP or SendGrid.
•	Hosting platform: Railway or Render for deployment.
•	IRB approval: Required before physician user testing can proceed.
•	Physician availability: 2–3 physicians needed for usability testing.
12.2 Risks
Risk	Impact	Likelihood	Mitigation
Google Maps API exceeds free tier	High	Low	Cache results. Use Haversine fallback.
Cannot recruit physicians for testing	High	Medium	Use supervisor network. Flexible scheduling.
Algorithm execution time > 2 minutes	High	Low	Optimize queries. Limit radius. Reduce hospital count.
Hospital data not updated regularly	High	High	Accepted limitation. Demonstrate with synthetic data. Document adoption barriers in thesis.
IRB approval delayed	Medium	Medium	Continue development. Only testing is blocked.
User testing reveals major usability issues	Medium	Medium	Two weeks allocated for post-testing fixes.
13. Assumptions
39.	Hospital administrators will update resource data manually every 4–6 hours.
40.	Physicians have basic computer literacy and internet access.
41.	Greater Accra hospitals have reliable internet connectivity.
42.	Google Maps API free tier is sufficient for the testing phase.
43.	Synthetic validated data is acceptable for capstone demonstration.
44.	IRB approval will be granted for physician testing.
45.	Physicians are available for 30–45 minute testing sessions.
46.	The system is used primarily during business hours, not 24/7 initially.
14. Constraints
47.	Timeline: Must be completed by March 31, 2026 capstone defense.
48.	Budget: Zero. Free-tier tools and APIs only.
49.	Team: Solo developer.
50.	Scope: Capstone prototype, not production deployment.
51.	Data: No real-time HMS integration. Manual resource updates only.
52.	Testing: Limited to 2–3 physician testers.
53.	Geography: Greater Accra only.
54.	Hospitals: 15–25 facilities maximum.
55.	Platform: Web-based only.
56.	Language: English only.
57.	System architecture: Monolith 
58.	System architectural design: MVC 
 
15. Future Enhancements
59.	HMS integration — automatic bed and resource inference from hospital admission/discharge events.
60.	Native mobile apps for Android and iOS.
61.	Real-time push notifications for referral status updates.
62.	Machine learning to optimize algorithm weights and predict referral acceptance.
63.	National expansion beyond Greater Accra.
64.	EMT module — emergency scene routing with proximity-first logic.
65.	Patient portal — allow patients to track referral status.
66.	Multi-language support for local Ghanaian languages.
16. Appendices
Appendix A: Emergency Type to Resource Mapping
Emergency Type	Required Resources
Trauma	General beds, Theatre, Surgeon, CT scan, Blood bank, X-ray
Cardiac	ICU beds, Cardiologist, Cath lab, ECG
Respiratory	ICU beds, Ventilators, Pulmonologist, Oxygen supply
Pediatric	Pediatric beds, Pediatrician, NICU (if critical)
Obstetric	Maternity beds, Obstetrician, Theatre, Blood bank
Sepsis	ICU beds, Lab services, Infectious disease specialist
Toxicology	General beds, ICU beds (if severe), Lab services

Appendix B: Referral Rejection Reasons
67.	No beds available.
68.	No specialist on duty.
69.	Facility unavailable — theatre or ICU full.
70.	Insufficient staffing.
71.	Patient requires higher level of care.
72.	Equipment not operational.
73.	Other — requires text explanation.

Appendix C: Operator-Dependent Resources
Resource	Operator Specialty
CT Scan	Radiologist
X-Ray	Radiologist
MRI	Radiologist
Ultrasound	Sonographer
Dialysis	Nephrologist
Theatre	Anaesthetist
Lab	Lab Technician
General Beds	None — always available
ICU Beds	None — always available
Blood Bank	None — always available

Appendix D: Role Permissions
Action	Physician	Hospital Admin	Super Admin	
Submit referrals	✓	✗	✗	
View own referrals	✓	✗	✗	
Approve / reject referrals	✗	✓ (own hospital)	✗	
Update hospital resources	✗	✓ (own hospital)	✗	
View hospitals	✓ (search)	✓ (own hospital)	✓ (all)	
Approve users	✗	✓ (own physicians)	✓ (all)	
View audit logs	✗	✗	✓	
Approve hospital registrations	✗	✗	✓	
Flag data inaccuracy	✓	✗	✗	

Appendix E: Glossary
Term	Definition
EMT	Emergency Medical Technician — ambulance crew member.
NAS	National Ambulance Service — Ghana's national emergency medical service.
HMS	Hospital Management System — internal hospital software for patient records.
Tier 1 / 2 / 3	Ghana hospital classification: Primary / Secondary / Tertiary care levels.
NHIS	National Health Insurance Scheme — Ghana's public health insurance.
Geohash	Geographic encoding system that converts latitude/longitude to a string for spatial indexing.
SUS	System Usability Scale — standardized usability questionnaire (0–100).
Composite Score	Algorithm output combining capability, proximity, and freshness scores with dynamic weights.
Operator-Dependent Resource	Equipment that requires a trained specialist to operate (e.g., CT scan requires radiologist).
Data Freshness	How recently a hospital's resource data was last updated. Affects scoring via tiered freshness score.

