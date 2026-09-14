import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

const descriptions: Record<string, string> = {
  action: 'Action movies center on physical stakes, fast decisions, and visually driven conflict. Explore MovieFlix titles featuring chases, rescues, combat, daring missions, and heroes pushed into high-pressure situations, with trailers and cast details available from the local catalog.',
  adventure: 'Adventure movies follow journeys beyond the familiar, from expeditions and treasure hunts to survival stories and quests across imagined worlds. Browse MovieFlix for films built around discovery, risk, changing alliances, and the excitement of reaching somewhere new.',
  animation: 'Animation uses illustrated, stop-motion, and computer-generated storytelling to create characters and worlds beyond live action. Discover animated features on MovieFlix across family stories, comedy, fantasy, drama, and visually experimental filmmaking.',
  comedy: 'Comedy movies use timing, personality, misunderstanding, and social observation to entertain. Explore MovieFlix comedies ranging from broad crowd-pleasers and romantic comedy to satire, dark humor, and character-led stories with a lighter point of view.',
  crime: 'Crime movies examine wrongdoing, investigation, power, and consequence through detectives, criminals, institutions, and communities. Browse MovieFlix for heists, police stories, courtroom conflicts, organized crime, and morally complex thrillers.',
  documentary: 'Documentary films explore real people, events, places, and ideas through nonfiction storytelling. Discover MovieFlix documentaries covering culture, history, science, music, sport, politics, nature, and personal testimony, with catalog details and trailers where available.',
  drama: 'Drama movies focus on character, relationships, difficult choices, and emotional change. Browse MovieFlix for intimate personal stories, family conflicts, historical narratives, social issues, and ambitious ensemble films across countries and eras.',
  family: 'Family movies are selected for stories that children and adults can discover together. Explore animation, comedy, adventure, fantasy, and heartfelt drama on MovieFlix, while checking each film page for its available age or content rating.',
  fantasy: 'Fantasy movies introduce magic, mythology, supernatural rules, and imagined worlds into their stories. Discover MovieFlix titles featuring legendary creatures, enchanted journeys, epic conflicts, folklore, and everyday lives transformed by the impossible.',
  history: 'History movies dramatize or document people, societies, and turning points from the past. Browse MovieFlix for royal courts, political movements, wartime experiences, biographies, cultural change, and period stories, noting that dramatic films may interpret real events.',
  horror: 'Horror movies build tension through fear, uncertainty, isolation, supernatural forces, or human threats. Explore MovieFlix for psychological horror, creature features, ghost stories, slashers, folk horror, and genre hybrids, with ratings available where the catalog provides them.',
  music: 'Music movies place performance, musicians, composition, or musical culture at the center of the story. Browse MovieFlix for concert films, artist documentaries, backstage dramas, fictional bands, and narratives shaped by songs and creative ambition.',
  mystery: 'Mystery movies invite viewers to uncover hidden motives, missing information, and competing explanations. Discover MovieFlix films involving investigations, disappearances, secrets, unreliable perspectives, and puzzles that reward close attention.',
  romance: 'Romance movies explore attraction, intimacy, commitment, separation, and the choices that shape relationships. Browse MovieFlix for contemporary love stories, period romance, romantic comedy, bittersweet drama, and films where connection changes a character’s direction.',
  'science-fiction': 'Science fiction movies use technology, space, alternate realities, and imagined futures to examine possibility and consequence. Explore MovieFlix for alien encounters, artificial intelligence, time travel, dystopias, scientific discovery, and speculative adventures.',
  'tv-movie': 'TV movies are feature-length productions created primarily for television or broadcast platforms. Browse MovieFlix for standalone dramas, mysteries, seasonal stories, documentaries, and event productions presented with the same trailer and credit details as the wider catalog.',
  thriller: 'Thriller movies sustain suspense through danger, pursuit, deception, and escalating pressure. Discover MovieFlix titles spanning psychological conflict, espionage, survival, conspiracy, political tension, and crime stories designed to keep outcomes uncertain.',
  war: 'War movies portray armed conflict through soldiers, civilians, leaders, and the societies affected by it. Explore MovieFlix for combat stories, resistance narratives, historical drama, strategic conflict, and personal accounts of survival and loss.',
  western: 'Western movies draw on frontier landscapes, law, migration, survival, and contested ideas of justice. Browse MovieFlix for classic gunslingers, revisionist frontier stories, modern westerns, and dramas shaped by remote communities and harsh terrain.',
};

async function main() {
  const results = await Promise.all(
    Object.entries(descriptions).map(([slug, description]) =>
      prisma.genre.updateMany({ where: { slug }, data: { description } })
    )
  );
  console.log(JSON.stringify({ genresMatched: results.reduce((sum, result) => sum + result.count, 0), configured: Object.keys(descriptions).length }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
