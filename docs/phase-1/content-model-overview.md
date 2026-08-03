# Content Model Overview

The following outlines the core entities required for the platform. This is a conceptual model to guide database and CMS design in Phase 2.

## 1. Movie
The central entity of the application. Everything revolves around the movie.
- **Title** (String)
- **Slug** (String) - URL-friendly identifier (e.g., `dune-part-two-2024`).
- **Synopsis** (Text) - Brief description of the plot.
- **Release Date** (Date) - Official theatrical or streaming release date.
- **Poster Image URL** (String) - Vertical artwork.
- **Backdrop Image URL** (String) - Horizontal artwork for headers/heroes.
- **Status** (Enum) - e.g., Published, Draft, Archived.
- **Featured** (Boolean) - Flag to pin the movie to the homepage hero section.

## 2. Trailer
Represents the actual video content. A movie can have multiple trailers (Teaser, Main Trailer, Featurette).
- **MovieID** (Foreign Key) - Associates the video with a Movie.
- **Video Source ID** (String) - e.g., YouTube Video ID (`dQw4w9WgXcQ`).
- **Type** (Enum) - Teaser, Official Trailer, Red Band, Featurette.
- **Duration** (Integer) - Length in seconds.
- **Published Date** (Date) - When the trailer was released.
- **Is Primary** (Boolean) - Flags which trailer should auto-load on the movie detail page.

## 3. Genre
Used to categorize and filter movies.
- **Name** (String) - e.g., Action, Sci-Fi, Horror.
- **Slug** (String) - URL identifier (e.g., `sci-fi`).
- **Description** (Text) - Brief SEO-friendly text describing the genre.

## 4. Person (Actor / Director)
Metadata to enrich the movie detail page and provide future filtering capabilities.
- **Name** (String)
- **Image URL** (String)
- **Slug** (String)

## 5. Movie_Person (Pivot Entity)
Defines the relationship between a Movie and a Person.
- **MovieID** (Foreign Key)
- **PersonID** (Foreign Key)
- **Role** (Enum) - e.g., Director, Actor, Writer.
- **Character Name** (String) - If the role is Actor.

## 6. Admin User
Used for secure access to the CMS.
- **Email** (String)
- **Password Hash** (String)
- **Role** (Enum) - e.g., Super Admin, Editor.

---

## High-Level Relationships
- A **Movie** can have *Many* **Trailers**.
- A **Movie** can belong to *Many* **Genres** (Many-to-Many).
- A **Movie** involves *Many* **Persons** (Many-to-Many via `Movie_Person`).
