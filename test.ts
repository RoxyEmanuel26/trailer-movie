import { prisma } from './src/lib/prisma';
async function main() {
  try {
    const movie = await prisma.movie.create({
      data: {
        title: "Test Movie",
        slug: "test-movie-1234",
        budget: 1000,
        revenue: 2000
      }
    });
    console.log("Success:", movie.id);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.();
  }
}
main();
