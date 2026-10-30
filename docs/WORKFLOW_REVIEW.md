# Live organizer and two-competitor workflow review

Method: dual-agent (A: /root/host_workflow_test · B: /root/competitor_workflow_test).

Tested on the production Vercel site on 30 October 2026, Vietnam time. Agent A completed its independent assessment before B's detector findings were shared. The same browser profile was handed over sequentially to avoid cross-account cookie interference. No application source was changed or deployed during this review.

## Verdict

The student demonstration path works end to end. An ordinary student can discover an open tournament from the homepage, join without a code, use the prefilled Python editor, submit, and see real validation, trial results and replay without organizer intervention. Organizer creation works, but its post-create guidance remains less clear. This is a functional demo, with remaining usability issues; it is not a load certification or a test of the official tournament lifecycle.

## Observed results

Fresh test tournament: [QA workflow — 2 competitors](https://oan-tu-ti-ai-arena.vercel.app/competition#e34145d3-bdfa-4221-be34-c296782393d1).

| Scenario | Observation | Result |
|---|---|---|
| Organizer creates a tournament through UI | Prominent creation action, direct enrollment defaults, save acknowledgment, automatic navigation to the saved event. One group, two qualifiers, 40 plies; deadline 3 November at 18:00 Vietnam time. | Pass |
| Competitor 1 discovers and joins | Found the event from homepage without first opening a supplied deep link. Joined without code and reached starter-filled editor. | Pass |
| Competitor 1 submits | Valid verdict, two completed trials: one draw, one loss. Result first observed 17.919 seconds after click. | Pass |
| Competitor 1 revises strategy | New source and submission version, valid verdict, two completed trials, both draws. | Pass |
| Competitor 2 discovers, joins and submits | Separate ordinary account and separate team; own empty history at entry; valid verdict, one draw and one loss. Result first observed 20.713 seconds after click. | Pass |
| Replay and reload | Both accounts opened a replay, advanced from move 0 to 1, and recovered their receipt/results after reload. | Pass |
| Repeat submission/enrollment | UI repeat used the same receipt; supplemental API repeat enrollment kept exactly one membership and the same team. | Pass |
| Account separation | Two distinct one-member teams; competitor 2 did not inherit competitor 1's source/history. Neither account was an administrator or event manager. | Pass |

Totals: **two ordinary accounts, two distinct teams, three valid submissions, three paired trials, six completed trial games, zero game failures**. Trial outcomes are not official tournament scores. Timings above are click-to-first-observed completion upper bounds, including observation/tool delay; they are not execution-time measurements or service guarantees.

## What works

- A first-time competitor's next action is visible: join, use starter code, then **Nộp & đấu thử**.
- Receipt, validation, paired outcomes and replay are linked to the submitted source version. Updating the draft does not alter an earlier result.
- Reload and repeated clicks preserve work and prevent duplicate enrollment/submissions.

The institutional UET identity, board-game vocabulary and flat workbench are specific to this competition and suitable for operating a tournament. The main remaining problem is guidance and state wording, rather than missing happy-path functionality.

## Two priority improvement areas

1. **[P2] Organizer handoff after creation.** Self-enrollment appears before organizer tasks; expanded JSON/config controls dominate, and the inspected view has no clear copy/share invitation action. A first-time host can reasonably think joining their own event is the next required step. Make the competitor link and team/submission progress the main next step, and keep advanced configuration collapsed. Relevant follow-up: `$impeccable onboard` / `$impeccable distill`.
2. **[P2] Student state messaging.** Repeating a completed submission says two games were queued even when an existing completed trial is reused. Reload also briefly calls an authenticated student a guest and shows a login link while account data loads. Use an explicit reused-result message and a neutral account-loading state. Several secondary checking/submission controls add reading effort, though neither tester selected the wrong action. Relevant follow-up: `$impeccable clarify` / `$impeccable harden`.

Minor/unconfirmed observation: the host's native deadline field appeared to revert once when opening advanced rules. Editing the visible JSON restored the intended date and the saved event was correct. The cause and manual reproducibility were not established; treat this as a follow-up observation, not a confirmed persistent defect.

## Organizer heuristic assessment

Agent A scored only the organizer flow. These are qualitative UX scores, not test pass percentages or ratings of student usability. Error recovery was scored conservatively because a failed save was not forced.

| Heuristic | Score / 4 | Main observation |
|---|---:|---|
| Visibility of system status | 3 | Save acknowledgment and saved-event destination are clear. |
| Match with the real world | 2 | Advanced JSON requires technical interpretation. |
| User control and freedom | 3 | Draft/open options and editable configuration. |
| Consistency and standards | 2 | Organizer view retains student-role terminology. |
| Error prevention | 2 | Reasonable defaults, but deadline observation limits confidence. |
| Recognition rather than recall | 2 | Sharing requires relying on the browser URL. |
| Flexibility and efficiency | 3 | Creation is direct with useful defaults. |
| Aesthetic and minimalist design | 2 | Post-create technical controls compete for attention. |
| Error recovery | 2 | No forced save-error recovery test. |
| Help and documentation | 2 | Invitation handoff is insufficiently guided. |
| **Total** | **23 / 40** | **Organizer flow works but needs usability improvement.** |

## Independent detector evidence

Agent B ran the existing source detector once over `app/competition`, `app/student` and `app/page.tsx`, after A completed its assessment. It returned **62 findings: one warning and 61 advisories**: one border-accent warning, 29 color, 29 font-size and three radius advisories. These primarily compare code against the documented scale; they do not establish deployed visual defects or accessibility conformance. Preserved board colors are intentional; the `12px!important` radius finding is likely parser-related. No page overlay was injected or claimed.

## Limits and operating conditions

- Browser testing was desktop, sequential, using an existing live judging worker. No mobile, slow-network, keyboard-only or screen-reader test in this run.
- Public registration prepared the two test credentials; the browser loops then exercised login, discovery, enrollment, submission, results, replay and reload. This does not validate email delivery or the registration UI.
- Invalid Python recovery, quota exhaustion, simultaneous-browser collisions, official freeze/scheduling/publication and standings were not tested.
- The event remains open. The existing `/demo` target and friendly student demo account were untouched. Browser test accounts were signed out and temporary agent tabs closed.
- No installation, application deployment, runtime/image download or direct production database access was used. The Vercel site still depends on the host's judging worker staying powered, online and running Docker.

## Evidence

- [Organizer evidence](submission/evidence/multi-agent-host.json)
- [Competitor evidence](submission/evidence/multi-agent-competitors.json)
- Local screenshots: `.impeccable/review/workflow-host.png` and `.impeccable/review/workflow-competitor.png`.
- Test credentials remain only in ignored `.secrets/`; they are not included here.

Questions skipped: two grouped Priority Issues; this task requested a workflow verdict, and no implementation changes were made.
