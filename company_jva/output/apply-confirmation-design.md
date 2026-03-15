# Apply Confirmation Step — Design Brief

> Purpose: Add a simple pre-check before students submit an application, to filter out common mismatches (location, eligibility) before they reach companies.
> Created: 2026-03-13

---

## Problem

Students who are overseas, not in Tokyo, or without valid work authorization in Japan are submitting applications — which get rejected immediately. This wastes company review time and generates false application numbers.

---

## Proposed Solution

Add **confirmation questions** between "I want to apply" and the actual application form. The specific questions depend on each company's requirements.

If a student answers **No** to a required question → show a soft block message and do not proceed to the form.

---

## Question Examples by Position Type

> **These are examples. Questions should be tailored to each company's actual requirements.**

### For Tokyo in-person roles:
```
Q: Can you work in-person in Tokyo on a regular basis?

  ○ Yes, I'm based in Tokyo or able to commute
  ○ No, I'm overseas or not able to commute
```

### For roles requiring work authorization:
```
Q: Do you have valid work authorization in Japan?
   (e.g. student visa with part-time work permit, or working visa)

  ○ Yes, I have valid work authorization
  ○ No / I'm not sure
```

### For roles with Japanese language requirements:
```
Q: What is your Japanese level?

  ○ N3 or above
  ○ N4 / N5 / Beginner
  ○ No Japanese
```

### Combine as needed:
```
For a Tokyo in-person role that requires work auth:
  → Use the Tokyo question + the work auth question
  → Both must be Yes to proceed
```

---

## Logic

```
All required answers = Yes  →  Proceed to application form ✅
Any required answer = No    →  Show block message ❌
```

**Block message (example):**

```
Sorry, this position requires applicants to [specific requirement].

If your situation changes, we'd love to hear from you!
Feel free to stay connected via our LINE community.
```

---

## Where to Implement

| Option | Effort | Recommended? |
|--------|--------|--------------|
| Google Form — add questions at top with branching logic | Low | ✅ Easiest — do this first |
| LINE message before link — ask via LINE chat before sharing apply link | Low | ✅ Good for manual control |
| Dedicated pre-screen page (simple HTML or Notion) | Medium | Later |
| LINE Bot automated flow | High | Future state |

**Recommended for now:** Add Q1 and Q2 as the **first 2 questions in the Google Form** with "required" and section branching — students who answer No are redirected to an end page with the block message.

---

## Expected Impact

- Reduce mismatched applications reaching companies
- Improve company response rate (fewer irrelevant CVs to review)
- Improve match rate by increasing signal quality of the application pool

---

## Owner & Timeline

| Task | Owner | Deadline |
|------|-------|---------|
| Update Google Form with Q1 + Q2 + branching | TBD | 2026-03-17 |
| Update LINE message to mention Tokyo-based requirement | TBD | 2026-03-17 |
| Monitor impact on application quality (W10 review) | IB team | 2026-03-24 |
