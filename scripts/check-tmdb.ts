import { getMovieExtra } from '../src/lib/tmdb/api';

async function check() {
  try {
    const movie1 = await getMovieExtra(1747222);
    console.log(movie1.title);
  } catch(e) {
    console.log('1747222 error:', e.message || String(e));
  }
}
check();
