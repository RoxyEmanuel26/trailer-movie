export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only register cleanup handlers on the Node.js runtime (not Edge)
    const { prisma } = await import('@/lib/prisma');
    
    // Attempt graceful shutdown
    const cleanup = async () => {
      console.log('Shutting down server, disconnecting Prisma...');
      await prisma.$disconnect();
      process.exit(0);
    };

    // Attach to termination signals
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  }
}
