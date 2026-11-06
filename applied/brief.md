# Applied: brief

## Purpose
(Why you are building it. Write the real reason, for example: you are applying
for several jobs and need deadlines, statuses and required documents in one place.)

## Audience
Me first. Anyone job hunting who wants a simple, private tracker.

## Requirements
Must: add, edit and delete applications; store them in the browser; deadline and status for each;
document checklist; filter by status; keyboard and screen reader friendly; works on phones
Should: sort by deadline; highlight deadlines in the next 7 days; export to CSV
Could: print view; notes search

## Out of scope
Accounts, a server, syncing between devices, email reminders.

## Privacy decision
No server. Data is saved only in this browser (localStorage), so nothing is uploaded.
Consequence: clearing browser data deletes the list, so the app will offer an export.

## Success measures
Passes the HTML validator; WAVE reports 0 errors; Lighthouse 90+ in all four categories;
passes my test table.