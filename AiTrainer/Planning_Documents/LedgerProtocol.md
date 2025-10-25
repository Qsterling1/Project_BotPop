# Ledger Protocol (v1.1)

## Purpose

This document defines the standard procedure for recording, maintaining, and transferring work session information between all contributors — internal agents, external agents, or human collaborators. It ensures continuity, accountability, and clarity across sessions.

---

## 1. Core Principle

All participants must maintain a single, continuous written record of their work in the **Ledger System**. Each session begins by reading the latest ledger entries and ends by updating them. No work should begin or conclude without confirming the ledger is current.

This system acts as **persistent memory** for any agent — human or synthetic — to understand:

* Where the project currently stands.
* Where the project is heading.
* What goals and achievements have been completed.
* What challenges or potential changes exist on the horizon.

---

## 2. Required Ledger Files

```
/Docs/reports/
 ├── living_ledger/                ← active session logs
 ├── living_ledger_archive/        ← archived session logs
 └── MASTER_LEDGER.md              ← master record (chronological)
```

* **Living Ledger:** Temporary session file being updated during active work.
* **Ledger Archive:** Stores completed session ledgers after they are merged.
* **Master Ledger:** Permanent, chronological record of all past sessions.

---

## 3. Session Protocol

### Step 1: Begin Session

1. **Read all planning and project documents** to reorient yourself with the current goals, objectives, and deliverables.
2. **Cross-reference** those documents with the **MASTER_LEDGER.md** to understand what has already been completed, what is ongoing, and what remains unfinished.
3. Read all entries in the **living_ledger** folder and the top entries of the **MASTER_LEDGER.md**.
4. Copy the full content of any living ledger into the **MASTER_LEDGER.md**, at the **top** of the file (newest to oldest order).
5. Move the processed living ledger(s) into the **living_ledger_archive** folder.
6. Create a new, timestamped file in the **living_ledger** folder for your session.

### Step 2: During Session

Update your **session ledger** after every significant request, action, or result.
Each update must include:

* **Name:** Author or agent handling the session.
* **Date & Time:** Local or UTC.
* **Subject Matter:** Short summary of the focus or request.
* **Details:** What was requested, achieved, or discussed.
* **Roadblocks:** Any encountered issues or limitations.
* **Potential Problems:** Future concerns or dependencies.
* **Projections:** Expected outcomes, timelines, or next steps.

If specified by the user or project lead, additional instructions or data may be logged verbatim.

### Step 3: End Session

1. Confirm the session ledger is up to date.
2. Leave **only one** file in the living ledger folder: your final session ledger.
3. Do not edit or rewrite the **MASTER_LEDGER.md** directly — only append via copy-paste from session logs.

---

## 4. Archival Rules

* The **MASTER_LEDGER.md** must always preserve historical order: most recent entries first, oldest last.
* No entry may be rewritten, reformatted, or deleted once recorded.
* Every ledger entry must include at least the author name, date, time, and session summary.

---

## 5. Compliance

All internal, external, and human contributors must follow this protocol **before** beginning any new task or session. The ledger is the first and final point of truth for all collaborative activity.

---

**End of Document**
