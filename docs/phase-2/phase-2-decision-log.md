# Phase 2 Decision Log

This document records the major design decisions and trade-offs made during Phase 2 to ensure visual consistency moving forward.

## DECISION 001: Dark Mode Exclusive
- **Decision:** The application will not offer a "Light Mode" toggle. It is exclusively designed for a dark interface.
- **Reasoning:** A dark interface provides the highest contrast for video playback and vibrant movie posters (similar to a movie theater). Supporting dual themes adds massive CSS complexity and design overhead for a feature that doesn't align with the cinematic brand identity.
- **Trade-off:** Some users prefer reading text on light backgrounds in daylight conditions. 

## DECISION 002: Video Facades Over Direct Iframes
- **Decision:** The design system mandates a "Facade" component for all trailers (an image that looks like a video player, which only loads the actual iframe upon being clicked).
- **Reasoning:** Embedding a raw YouTube iframe downloads over 500kb of JavaScript and delays the initial page render. Facades are instantaneous.
- **Trade-off:** Requires an extra click from the user to start the video (Click facade -> Click YouTube play button), though we can mitigate this by passing `autoplay=1` when swapping the DOM element.

## DECISION 003: Fixed Aspect Ratios for Grid Assets
- **Decision:** All movie posters must strictly adhere to a `2:3` aspect ratio, and backdrops/facades to `16:9`. Any non-conforming images must be cropped (`object-fit: cover`) via CSS.
- **Reasoning:** Prevents the "masonry" effect where grid rows become uneven, which looks messy and unprofessional. It also prevents Cumulative Layout Shift (CLS) by allowing the browser to reserve the exact pixel space before the image loads.
- **Trade-off:** Some posters might have text or logos cropped off at the edges if the source material is incorrectly proportioned.

## DECISION 004: Fluid Width Admin, Max-Width Public
- **Decision:** The Admin panel will expand to `100vw`, while the Public site is capped at `1440px`.
- **Reasoning:** Admin tables require maximum horizontal space to display complex datasets without excessive horizontal scrolling. The public site looks broken if text lines stretch across an ultrawide monitor, hence the constraint.
- **Trade-off:** The developer must maintain two separate structural layout wrappers.

## DECISION 005: Standardizing on "Primary Brand Red"
- **Decision:** `#E50914` was chosen as the primary action color.
- **Reasoning:** Red is universally associated with the theater experience, recording, and prominent streaming platforms (Netflix, YouTube). It commands attention against a dark background.
- **Trade-off:** Red is also semantically associated with "Error" or "Destructive" actions. We must rely on icons and contextual placement to differentiate a "Play Video" red button from a "Delete Movie" red button.
