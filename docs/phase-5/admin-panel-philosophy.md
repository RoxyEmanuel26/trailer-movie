# Admin Panel Philosophy

## Purpose and Operating Principles
The Admin Panel is the control center for the movie trailer platform. Its primary purpose is to allow editorial staff to curate, verify, and manage content efficiently without requiring engineering intervention.

## What Should Be Easy
- **Repetitive Content Work:** Adding a new trailer link, fixing a typo in a synopsis, or swapping a movie poster should take seconds. Forms should auto-save drafts or use hotkeys to submit.
- **Filtering and Search:** Finding a specific movie from a catalog of thousands must be instantaneous and intuitive.
- **Syncing External Data:** Pulling fresh data from TMDB should be a one-click operation on the movie edit screen.

## What Should Be Hard or Restricted
- **Destructive Actions:** Deleting a movie, a genre, or wiping a homepage section entirely must require a secondary confirmation (e.g., typing the title of the entity) and appropriate permissions.
- **Direct System Overrides:** Actions like clearing the entire global edge cache should be restricted to Super Admins.

## Efficiency over Flashiness
The admin UI must prioritize data density and workflow speed over flashy animations. Dark mode, tabular layouts, dense form fields, and sticky save buttons are preferred to minimize scrolling and context switching.
