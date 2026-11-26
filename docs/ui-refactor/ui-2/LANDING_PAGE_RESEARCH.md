# UI-2 Landing Page Template Research

**Research date:** 2026-11-26. **Purpose:** evaluate reusable starting points for a future CodeMatch landing page. No landing page, routing, backend, or product behavior has been implemented or changed by this research.

## Evaluation criteria

Priority was given to source code and commercial-use rights that can be checked, React portability, mobile behavior, compatibility with the current React/Vite/TypeScript app, and a clean, restrained visual language that can sit beside the Bordful-based marketplace. “Direct reuse” means porting the licensed components/assets and retaining license notices where required; it does not mean importing unrelated product claims or brand assets. A demo is marked unavailable when its published URL failed during the check.

## Candidate shortlist (11 templates)

| # | Template | Live demo / source | License and cost checked | Stack | Reusable components; CodeMatch fit and required changes |
|---|---|---|---|---|---|
| 1 | **Convertly** | [Demo](https://convertly.meku.app/) · [GitHub](https://github.com/MekuHQ/convertly) | MIT in repo; $0. | React, Vite, Tailwind CSS v4. | Hero, header, feature sections, contact, footer. Strongest immediate Vite match; remove portfolio/pricing and sample testimonials unless backed by actual product data; connect CTAs to existing API-backed discovery/signup paths. Desktop/mobile captures below. |
| 2 | **Landy** | [Demo](https://landy-web.netlify.app/) · [GitHub](https://github.com/Adrinlol/landy-react-template) | MIT in repo; $0. | React, TypeScript; Ant Design, styled-components, i18next, reveal animations. | Header, hero, feature/section patterns, translated content structure. Mature, orderly, commercial-use license; adapt older tooling/dependencies and replace generic SaaS sections with learner/developer value and real workflow. Desktop/mobile captures below. |
| 3 | **Shadcn Landing Page (Bjorn Leon Henry)** | [Demo](https://shadcn-landing-page.bjornleonhenry.com/) · [GitHub](https://github.com/bjornleonhenry/shadcn-landing-page) | MIT in repo; $0. | React 18, TypeScript, Vite, Tailwind, shadcn/ui/Radix. | Navigation/mobile menu, hero, features, how-it-works, FAQ, footer. Direct build-tool fit and accessible primitives; omit placeholder partner logos, counts, pricing, team, and testimonials; current system is not shadcn so port only chosen components/tokens. Desktop/mobile captures below. |
| 4 | **Shadcn/UI Landing Page (leoMirandaa)** | [Demo](https://shadcn-landing-page.vercel.app/) · [GitHub](https://github.com/leoMirandaa/shadcn-landing-page) | MIT in repo; $0. | React, TypeScript, Tailwind, shadcn/ui. | Navigation, mobile nav, hero, CTA, section primitives, dark-mode approach. Large, mature repo; not verified as Vite in current branch and adds a design system unlike CodeMatch. Remove fake partners/stats/testimonials and keep light/blue CodeMatch identity. |
| 5 | **FlowKit React Starter** | [Demo / publisher](https://www.reactkithub.com/) · [GitHub](https://github.com/reactkithub/flowkit-react-starter) | MIT applies to free starter; $0. Full template is separately commercial and not included. | React 18, TypeScript, Tailwind, Framer Motion, Vite. | Free tier includes hero, feature cards, CTA. Good stack fit, but published demo link goes to publisher site and did not identify a standalone template preview; free tier is narrow. Use only the MIT repository starter, not paid template assets. |
| 6 | **8B SaaS landing page** | [Demo](https://8bsite.github.io/saas-landing-page-template/) · [GitHub](https://github.com/8bsite/saas-landing-page-template) | MIT stated by the source; $0. | Single HTML/CSS/JS page, optional GSAP version; no framework. | Hero, app mockup, pricing, contact. Small and easy to port, but strong maroon/gold style conflicts with current blue identity and the product story is unrelated. Port component ideas only; keep required attribution/license. |
| 7 | **ShadcnStore Dashboard + Landing** | [Demo](https://demo.shadcnstore.com/) · [GitHub](https://github.com/shadcnstore/shadcn-dashboard-landing-template) | MIT in repository; $0 source. | Current main has Next.js; repository documents a Vite edition on `v2` branch. React/TypeScript, Base UI, Tailwind v4. | Landing hero/feature/CTA and shared primitives are candidates. Vite branch makes reuse possible, but this is dashboard-first and carries considerable shadcn/Tailwind setup; use only verified Vite-branch pieces. Avoid product/dashboard demo numbers. |
| 8 | **Synkra Enterprise SaaS Website UI Kit** | [Figma Community file](https://www.figma.com/community/file/1626855177447595897/synkra-enterprise-saas-website-template-ui-kit-available) · [creator details and preview link](https://forum.figma.com/showcase-your-work-14/synkra-enterprise-saas-website-template-ui-kit-available) | Creator states free version CC BY 4.0; attribution required, commercial use allowed under CC BY 4.0. Pro commercial design system is not currently available (listed TBA). Figma page was inaccessible to automated capture. | Figma design resource; no implementation stack. | Seven pages including landing, feature, about, blog, changelog, pricing. Could reuse layout/design tokens after manual license notice and attribution; CodeMatch must omit unverified social proof and pricing. No desktop/mobile screenshots could be captured here. |
| 9 | **Fluxframe** | [Framer preview](https://fluxframe.framer.website/) · [Framer Marketplace entry](https://www.framer.com/marketplace/templates/fluxframe/) | Listed free to remix; license displayed as “Limited”. Commercial rights for porting out of Framer were not verified; treat as **not approved for direct code/asset reuse**. $0 remix. | Framer proprietary project. | SaaS hero, product frame, feature visuals, pricing switch, testimonials, responsive layout. Strong conceptual structure, but animations, testimonials and platform coupling are not a good direct React source. Keep as visual reference only unless creator/license confirms portability. |
| 10 | **Powerful SaaS Website Template** | [Webflow template page](https://templates.webflow.com/html/powerful-saas-website-template) | Webflow page says free personal and commercial use; $0 template. Check current single-use/free terms before use. | Webflow Designer/CMS, not a React/Vite source package. | Multiple home, feature, pricing, contact and CMS page layouts. Lots of parts, but direct code reuse into Vite is not practical; export/porting and CMS features are platform-dependent. Treat as a visual/component reference unless export license and code are separately reviewed. |
| 11 | **SaaS Design DevTools Template** | [Published demo URL](https://www.saasdesign.io/saas-landing-page-template/) · [GitHub source](https://github.com/hannah-wright/saas-landing-page-template) | Repository says MIT and commercial use permitted; free source is $0. Optional nine-template bundle is advertised separately at $19 one-time and is unnecessary. | React/Vue/HTML + Tailwind. | Clean DevTools-style nav, hero, feature grid, docs/pricing sections. Good audience and restrained language, but its published demo domain redirected to a parked/for-sale page during capture, so current live visual could not be verified. The free source itself is available for inspection. |

### Platform screening notes

- **Pinterest:** searched for SaaS landing-page templates/designs. Pins were not treated as code or reusable assets because a pin does not itself provide a source repository or grant a commercial license. Pinterest is an inspiration index only for this task. No pin is recommended for direct reuse.
- **Figma Community:** Synkra is a concrete template candidate above. Figma’s Community hosts website templates and design resources, but reuse permission is resource-specific; verify the file’s license before duplicating or shipping assets. Automated access to the file was blocked during this research.
- **Framer:** Fluxframe is listed as free to remix but marketplace shows “Limited” license. Free remix is not enough evidence for extracting/porting its source/assets into CodeMatch; no direct reuse recommended without creator confirmation.
- **Webflow:** a free commercial template is available; Webflow-specific site/export capabilities make React porting costly. Its license does not make the code automatically Vite-compatible.

## TOP 3

### 1. Convertly — best immediate React/Vite reuse

- **Links:** [live demo](https://convertly.meku.app/) · [source and MIT license](https://github.com/MekuHQ/convertly)
- **Cost:** $0; source is MIT. No paid bundle is required.
- **Technology:** React + Vite + Tailwind CSS v4.
- **Directly reusable:** header, hero/CTA, modular content sections, responsive layout, footer and icon/layout patterns.
- **Why it fits:** the build stack is closest to CodeMatch; sections are separated and mobile preview is available. It is the least disruptive port among the selected candidates.
- **Required changes:** remove the portfolio/product showcase, pricing, sample testimonials and any unverified customer claims. Replace claims with real CodeMatch workflows, connect navigation to approved routes after separate routing approval, and preserve current login/session and API calls. Its starting color/visual style would need token mapping to the existing blue identity and Bordful marketplace language.
- **Captured previews:** [Desktop 1440px](convertly-desktop.png) · [Mobile 390px](convertly-mobile.png).

### 2. Landy — best restrained, content-led structure

- **Links:** [live demo](https://landy-web.netlify.app/) · [source and MIT license](https://github.com/Adrinlol/landy-react-template)
- **Cost:** $0; MIT.
- **Technology:** React + TypeScript, Ant Design, styled-components, i18next.
- **Directly reusable:** navigation/hero structure, section composition, responsive patterns and translation-ready content model.
- **Why it fits:** polished and mature source with clean organization and less emphasis on dense marketing widgets; adapts naturally to a learning marketplace story.
- **Required changes:** port selected components to existing CSS/tokens rather than introducing Ant Design, styled-components and its full dependency graph; remove generic claims and ensure Vietnamese copy fits actual features. Preserve CodeMatch’s routes and API integration.
- **Captured previews:** [Desktop 1440px](landy-desktop.png) · [Mobile 390px](landy-mobile.png).

### 3. Shadcn Landing Page (Bjorn Leon Henry) — best modern Vite component basis

- **Links:** [live demo](https://shadcn-landing-page.bjornleonhenry.com/) · [source and MIT license](https://github.com/bjornleonhenry/shadcn-landing-page)
- **Cost:** $0; MIT.
- **Technology:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui/Radix.
- **Directly reusable:** responsive nav/mobile menu, hero, feature grid, “how it works”, FAQ and footer.
- **Why it fits:** clear Vite compatibility and reusable accessible components, with a useful landing-page section inventory.
- **Required changes:** selective port only; CodeMatch does not currently use shadcn/Tailwind. Remove sponsor/customer logos, activity statistics, pricing, team cards and testimonials unless real data/functionality is approved. Restyle against Bordful-compatible typography, spacing and blue tokens.
- **Captured previews:** [Desktop 1440px](shadcn-bjorn-desktop.png) · [Mobile 390px](shadcn-bjorn-mobile.png).

## Preview evidence and limitations

The six images above are full-page Playwright captures made on 2026-11-26 from the linked live demos at 1440×900 and 390×844 browser viewports. They show the captured pages as currently published, including template placeholder content; they are evidence for review, not approved CodeMatch copy. The screenshots are retained as research evidence and attributed by the source links above. The SaaS Design URL redirected to a parked/for-sale page; Cactus's listed domain failed DNS resolution in this environment; Figma automated viewing was blocked; Webflow's template preview endpoint timed out. No screenshot is fabricated for those sources.

## Recommendation for owner review

If direct React/Vite porting is the priority, start with **Convertly**. If the main priority is an understated, editorially clear presentation with a mature component breakdown, choose **Landy** and port only selected components. If a modern Vite/shadcn starting set is preferred, choose **Bjorn's Shadcn Landing Page**, accepting selective component extraction and removal of unsupported social proof. The research does not authorize implementation; wait for the owner's choice and explicit UI-2 approval.
