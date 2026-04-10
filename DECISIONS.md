# Architecture Decision Record
A log of major architectural and design decisions made over the life of this project.

---

## 2026-04-10
- Edit Review uses a separate modal (not the existing review modal) to keep the "mark complete" flow and "edit review" flow independent
- Editing a completed card's category updates stored data only — card stays in Completed section and does not revert to open
- Settings dropdown closes on outside click via a single global document listener rather than per-card listeners
- All modal JS follows the same static HTML + `.hidden` class pattern established in v2
