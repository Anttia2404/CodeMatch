# Product requirements

## Product
CodeMatch is a Vietnamese peer-to-peer marketplace connecting learners with independent developers for personalized one-on-one coding instruction. Learners describe a learning goal; developers discover requests and send teaching proposals; the learner chooses a developer and both agree on arrangements.

CodeMatch is not a school, course catalog, homework/exam completion service, employer, or general multi-subject tutoring platform. A user may act as both learner and developer.

## Audiences and outcomes
- Learners can explain what they want to learn and find a developer who fits.
- Independent developers can present relevant skills and propose a useful teaching plan.
- Both parties retain choice over whether to work together and how to arrange sessions.

## MVP capability scope
The product milestones are M0 foundation, M1 authentication and profiles, M2 learning requests and discovery, M3 proposals and private CVs, M4 matching, M5 moderation/security/E2E, and M6 pilot preparation. M0–M2 are implemented; M3 onward remain future milestones.

## M0 experience
The frontend uses Vietnamese and a responsive marketplace layout. M2 request discovery and learner-owned request management use the API and PostgreSQL. No fake ratings, credentials, or verification are shown. Proposals, CV uploads, matching, and messages are not implemented.

## Product constraints
- Primary market and language: Vietnam / Vietnamese.
- Responsive web application.
- No fake social proof, ratings, credentials, or verification.
- CV attachments are private, PDF-only, maximum 5 MB, and authorized by request ownership/moderator access.
- No AI CV parsing, ranking, or homework/exam outsourcing.
