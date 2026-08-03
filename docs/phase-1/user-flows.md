# User Flows

## 1. First-Time Visitor (Organic / Social)
**Context:** A user discovers the site via a Google search for a specific trailer or a shared link on social media.
- **Entry Point:** Movie Detail Page (e.g., `/movie/dune-part-two`).
- **Main Action:** Watches the embedded trailer and reads the synopsis/release date.
- **Next Action:** Clicks on a genre tag (e.g., "Sci-Fi") or the site logo to browse more movies.
- **Exit Point:** Closes the tab after satisfying their immediate curiosity, or continues browsing other trending trailers.

## 2. Returning Visitor
**Context:** A user who knows the brand and visits directly to see what's new.
- **Entry Point:** Homepage (`/`).
- **Main Action:** Browses the "Latest Additions" and "Trending Now" sections.
- **Next Action:** Clicks on an appealing movie poster to view the trailer.
- **Exit Point:** Leaves the site after catching up on new releases.

## 3. Search User
**Context:** A user visits the site specifically looking for a trailer they heard about.
- **Entry Point:** Homepage or any page with the global navigation bar.
- **Main Action:** Clicks the search icon, types "Inception", and selects the movie from the autocomplete dropdown.
- **Next Action:** Arrives at the Movie Detail Page and watches the trailer.
- **Exit Point:** Completes their goal and exits.

## 4. Genre Browsing User
**Context:** A user looking for a specific type of movie but doesn't have a title in mind (e.g., "I want to see upcoming horror movies").
- **Entry Point:** Homepage.
- **Main Action:** Clicks "Horror" in the navigation or a "Browse by Genre" section.
- **Next Action:** Arrives at the `/genre/horror` page, scrolls through the grid of horror movie posters, and clicks one.
- **Exit Point:** Watches the trailer on the Movie Detail Page and potentially returns to the genre list for more.

## 5. Admin / Content Manager User
**Context:** A staff member responsible for keeping the site updated with the latest releases.
- **Entry Point:** Secure login URL (e.g., `/admin/login`).
- **Main Action:** Clicks "Add New Movie", fills in metadata (Title, Synopsis, Release Date), uploads poster/backdrop, and pastes the YouTube trailer URL.
- **Next Action:** Previews the post and clicks "Publish".
- **Exit Point:** Logs out or returns to the admin dashboard to add another movie.
