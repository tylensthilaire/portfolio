# Journal

Each journal entry is a Markdown file rendered through `layouts/post.njk`, which
includes the editorial header partial (`_includes/partials/article-header.njk`).

The header emits the single `<h1>` from front matter, so **the Markdown body
must not repeat the title as a leading `# H1`**.

## Header front matter

Two layouts are chosen with the `header` field:

- `default` — a stacked header; an optional `image` bleeds full-width above the headline.
- `split` — a 50:50 content/image split that bleeds full-width, collapsing to stacked on mobile.

All fields are optional unless noted; fallbacks mean a post with no header
fields still renders a clean default header.

| Field | Values | Default | Notes |
|---|---|---|---|
| `header` | `default` \| `split` | `default` | Layout |
| `title` | string | — (required) | SEO title; also the headline unless `headline` is set |
| `headline` | string | falls back to `title` | Display headline (the `<h1>`) |
| `kicker` | string | `"Journal"` (from `category`) | Small label above the headline |
| `standfirst` | string | falls back to `description` | Intro line under the headline |
| `author` | string | `metadata.author.name` | Byline |
| `date` | date | page `date` | Byline |
| `readingTime` | string e.g. `5:30` | omitted when absent | Byline |
| `image` | path e.g. `/img/x.png` | omitted | Header image (both variants) |
| `imageAlt` | string | — (required with `image`) | No silent decorative default |
| `imageWidth` / `imageHeight` | number (intrinsic px) | omitted | Recommended — reserves space, avoids layout shift (CLS) |
| `imagePosition` | `left` \| `right` | `right` | `split` only |
| `theme` | `light` \| `dark` | `light` | `split` only |
| `imageFit` | `constrained` \| `fullbleed` | `constrained` | `split` only |

`imageFit: constrained` letterboxes the image within its half (on a themed
panel); `fullbleed` lets it cover its half edge-to-edge. On the dark theme the
terracotta accent switches to a lighter tint so it stays legible. A `split`
post that omits `image` degrades to a single, centred, full-width panel.
