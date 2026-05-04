# 09 — The Week 7 Prompt

Paste this into Claude Code from inside `C:\Cole Personal\cadence\app\`. It assumes Claude Code can read the docs folder and edit your code.

---

## The prompt

```
I'm doing a UI polish pass on Cadence (a Next.js 15 + Tailwind + shadcn SaaS for
private music teachers). The full playbook and prioritized punch list are in
../docs/07-ui-design-playbook.md and ../docs/08-week7-punchlist.md. Read both
before doing anything.

Then work through the 7 tasks in 08-week7-punchlist.md in order. For each task:

1. First, read the relevant existing files in src/ and tell me what you'll change
   in 1–3 bullet points. Do not edit yet.
2. Wait for me to say "go".
3. Then make the edits. Use the Edit tool, not Write — I want to see diffs.
4. After each task, run `npm run typecheck` and `npm run lint` and fix anything
   broken. Do not ship type errors.
5. Mark the task done by ticking it off in 08-week7-punchlist.md and move to the next.

Constraints (do not violate without asking):
- Do not change the indigo brand color. Add a new --cta variable (orange #f97316)
  used ONLY for primary buttons.
- Do not add new dependencies except: sonner (toasts), lucide-react (icons — may
  already be in package.json).
- Do not refactor unrelated files. Stay laser-focused on the punch list task.
- Keep mobile-first: every change must work at 375px width.
- Use Tailwind utilities, not raw CSS. Use CSS variables in globals.css for
  colors and spacing tokens.
- Server Actions for mutations, not API routes.
- Use react-hook-form + zod for forms (already in package.json).

Quality bar:
- Every form has loading state + inline validation + toast on success.
- Every empty view uses the EmptyState component with title + body + CTA.
- Touch targets are ≥48px on mobile.
- No horizontal scroll at 375px on any page.
- Lighthouse Performance ≥90 on mobile after task #7.

Start by reading the two doc files and showing me your plan for task #1
(mobile pass at 375px). Then wait.
```

---

## How to use it

1. Open Claude Code.
2. `cd C:\Cole Personal\cadence\app`.
3. Paste the prompt above (everything inside the code block).
4. Claude Code will read the playbook and propose its plan for task #1.
5. Reply `go` when you approve.
6. Repeat through all 7 tasks.

## Why this prompt works

- **Forces it to read the research first** — so it applies your specific principles, not generic advice.
- **Gates each task with a plan-first step** — you stay in control, costs stay predictable.
- **Hard constraints** prevent it from rebranding, adding random libraries, or refactoring stuff you didn't ask about.
- **Quality bar with measurable checks** — Lighthouse score, 375px width, contrast — so "done" is verifiable.
- **Marks tasks complete in the punch list itself** — so progress is tracked in a file you can re-open later.

## If you'd rather use one prompt at a time

If you only want to do one task this session, swap the middle paragraph for:

```
Then do ONLY task #2 from 08-week7-punchlist.md (empty states). Read the relevant
existing files first, show me your plan, wait for "go", then edit. Run typecheck
and lint after, fix anything broken.
```

Replace `#2` with whichever task you want to tackle.
