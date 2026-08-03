# User Feedback Loop

## Overview
Direct user feedback is a crucial signal for continuous improvement. This strategy defines how feedback is collected, categorized, and fed into the backlog.

## Feedback Channels
*   **Direct:** "Report an Issue" or "Feedback" button in the footer or UI.
*   **Support/Social:** Emails to support, mentions on Twitter/social media.
*   **Admin:** Feedback from the internal editorial team using the CMS.

## Categorization & Routing

1.  **Bug Reports:**
    *   *Action:* Verify the bug. If reproducible, create a ticket in the Bug Backlog. Assign severity based on the Incident Triage Workflow.
2.  **Feature Requests:**
    *   *Action:* Log in the Feature Backlog. Do not build immediately. Wait to see if multiple users request the same feature to validate demand.
3.  **Content Complaints:** (e.g., "This trailer is in the wrong language," "Release date is wrong")
    *   *Action:* Route directly to the content/admin team for immediate manual correction.
4.  **SEO/Discoverability Complaints:** (e.g., "I couldn't find [Movie] when I searched for it")
    *   *Action:* Review internal search logs. If the movie exists but wasn't found, tune search weights/tags. If it doesn't exist, backfill the content.
5.  **Performance Complaints:** (e.g., "The site is slow on my phone")
    *   *Action:* Log device/browser info. Investigate via synthetic monitoring. Add to Performance Backlog if a systemic issue is identified.
6.  **Admin Usability Feedback:** (From internal team)
    *   *Action:* Treat these as high-priority UX issues, as they directly impact the site's content freshness. Log in the Feature or Bug backlog.

## Prioritization Rules for Feedback
*   **Volume Matters:** A single request for a niche feature is low priority. Ten requests for the same feature elevate its priority.
*   **Severity Over Volume:** One report of a broken checkout or unplayable video outweighs twenty reports of a typo.
*   **Internal vs. External:** Admin feedback that blocks content publishing takes precedence over minor external cosmetic requests.

## Closing the Loop
*   Whenever possible, reply to the user who submitted the feedback (especially for bug fixes or implemented features) to build trust and community.
