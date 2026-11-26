# License and attribution

- Reference website: [Bordful Jobs](https://bordful.com/jobs).
- Source: [craftled/bordful](https://github.com/craftled/bordful).
- License checked from the source repository's `LICENSE`: MIT, copyright © 2024 Tomas Laurinavicius.
- The CodeMatch UI does not vendor Bordful's Next.js/Payload runtime or job-domain components. The desktop selected-preview grid values (`216px` rail and `520px` list) were taken from `src/components/board/board-listing.tsx`. UI-1.2 additionally inspected and adapted the measured Geist typography and row geometry from `src/components/board/job-row.tsx`, the desktop/mobile filter-pill values and active-clear behavior from `src/components/board/board-filters.tsx`, the 2px list spacing from `src/components/board/board-list.tsx`, and the preview-card geometry from `src/components/board/job-preview.tsx`. These values are adapted into CodeMatch's existing React/Vite components and CSS; Bordful job-domain controls are not copied verbatim. No Bordful logo, company image, font binary, or other third-party asset was copied.
- MIT attribution for Bordful is retained below. The CodeMatch bottom navigation uses its existing `lucide-react` dependency and maps to CodeMatch routes; it does not reuse Bordful company or product assets.
- Lucide icons already present in CodeMatch remain from the existing `lucide-react` dependency; no Bordful asset was added.

The upstream MIT notice is retained here for attribution and license traceability:

```text
MIT License

Copyright (c) 2024 Tomas Laurinavicius

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
