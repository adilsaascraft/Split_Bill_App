// /lib/audit/log.ts
import { AuditLog, type AuditAction } from '@/lib/models/AuditLog'
import type { AuthTokenPayload } from '@/lib/auth/session'

export async function writeAuditLog(params: {
  actor: AuthTokenPayload
  action: AuditAction
  entityType: string
  entityId: string
  previousValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}) {
  try {
    await AuditLog.create({
      actorId: params.actor.userId,
      actorRole: params.actor.role,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      previousValues: params.previousValues ?? null,
      newValues: params.newValues ?? null,
      metadata: params.metadata ?? null,
    })
  } catch (err) {
    // Audit logging must never break the primary operation — log and move on.
    console.error('[AUDIT_LOG_FAILED]', err)
  }
}
