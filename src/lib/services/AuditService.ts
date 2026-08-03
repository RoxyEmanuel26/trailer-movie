import { AuditRepository } from "../repositories/AuditRepository";

export class AuditService {
  static async listLogs(entityType: string, entityId: string) {
    return AuditRepository.listByEntity(entityType, entityId);
  }
}
