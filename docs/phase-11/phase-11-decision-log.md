# Phase 11 Decision Log

## Analytics & Monitoring Decisions

This document records the major structural and strategic decisions made during Phase 11 to ensure actionable, scalable observability.

| Decision | Rationale | Trade-offs |
| :--- | :--- | :--- |
| **Separation of Logs, Audits, and Analytics** | Dumping everything into one tool (like ELK) makes behavioral queries slow and risks exposing PII in developer logs. Specialization provides better tools for each job and contains blast radiuses. | Requires maintaining integrations with potentially three different systems (e.g., Mixpanel, Datadog, internal audit DB) instead of one. |
| **Anonymous Rolling Session IDs over Persistent Tracking** | Focuses on measuring the quality of the immediate experience (did they find a trailer today?) rather than building long-term invasive profiles across multiple devices. | Reduces the ability to accurately track multi-month retention or Life-Time Value (LTV) if a user clears their cookies or changes devices. |
| **Batch Processing for Business Dashboards** | Real-time streaming analytics are extremely expensive and complex. Knowing the exact number of trailer plays at this precise millisecond is rarely necessary for product decisions compared to a daily summary. | Dashboards will have a built-in delay (e.g., data is 24 hours old). Only system health and security alerts remain real-time. |
| **Discarding Raw IPs in Analytics** | Compliance with GDPR and general privacy best practices. The value of exact IPs for behavioral tracking is low compared to the risk of holding PII. | Prevents retroactive granular geographic analysis or hyper-local abuse blocking via the analytics tool (this must be handled at the WAF level instead). |
| **Percentage-Based Alert Thresholds (vs Static)** | Alerting on "50 errors" is useless if traffic drops to 100 or spikes to 1,000,000. Alerting on "> 1% error rate" adapts to the traffic volume. | Slightly more complex to configure in the alerting system, requiring calculation metrics rather than simple counts. |
