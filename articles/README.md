# Articles

Each article is a Markdown file rendered through `layouts/post.njk`, which
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
| `kicker` | string | `"Article"` (from `category`) | Small label above the headline |
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

## Artwork credit

A `credit` object renders a minimalist gallery label (used by the *State of the
Art* series) — in the right margin on desktop, stacked at the top of the body
on mobile:

```yaml
credit:
  artist:  Andrew Pelling, Orkan Telhan & Grace Knight  # bold, first line
  work:    Ouroboros Steak                               # bold italic, second line
  workUrl: https://example.com/work                      # optional; links the work
  year:    2019                                          # regular, follows the work
  medium:  Installation                                  # regular, third line
```

## Timeline

A timeline of one or two lanes, in chapters. Place it in the body on a line of
its own, with the prose before and after it:

```liquid
{% timeline "what-should-we-build" %}
```

The name points at `_data/timelines/<name>.json`, rendered through
`_includes/partials/timeline.njk`. An unknown name, lane or `rails` value, or a
figure missing its image or alt text, fails the build.

```json
{
  "lanes": [
    { "id": "product", "name": "Product", "descriptor": "Business" },
    { "id": "experience", "name": "Experience", "descriptor": "User-centred" }
  ],
  "crossover": { "name": "Crossover" },
  "chapters": [
    {
      "title": "Before software",
      "period": "1911–1969",
      "summary": "Neither discipline starts in tech…",
      "rails": "apart",
      "events": [
        { "year": "1911", "lane": "product", "title": "…", "body": "…" },
        { "year": "1979", "lane": "both", "title": "…", "body": "…" },
        {
          "year": "1970", "lane": "product", "title": "…", "body": "…",
          "figure": {
            "src": "/img/diagrams/royce-figure-4.svg", "alt": "…",
            "title": "…", "caption": "…", "hideOnMobile": true
          }
        }
      ]
    }
  ]
}
```

| Field | Notes |
|---|---|
| `lanes` | One or two. The first runs above the line, the second below |
| `crossover` | Two lanes only; the label for events on the line |
| `chapters[].rails` | `apart`, `close` or `braid`: how far apart the lanes run in that chapter |
| `events[]` | In reading order, whichever lane they sit in |
| `events[].year` | A string, so it can be a range or approximate (`1940s–54`); four-digit years become a `<time>` |
| `events[].lane` | A lane `id`, or `both` for a crossover |
| `events[].body` | HTML, e.g. `<em>` for titles of works |
| `events[].figure.src` | Any image path. SVGs are inlined, so they take the lane's colour from `var(--lane, currentColor)`; shared diagrams live in `img/diagrams/` |
| `events[].figure.alt` | Required; also the accessible name of an inlined SVG |
| `events[].figure.hideOnMobile` | Optional; drops the figure where space is tight |

Chapter numbers, anchors and labels are generated. Without JavaScript the
timeline reads as a vertical list of chapters and events.
