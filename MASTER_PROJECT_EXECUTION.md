# MASTER PROJECT EXECUTION
## Movie Trailer Platform
### Master Instruction for Google AI Antigravity

---

# VERY IMPORTANT

This document overrides every future prompt unless explicitly replaced.

Every future phase must obey every rule written here.

Do NOT ignore this document.

Do NOT simplify this document.

Do NOT reinterpret this document.

---

# PROJECT GOAL

We are building a modern Movie Trailer Platform.

This is NOT a movie streaming website.

This website only provides:

- movie information
- trailer videos
- posters
- genres
- actors
- directors
- ratings
- release information
- recommendations
- search
- SEO pages

No illegal content.

No downloadable movies.

No copyrighted movie hosting.

No embedded piracy websites.

Only legal trailer sources.

---

# DEVELOPMENT PHILOSOPHY

The project must be developed exactly like a professional software company.

Architecture First.

Implementation Second.

Optimization Third.

Never reverse this order.

---

# ABSOLUTE RULES

Before implementing anything:

Research

↓

Architecture

↓

Validation

↓

Approval

↓

Implementation

↓

Testing

↓

Optimization

Never skip a step.

---

# PHASE EXECUTION RULES

Only ONE phase may be active.

Never work on multiple phases simultaneously.

Never anticipate future phases.

Never implement features from future phases.

If information is missing:

STOP.

Explain what is missing.

Wait.

---

# PHASE APPROVAL RULE

Each phase must end with:

Status Summary

Deliverables

Architecture Decisions

Open Questions

Risk Analysis

Next Recommended Step

Then stop.

Do NOT continue automatically.

Wait for approval.

---

# IMPLEMENTATION RULE

Never write production code unless explicitly instructed.

Architecture documents first.

Implementation later.

---

# ARCHITECTURE IS SOURCE OF TRUTH

Implementation must follow architecture.

Architecture never follows implementation.

If implementation conflicts:

Implementation is wrong.

Architecture wins.

---

# CHANGE MANAGEMENT

Every important decision must be documented.

Every architecture change must explain:

Why

Impact

Risk

Alternative

Reason for rejection

---

# DOCUMENT QUALITY

Every markdown file must be:

Professional

Well structured

Easy to read

Long-form

Complete

No fluff

No duplicated sections

No contradictions

---

# WRITING STYLE

Professional software architect.

Not marketing.

Not tutorial.

Not blog style.

---

# FILE ORGANIZATION

Every phase has its own folder.

Never mix documents between phases.

Never overwrite previous documents unless explicitly instructed.

---

# VERSION CONTROL

Every major decision must include:

Version

Date

Reason

Dependencies

Affected documents

---

# RISK MANAGEMENT

Every recommendation must include:

Benefits

Trade-offs

Risks

Mitigation

---

# PERFORMANCE MINDSET

Never optimize prematurely.

Correctness first.

Architecture second.

Performance third.

Micro-optimization is forbidden unless justified.

---

# SECURITY MINDSET

Security is not optional.

Every design decision must consider:

Authentication

Authorization

Secrets

Rate limiting

Input validation

Audit logging

Least privilege

Recovery

---

# SEO MINDSET

SEO is architecture.

Not decoration.

Every page must eventually support:

Metadata

Canonical

Structured Data

Internal Linking

Performance

Indexability

Scalability

---

# MAINTAINABILITY

Assume this project will exist for 10+ years.

Optimize for:

Maintainability

Scalability

Readability

Replaceability

Testability

---

# AI WORKFLOW

Never guess.

Never hallucinate.

Never invent APIs.

Never invent database fields.

Never invent business rules.

If uncertain:

Say it.

---

# OUTPUT FORMAT

At the end of every phase output:

--------------------------------

Completed

Files Created

Important Decisions

Open Questions

Risk Summary

Approval Required

--------------------------------

Then STOP.

---

# DO NOT

Do not code early.

Do not skip documents.

Do not merge phases.

Do not simplify architecture.

Do not create hidden assumptions.

Do not invent features.

Do not ignore previous decisions.

---

# SUCCESS CRITERIA

The project is successful only if:

Architecture is complete.

Documentation is complete.

Implementation follows architecture.

Testing validates implementation.

Deployment follows architecture.

Maintenance follows architecture.

Every decision is traceable.

The project can be continued by another engineer without guessing.

---

# STARTING INSTRUCTION

After reading this document:

Do NOT begin implementation.

Wait for the Phase document.

The first executable document will be:

Phase 1 — Research Architecture

Nothing else.

Presentation Layer (React/UI) tidak boleh mengakses Prisma secara langsung.
API Route tidak boleh berisi business logic.
Business logic hanya berada di Domain Service.
Repository hanya menangani operasi database.
External API (TMDB) hanya boleh diakses melalui TMDB Client.
Tidak boleh ada circular dependency antar layer.