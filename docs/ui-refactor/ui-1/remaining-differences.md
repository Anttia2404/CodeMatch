# Remaining visual differences

The captured local database currently returns **zero published learning requests**. The CodeMatch screenshots therefore show its real empty state, while Bordful's reference screenshots show populated jobs and company marks. No synthetic people, requests, logos, counts, or testimonials were inserted to imitate that data. This is the largest remaining screenshot difference and prevents a meaningful pixel comparison of populated rows and a selected request's detail content against the current production data.

Other intentional differences:

- Brand, Vietnamese labels, CodeMatch routes, and request-specific fields replace Bordful's job-board branding and employment fields.
- No company logos or recruiter identities appear because CodeMatch's public learning-request API does not return such content.
- The skill rail omits category counts because the skills endpoint provides no matching-request counts.
- At 768px, the rail and detail panel collapse to a single-column list, matching the observed tablet behavior. Selecting an item opens its detail view.
- The menu icon on mobile opens CodeMatch's own routes rather than Bordful's menu destinations.

The screenshots and audit show zero horizontal overflow at all four viewports. A 1px vertical scroll extent may appear at mobile because browser layout rounds the fixed navigation and viewport units; the captured image is still exactly 390 × 844.
