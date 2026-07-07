---
title: "Building One Stop for my own family first."
date: 2026-06-20
category: Software
excerpt: "Why I built our financial hub for us before anyone else — and what that taught me about trust."
readTime: 6
---

Most of the software I've shipped had a client on the other end of it. One Stop didn't. I built it because my wife and I had our financial picture spread across six logins and a shared notes doc that was perpetually out of date, and I was tired of it.

## Building for an audience of two

There's a particular kind of pressure that goes away when your only users are people who already trust you completely — and a different kind that shows up in its place. No one was going to file a bug report if the net worth chart was wrong. But if it was wrong, we'd make a real decision based on bad information. That's a much higher bar than "don't crash."

It changed how I built:

- Every number traces back to a source I can explain out loud.
- Nothing gets a "trust me" — if I can't verify it, it doesn't ship.
- The contingency guide (the "in case I die" section) got built before anything flashy, because it's the part that actually matters if something goes wrong.

## What it taught me

Building for people who depend on you is a different discipline than building for people who evaluate you. I'd recommend every developer build one real tool for someone they love before they build one for a stranger. It resets what "good enough" means.
