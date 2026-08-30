require('dotenv').config({ path: '.env' });

const { importQueueWorker } = require('./src/lib/jobs/ImportQueueWorker');
const { prisma } = require('./src/lib/prisma');
const { ImportJobStatus } = require('@prisma/client');

async function runTest() {
  console.log('--- STARTING AUTO-PROCESS QUEUE TEST ---');
  await prisma.importJob.deleteMany({ where: { tmdbId: 27205 } });
  const job = await prisma.importJob.create({
    data: { tmdbId: 27205, status: 'PENDING' }
  });
  console.log('Job created with ID:', job.id);
  await importQueueWorker.processNextBatch();
  const updatedJob = await prisma.importJob.findUnique({ where: { id: job.id } });
  console.log('Job status after processing:', updatedJob?.status);
}
runTest().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
