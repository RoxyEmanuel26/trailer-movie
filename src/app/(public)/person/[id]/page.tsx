import * as React from "react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function PersonPage({ params }: { params: { id: string } }) {
  const person = await prisma.person.findUnique({
    where: { id: params.id }
  });

  if (!person) return notFound();

  // Top movies stored in JSON field during import
  const movies = Array.isArray(person.topMovies) ? person.topMovies : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": person.name,
    "description": person.biography,
    "image": person.headshotUrl,
    "gender": person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : undefined,
    "birthDate": person.birthday ? person.birthday.toISOString().split('T')[0] : undefined,
    "deathDate": person.deathday ? person.deathday.toISOString().split('T')[0] : undefined,
    "birthPlace": person.placeOfBirth,
    "jobTitle": person.knownForDepartment,
    "knowsAbout": movies.map((m: any) => m.title),
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl mt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
          <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg border bg-muted">
            {person.headshotUrl ? (
              <Image
                src={person.headshotUrl}
                alt={person.name}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
            )}
          </div>
          
          <div className="mt-6 flex flex-col gap-4 bg-muted/30 p-6 rounded-xl border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal Info</h3>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col">
                <dt className="text-muted-foreground font-medium">Known For</dt>
                <dd className="font-semibold">{person.knownForDepartment || 'N/A'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground font-medium">Gender</dt>
                <dd className="font-semibold">{person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : 'Not specified'}</dd>
              </div>
              {person.birthday && (
                <div className="flex flex-col">
                  <dt className="text-muted-foreground font-medium">Birthdate</dt>
                  <dd className="font-semibold">{new Date(person.birthday).toLocaleDateString()} {person.deathday && ` - ${new Date(person.deathday).toLocaleDateString()}`}</dd>
                </div>
              )}
              {person.placeOfBirth && (
                <div className="flex flex-col">
                  <dt className="text-muted-foreground font-medium">Place of Birth</dt>
                  <dd className="font-semibold">{person.placeOfBirth}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{person.name}</h1>
          
          {person.biography && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Biography</h2>
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{person.biography}</p>
              </div>
            </div>
          )}

          {movies.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-6">Known For (Movies)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {movies.map((m: any) => (
                  <div key={m.id} className="group relative flex flex-col gap-2 overflow-hidden">
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted">
                      <Image src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} alt={m.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <h3 className="line-clamp-2 font-medium text-sm leading-tight group-hover:text-primary">{m.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{m.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<import("next").Metadata> {
  const person = await prisma.person.findUnique({
    where: { id: params.id }
  });
  if (!person) return { title: 'Not Found' };
  return {
    title: `${person.name} - Movies & Biography`,
    description: person.biography?.substring(0, 160) || `Learn about ${person.name}'s movies and biography.`,
    openGraph: {
      title: `${person.name} - Movies & Biography`,
      description: person.biography?.substring(0, 160) || '',
      images: person.headshotUrl ? [person.headshotUrl] : [],
    },
  };
}
