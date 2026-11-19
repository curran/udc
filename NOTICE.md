# Origin and attribution

Universal Data Cube (UDC) was created in 2014 by Curran Kelleher. See the MIT license in [LICENSE](LICENSE).

The modern TypeScript virtual-cube core and its pure regression tests were extracted from VizHub AI Studio at commit [6ba07a2](https://github.com/vizhub-studio/vizhub-ai-studio/commit/6ba07a2dd7dba2fc906ab2bb7cddeacb57417be0) on November 19, 2026. The standalone snapshot interface extends that core with optional provider-neutral revision metadata.

The historical AMD/RequireJS implementation, annotated source and 2014 Mocha tests are available unchanged in this repository's [gh-pages branch](https://github.com/curran/udc/tree/gh-pages) and Git history. The TypeScript library is an intentionally stricter reimplementation, not a drop-in replacement for the 2014 API.
