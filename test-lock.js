require('dotenv').config({ path: '.env' });
const { prisma } = require('./src/lib/prisma');
async function run() {
  const limit = 5;
  const jobs = await prisma.$queryRaw\
    UPDATE "import_jobs"
    SET status = 'IN_PROGRESS'
    WHERE id IN (
      SELECT id FROM "import_jobs"
      WHERE status = 'PENDING'
      ORDER BY "createdAt" ASC
      LIMIT \
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, "tmdbId"
  \;
  console.log(jobs);
}
run().then(() => process.exit(0));
