# Risk Acceptance Model

## Overview
No software project launches with zero risk. The goal of the final audit is not to eliminate all risk, but to identify it, quantify it, and explicitly decide whether to accept it.

## Categories of Risk

### 1. Unacceptable Risks
*   **Definition:** Risks that violate core business requirements, legal compliance, or user safety.
*   **Examples:** Hardcoded database credentials in the frontend; a broken checkout flow; a known exploit allowing unauthorized admin access.
*   **Action:** Must be mitigated (fixed) before master sign-off. Cannot be accepted.

### 2. Acceptable Residual Risks
*   **Definition:** Known issues that have a low probability of occurrence and low impact, where the cost of fixing outweighs the benefit.
*   **Examples:** A minor UI glitch on IE11; a theoretical race condition in a non-critical analytics tracking script.
*   **Action:** Formally accepted by the Product Owner and Lead Engineer. Documented in the Decision Log.

### 3. Deferred Risks
*   **Definition:** Significant risks that cannot be fixed immediately due to time/budget constraints, but must be addressed shortly after launch.
*   **Examples:** Lack of a multi-region database failover; unoptimized images causing slower load times on 3G networks.
*   **Action:** Accepted *temporarily*. Must be accompanied by a prioritized ticket in the technical debt backlog with an SLA for resolution.

### 4. Temporary Mitigations
*   **Definition:** A "band-aid" fix applied to reduce an unacceptable risk to an acceptable level until a permanent fix can be built.
*   **Examples:** Disabling a feature entirely because it has a security flaw, rather than delaying the whole launch to fix the feature.

## Explicit Sign-Off of Accepted Risk
Risk acceptance cannot be implicit ("we knew about it and launched anyway"). It requires explicit, written sign-off from the business stakeholder (Product Owner/Client), acknowledging that they understand the technical risk being accepted.

## Escalation
If the Lead Engineer and the Product Owner disagree on whether a risk is acceptable (e.g., Engineering deems a security flaw unacceptable, but Product wants to launch), the issue must be escalated to executive leadership for a final, documented decision.
