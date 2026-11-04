import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUTPUT_TAR = path.join(ROOT, 'movieflix-source.tar.gz');
const STAGING_DIR = path.join(ROOT, '.source-staging');

function log(msg: string) {
  console.log(`\x1b[36m[Source Pack]\x1b[0m ${msg}`);
}

function copyRecursiveSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  log('Step 1/3: Preparing clean staging folder for source code...');
  if (fs.existsSync(STAGING_DIR)) {
    fs.rmSync(STAGING_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(STAGING_DIR, { recursive: true });

  const includeDirs = ['src', 'public', 'prisma', 'scripts'];
  const includeFiles = [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'next.config.ts',
    'tsconfig.json',
    'components.json',
    'postcss.config.mjs',
    'prisma.config.ts',
    'start.sh',
    '.gitattributes'
  ];

  for (const d of includeDirs) {
    const srcDir = path.join(ROOT, d);
    if (fs.existsSync(srcDir)) {
      log(`Copying directory: ${d}`);
      copyRecursiveSync(srcDir, path.join(STAGING_DIR, d));
    }
  }

  for (const f of includeFiles) {
    const srcFile = path.join(ROOT, f);
    if (fs.existsSync(srcFile)) {
      log(`Copying file: ${f}`);
      copyRecursiveSync(srcFile, path.join(STAGING_DIR, f));
    }
  }

  // Copy .env.production.local or .env, ensuring internal Docker DB host is used
  const envSource = fs.existsSync(path.join(ROOT, '.env.production.local'))
    ? path.join(ROOT, '.env.production.local')
    : path.join(ROOT, '.env');

  if (fs.existsSync(envSource)) {
    log('Configuring environment files for internal NuraHost network...');
    let rawEnv = fs.readFileSync(envSource, 'utf8');
    rawEnv = rawEnv.replace(
      /@nano-1\.(nura\.host|nurahost\.com):5112/g,
      '@461b710f-642a-4ea8-af0a-668edcfa5d6a.pterodactyl_nw:5112'
    );
    // Ensure Google verification and SEO indexing keys are present
    if (!rawEnv.includes('GOOGLE_SITE_VERIFICATION=')) {
      rawEnv += '\nGOOGLE_SITE_VERIFICATION="v2Cbd4dYoP-RAJi4ThQSTcrnAX6WlN_xEIIF8dhzjV8"\n';
    }
    if (!rawEnv.includes('SEO_INDEXING_ENABLED=')) {
      rawEnv += '\nSEO_INDEXING_ENABLED="true"\n';
    }
    if (!rawEnv.includes('INDEXNOW_KEY=')) {
      rawEnv += '\nINDEXNOW_KEY="014b76f401bfd193126b9e04845499de"\n';
    }

    fs.writeFileSync(path.join(STAGING_DIR, '.env.production.local'), rawEnv, 'utf8');
    fs.writeFileSync(path.join(STAGING_DIR, '.env'), rawEnv, 'utf8');
  }

  // Ensure start.sh has Unix line endings and executable mode
  const startShPath = path.join(STAGING_DIR, 'start.sh');
  if (fs.existsSync(startShPath)) {
    const content = fs.readFileSync(startShPath, 'utf8').replace(/\r\n/g, '\n');
    fs.writeFileSync(startShPath, content, { encoding: 'utf8', mode: 0o755 });
  }

  log('Step 2/3: Compressing source code into movieflix-source.tar.gz...');
  if (fs.existsSync(OUTPUT_TAR)) {
    fs.unlinkSync(OUTPUT_TAR);
  }

  execSync(`tar.exe -czf "${OUTPUT_TAR}" -C "${STAGING_DIR}" .`, { stdio: 'inherit' });

  // Cleanup staging dir
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });

  if (fs.existsSync(OUTPUT_TAR)) {
    const stats = fs.statSync(OUTPUT_TAR);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('\n\x1b[32m============================================================');
    console.log(`[SUCCESS] Source package created: movieflix-source.tar.gz (${sizeMb} MB)`);
    console.log('============================================================\x1b[0m\n');
    console.log('Cara Deploy ke NuraHost:');
    console.log('1. Buka File Manager di panel NuraHost.');
    console.log('2. Hapus semua file lama di NuraHost (agar bersih).');
    console.log('3. Drag & drop file "movieflix-source.tar.gz" ke File Manager.');
    console.log('4. Klik tombol titik tiga (...) -> pilih "Unarchive".');
    console.log('5. Hapus file "movieflix-source.tar.gz" setelah diekstrak.');
    console.log('6. Di tab "Startup" NuraHost, pastikan CUSTOM STARTUP diisi: bash start.sh');
    console.log('7. Klik "Restart" di Console. NuraHost akan otomatis meng-install dependensi dan mem-build website di server Linux secara native!\n');
  } else {
    throw new Error('Failed to create movieflix-source.tar.gz');
  }
}

main().catch((err) => {
  console.error('\x1b[31m[Source Pack Error]\x1b[0m', err);
  process.exit(1);
});
