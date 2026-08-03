# Future AI-Assisted Admin Tools

While the MVP relies on manual curation and TMDB data, the admin architecture is designed to support AI tooling in the future to drastically speed up editorial workflows.

## 1. Auto-Title & Meta Generation (SEO)
- **Concept:** An editor writes a custom synopsis. Next to the "Meta Title" and "Meta Description" fields is a "✨ Generate" button.
- **Implementation:** The UI hits an internal API route which calls an LLM (e.g., OpenAI API) passing the title and synopsis, returning an SEO-optimized meta payload that fits perfectly within the character limits.

## 2. Tag / Genre Generation
- **Concept:** A "✨ Suggest Tags" button on the Movie Edit screen. 
- **Implementation:** Analyzes the synopsis and cast to recommend relevant custom collections or micro-genres (e.g., "Space Opera", "Gritty Reboot").

## 3. Duplicate Detection
- **Concept:** An AI embedding model that runs during the TMDB import process.
- **Implementation:** If an admin tries to import a movie that shares an 85%+ semantic similarity to an existing record, the UI halts and says "This looks like a duplicate of [Existing Movie]. Are you sure you want to proceed?"

## 4. Content Quality Scoring
- **Concept:** A visual gauge (Red/Yellow/Green) on the dashboard indicating the "richness" of a movie page.
- **Implementation:** An AI evaluates if the synopsis is too short, if high-res posters are missing, or if SEO fields are blank, assigning a "Completeness Score" to help prioritize editorial work.
