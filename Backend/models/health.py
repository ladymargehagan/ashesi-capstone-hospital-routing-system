from core.db import db_cursor


def get_system_health_summary():
    """Returns the system-wide health summary for all hospitals."""
    with db_cursor() as cur:
        # A complex query to aggregate health data per hospital
        # Note: We do a LEFT JOIN to ensure hospitals missing data still show up.
        cur.execute("""
            SELECT 
                h.hospital_id,
                h.name as hospital_name,
                h.status as hospital_status,
                h.level as hospital_level,
                
                -- Latest resource update
                (SELECT MAX(last_updated) FROM hospital_resources WHERE hospital_id = h.hospital_id) as last_resource_update,
                
                -- Active flags count (unresolved, last 30 days)
                (SELECT COUNT(*) FROM hospital_data_flags 
                 WHERE hospital_id = h.hospital_id AND resolved = FALSE 
                 AND created_at >= NOW() - INTERVAL '30 days') as active_flags_count,
                 
                -- Referral volume (Outgoing)
                (SELECT COUNT(*) FROM referrals WHERE referring_hospital_id = h.hospital_id) as outgoing_referrals,
                
                -- Referral volume (Incoming)
                (SELECT COUNT(*) FROM referrals WHERE receiving_hospital_id = h.hospital_id) as incoming_referrals
                
            FROM hospitals h
            ORDER BY active_flags_count DESC, last_resource_update ASC NULLS FIRST
        """)
        rows = cur.fetchall()
        
    return _compute_health_status(rows)


def get_hospital_health_summary(hospital_id: int):
    """Returns the health summary for a specific hospital."""
    with db_cursor() as cur:
        cur.execute("""
            SELECT 
                h.hospital_id,
                h.name as hospital_name,
                h.status as hospital_status,
                h.level as hospital_level,
                
                (SELECT MAX(last_updated) FROM hospital_resources WHERE hospital_id = h.hospital_id) as last_resource_update,
                
                (SELECT COUNT(*) FROM hospital_data_flags 
                 WHERE hospital_id = h.hospital_id AND resolved = FALSE 
                 AND created_at >= NOW() - INTERVAL '30 days') as active_flags_count,
                 
                (SELECT COUNT(*) FROM referrals WHERE referring_hospital_id = h.hospital_id) as outgoing_referrals,
                
                (SELECT COUNT(*) FROM referrals WHERE receiving_hospital_id = h.hospital_id) as incoming_referrals
                
            FROM hospitals h
            WHERE h.hospital_id = %s
        """, (hospital_id,))
        row = cur.fetchone()
        
    if not row:
        return None
        
    return _compute_health_status([row])[0]


def _compute_health_status(rows):
    """Business logic to compute Data Health state based on raw database stats."""
    import datetime
    results = []
    
    now = datetime.datetime.now()
    threshold_days = 7
    flag_threshold = 3
    
    for r in rows:
        data = dict(r)
        
        # Base status
        health_state = "Healthy"
        issues = []
        
        # Check staleness
        stale = False
        if not data["last_resource_update"]:
            issues.append("Never Updated Resources")
            stale = True
        else:
            diff = now - data["last_resource_update"]
            if diff.days > threshold_days:
                issues.append(f"Resources Stale (> {threshold_days} days)")
                stale = True
                
        # Check flags
        high_flags = False
        if data["active_flags_count"] >= flag_threshold:
            issues.append(f"High Active Flags ({data['active_flags_count']})")
            high_flags = True
            
        # Determine strict health status
        if data["hospital_status"] == "inactive":
            health_state = "Inactive"
        elif stale or high_flags:
            health_state = "Warning"
            if stale and high_flags:
                health_state = "Critical"
                
        data["computed_health"] = health_state
        data["health_issues"] = issues
        
        # Convert datetime formatting for JSON output
        if data["last_resource_update"]:
            data["last_resource_update"] = data["last_resource_update"].isoformat()
            
        results.append(data)
        
    return results


def execute_system_audit(triggered_by_user_id: int):
    """
    Evaluates all hospitals for health issues and logs system alerts.
    Sends notifications to all super admins.
    """
    summaries = get_system_health_summary()
    stale_hospitals = []
    critical_hospitals = []
    
    for s in summaries:
        if s["computed_health"] == "Warning" and s["hospital_status"] != "inactive":
            stale_hospitals.append(s["hospital_name"])
        elif s["computed_health"] == "Critical" and s["hospital_status"] != "inactive":
            critical_hospitals.append(s["hospital_name"])
            
    alerts = []
    if not stale_hospitals and not critical_hospitals:
        alerts.append("System Audit Complete: All active hospitals possess healthy data freshness.")
    else:
        if stale_hospitals:
            alerts.append(f"Data Staleness Warning: {len(stale_hospitals)} hospitals have not updated resources recently.")
        if critical_hospitals:
            alerts.append(f"Critical Data Integrity: {len(critical_hospitals)} hospitals have severe staleness combined with active data inconsistency flags.")
            
    message = " | ".join(alerts)
    
    with db_cursor() as cur:
        # Create an Audit Log entry
        cur.execute("""
            INSERT INTO audit_logs (user_id, action, entity_type, details)
            VALUES (%s, 'SYSTEM_AUDIT', 'SYSTEM', %s)
            RETURNING log_id
        """, (triggered_by_user_id, '{"result": "' + message + '"}'))
        
        # Notify all super_admins
        cur.execute("""
            SELECT u.user_id FROM users u
            JOIN role r ON u.role_id = r.role_id
            WHERE r.role_name = 'super_admin'
        """)
        super_admins = cur.fetchall()
        
        for sa in super_admins:
            cur.execute("""
                INSERT INTO notifications (user_id, message, type)
                VALUES (%s, %s, 'data_flagged')
            """, (sa["user_id"], f"System Audit: {message}"))
            
    return {"success": True, "alerts_generated": len(stale_hospitals) + len(critical_hospitals), "summary": message}
