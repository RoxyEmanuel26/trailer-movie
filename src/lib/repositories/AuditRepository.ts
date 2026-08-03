import { Prisma, AuditActionType } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class AuditRepository {
  static async log(
    data: {
      userId?: string;
      actionType: AuditActionType;
      entityType: string;
      entityId: string;
      oldValues?: any;
      newValues?: any;
      ipAddress?: string;
    },
    db: DbClient = prisma
  ) {
    return db.auditLog.create({
      data: {
        userId: data.userId,
        actionType: data.actionType,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues ? (data.oldValues as any) : Prisma.DbNull,
        newValues: data.newValues ? (data.newValues as any) : Prisma.DbNull,
        ipAddress: data.ipAddress,
      },
    });
  }

  static async listByEntity(entityType: string, entityId: string, db: DbClient = prisma) {
    return db.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
