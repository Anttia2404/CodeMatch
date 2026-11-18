# User flows

## Implemented learner flow (M1–M4)
Register/login → describe learning objective, level, skills, format, schedule, budget, and duration → save as draft or publish an open request → discover/filter open requests → view request details → save requests → manage, edit, publish, or close owned requests → open received proposals → compare applicant profile, approach, experience, schedule, duration, and price unit → download an attached CV through the authorized endpoint → choose one submitted proposal in a confirmation dialog → view the server-confirmed match. The request becomes MATCHED and stops accepting proposals. Other proposals remain stored and are marked as not selected without being deleted.

Messaging, scheduling automation, payments, and feedback remain future work.

## Implemented developer proposal flow
Register → create professional profile → browse open requests → submit one active teaching proposal per request → upload/select a private PDF CV when required or desired → edit or withdraw a submitted proposal → manage CV files. Closing a request prevents new submissions; prior proposals remain available to participants.

## Implemented developer match flow
Review submitted proposal statuses → see whether the learner is still choosing or selected another developer → if selected, open the confirmed match and see only its request and proposal details. The developer selected by the learner can access the match; other developers cannot.

## Target moderation flow
Review user reports → inspect relevant content under moderator authorization → take documented moderation action → preserve audit event.

## M0 implementation
The M0 landing shell used explicitly illustrative examples. M2 replaces discovery examples with API-backed request results. Registration/profile, requests, proposals, CV operations, and matching call the API; sessions and moderation remain unimplemented.
