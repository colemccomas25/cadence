# Week 8 — Your action items

## 1. Record the demo video

90 seconds max. Use Loom (free) or OBS.

Show this exact flow:
1. Add a student (name, instrument, rate, parent email)
2. Schedule a recurring weekly lesson on the calendar
3. Mark a lesson as held
4. Generate an invoice → show the email that goes to the parent
5. Show the dashboard with the paid status

Upload to Loom and paste the embed ID into this block in `app/src/app/page.tsx`:

```tsx
{/*
<div className="mt-8 rounded-2xl overflow-hidden aspect-video">
  <iframe
    src="https://www.loom.com/embed/YOUR_VIDEO_ID_HERE"
    allowFullScreen
    className="w-full h-full border-0"
  />
</div>
*/}
```

Uncomment the block and replace `YOUR_VIDEO_ID_HERE` with your Loom video ID.

---

## 2. Send the cold email to music teacher associations

**Subject:** Free tool for your members who teach private lessons

Hi [Name],

I'm Cole — I built Cadence, a scheduling and invoicing tool built specifically for private music teachers (not "lesson businesses," not general scheduling apps).

It handles the things your members actually do every week: recurring weekly slots, monthly invoicing via Stripe, 24-hour parent reminders, and make-up lesson tracking. Setup takes 10 minutes.

It's free for up to 5 students. I'm offering members of [Association Name] a free Solo plan (normally $19/month) for 3 months — no credit card, no commitment.

Would you be open to sharing it in your next newsletter or member email? Happy to write a short blurb or answer any questions.

— Cole
cole@cadence.app | cadence.app

**Target list:**
- MTNA (Music Teachers National Association) — mtna.org
- NAfME state chapters — nafme.org/about/societies-and-councils/
- Local music teacher guilds (search "[your state] music teachers association")
- Piano Teachers Guild

---

## 3. Run the 5-second test

Show the landing page to one friend (ideally a music teacher, but anyone works).

Ask two questions:
1. "What does this product do?"
2. "What would you do next?"

If they can't answer both in 5 seconds, the hero needs work. Report back and we'll fix it.
