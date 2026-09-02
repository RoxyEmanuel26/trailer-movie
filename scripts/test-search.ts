import googlethis from 'googlethis';

async function test() {
  try {
    console.log('Searching...');
    const response = await googlethis.search('The Godfather 1972 movie synopsis', { page: 0, safe: false, additional_params: { hl: 'en' } });
    console.log(response);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
