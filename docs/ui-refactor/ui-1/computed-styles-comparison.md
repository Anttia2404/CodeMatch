# UI-1.2 Computed Style Comparison

Captured from the live Bordful Jobs page and CodeMatch at the same Chromium viewport sizes on 2026-11-26T11:58:40.994Z. Source code and computed browser styles were inspected; the rows below list the measured box, font (size / weight / line-height / letter-spacing), padding, gap, and radius. A null / omitted component means that it is intentionally hidden at that viewport (for example, the desktop detail placeholder on phones).

| Viewport | Component | Bordful computed styles | CodeMatch computed styles |
|---|---|---|---|
| desktop-1440x900 | row | 808×60; 16px / 400 / 24px / normal; 0px 12px; 2px 6px; 10px | 808×60; 16px / 400 / normal / normal; 0px 12px; 2px 6px; 10px |
| desktop-1440x900 | mark | 28×28; 12px / 500 / 18px / normal; 0px; normal; 7px | 28×28; 12px / 500 / normal / normal; 0px; normal; 7px |
| desktop-1440x900 | title | 358×20; 14px / 400 / 20px / normal; 0px; normal; 0px | 199×20; 14px / 400 / 20px / normal; 0px; normal; 0px |
| desktop-1440x900 | metadata | 634×24; 12px / 400 / 16px / normal; 0px 0px 8px; normal; 0px | 560×16; 12px / 400 / 16px / normal; 0px; normal; 0px |
| desktop-1440x900 | budget | 98×18; 13px / 400 / 18px / normal; 0px; normal; 0px | 178×18; 13px / 400 / 18px / normal; 0px; normal; 0px |
| desktop-1440x900 | time | 98×16; 12px / 400 / 16px / normal; 0px; normal; 0px | 35×16; 12px / 400 / 16px / normal; 0px; normal; 0px |
| desktop-1440x900 | filterPill | 85×28; 13px / 400 / 18px / normal; 0px 8px; 6px; 8px | 78×28; 13px / 400 / 18px / normal; 0px 8px; 6px; 8px |
| desktop-1440x900 | placeholder | 392×210; 16px / 400 / 24px / normal; 20px; 14px; 14px | 392×210; 16px / 400 / normal / normal; 20px; normal; 14px |
| desktop-1440x900 | bottomNavigation | 0×0; 16px / 400 / 24px / normal; 0px; normal; 0px | 0×0; 16px / 400 / normal / normal; 0px; normal; 0px |
| mobile-390x844 | row | 374×86; 16px / 400 / 24px / normal; 12px 10px; normal 12px; 12px | 374×86; 16px / 400 / normal / normal; 10px; 2px 12px; 12px |
| mobile-390x844 | mark | 36×36; 14px / 500 / 21px / normal; 0px; normal; 9px | 36×36; 14px / 500 / normal / normal; 0px; normal; 9px |
| mobile-390x844 | title | 275×20; 15px / 400 / 20px / normal; 0px; normal; 0px | 214×20; 15px / 400 / 20px / normal; 0px; normal; 0px |
| mobile-390x844 | metadata | 306×24; 13px / 400 / 18px / normal; 0px 0px 6px; normal; 0px | 306×18; 13px / 400 / 18px / normal; 0px; normal; 0px |
| mobile-390x844 | budget | 100×18; 13px / 500 / 18px / normal; 0px; normal; 0px | 178×18; 13px / 400 / 18px / normal; 0px; normal; 0px |
| mobile-390x844 | time | 19×20; 12px / 400 / 20px / normal; 0px; normal; 0px | 35×16; 12px / 400 / 16px / normal; 0px; normal; 0px |
| mobile-390x844 | filterPill | 82×32; 14px / 400 / 18px / normal; 0px 12px; 6px; 3.35544e+07px | 90×32; 14px / 400 / 18px / normal; 0px 12px; 6px; 999px |
| mobile-390x844 | bottomNavigation | 390×59; 16px / 400 / 24px / normal; 0px; normal; 0px | 390×58; 16px / 400 / normal / normal; 0px; normal; 0px |

Full computed values (including border, shadow, text and background colors) are preserved in [ui-1-2-computed-styles.json](ui-1-2-computed-styles.json).
