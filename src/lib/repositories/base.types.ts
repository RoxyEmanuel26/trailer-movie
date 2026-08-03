import { PrismaClient } from '@prisma/client';

/**
 * Type representing either the main PrismaClient or a Transactional client.
 * This allows Repositories to be agnostic of whether they are running inside a transaction.
 */
export type DbClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
