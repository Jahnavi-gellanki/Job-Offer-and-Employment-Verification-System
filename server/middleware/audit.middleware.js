const AuditLog = require('../models/AuditLog');

const createAuditLog = async (
  actorId,
  actorEmail,
  action,
  targetType = null,
  targetId = null,
  metadata = {},
  ipAddress = null
) => {
  try {
    const auditRecord = new AuditLog({
      actorId: actorId || null,
      actorEmail: actorEmail || null,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      metadata: metadata || {},
      ipAddress: ipAddress || null,
      timestamp: new Date(),
    });
    await auditRecord.save();
  } catch (error) {
    // Audit log failures should not abort the main operation
    console.error('AuditLog Error:', error.message);
  }
};

module.exports = {
  createAuditLog,
};
