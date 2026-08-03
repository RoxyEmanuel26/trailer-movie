# Codebase Organization Strategy

## The Folder Structure

The implementation codebase must reflect the architectural boundaries. A messy folder structure leads to tangled dependencies and impossible maintenance.

### Conceptual Grouping
We follow a feature-based (or domain-based) grouping strategy, rather than a purely technical grouping strategy.

**Instead of:**
```
/components (all components)
/api (all APIs)
/hooks (all hooks)
```

**We use:**
```text
/src
  /features
    /movies
      /components      # MovieCard, MovieHero
      /api             # fetchMovies, updateMovie
      /types           # Movie API schemas
    /auth
      /components      # LoginForm
      /api             # session logic
  /shared
    /ui                # Buttons, Inputs (Design System)
    /lib               # db connection, redis client
```

### Separations of Concern
- **Public vs. Admin:** Admin UI components must never be imported into Public pages. They should remain strictly isolated to prevent accidentally leaking internal CMS logic or large bundle sizes to public users.
- **Services vs. UI:** React components should not contain raw SQL queries or fetch logic. They must call service functions or abstracted hooks located in the feature's `/api` folder.
- **Shared Utilities:** Global utilities (like date formatting or standard error handling) live in `/shared`. Feature-specific logic lives inside the feature module.
