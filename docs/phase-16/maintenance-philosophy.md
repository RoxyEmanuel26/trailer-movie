# Maintenance Philosophy

## Sustainable Engineering

Software is not a bridge; it rots if left alone. The maintenance philosophy dictates how we keep the project healthy long after the initial launch phase is over.

### What Needs Routine Attention
- **Dependencies:** NPM packages must be updated regularly to patch security vulnerabilities.
- **Content:** The editorial team must continuously curate the homepage and remove broken trailer links to maintain SEO value.
- **Monitoring:** Cloud costs and error logs must be reviewed to catch slow-growing issues before they trigger a hard outage.

### What Should Be Left Stable
- Core architectural patterns (e.g., the folder structure, the ORM choice). Constantly refactoring the core simply to chase the newest JavaScript trend introduces immense risk with zero user value.

### High-Risk Changes
- Database schema migrations.
- Changes to authentication middleware.
- Modifying the SEO metadata generation logic.
- *Rule:* These changes require mandatory peer review and execution of the full E2E test suite.

### Preventing Entropy
- **The "Boy Scout" Rule:** Leave the codebase better than you found it. If you are fixing a bug in a file and notice an outdated comment, fix the comment.
- **Scheduled Maintenance Time:** Allocate 10-15% of every sprint/week purely to tech debt reduction, dependency updates, and documentation refinement. Do not wait for a massive "Rewrite" project.
