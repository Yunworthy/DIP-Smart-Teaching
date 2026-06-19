// Audit logging utility
function logAudit(db, { user_id, username, action, resource_type, resource_id, detail, ip_address, user_agent }) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, detail, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id || null, username || null, action, resource_type || null, resource_id || null, detail || null, ip_address || null, user_agent || null);
    db.save();
  } catch(e) {
    console.error('Audit log error:', e.message);
  }
}

module.exports = { logAudit };
