---
layout: layouts/generic.njk
title: Privacy
description: How this site counts visits without cookies, and how to opt out.
templateClass: tmpl-generic
---

# Privacy

This site doesn't use cookies, and it doesn't track you across the web. It does count visits, so I can see which pages people read and where they come from. Here's exactly how.

## What's counted

I use [Umami](https://umami.is/), a privacy-focused analytics service, hosted on its EU servers. When you load a page, Umami records:

- the page you visited and the site that sent you here, if any
- your browser, operating system and device type
- your country, worked out from your IP address
- clicks on e-mail links and downloads of PDFs

Umami doesn't store your IP address or set cookies. To tell a returning visitor from a new one, it uses an anonymous identifier that resets every month, so it can't follow you over time or across other sites. I can't identify you from any of this, and I don't share it or use it for advertising.

Umami keeps this data for six months.

## The visit counter

The number in the footer is the total of visits since I started counting in October 2026. A visit is one stretch of reading; coming back later counts again. Behind it, the site keeps only a running total, nothing about individual visits.

## Opting out

You can switch counting off in this browser. The setting is saved in your browser's local storage and only works on this site.

<p data-analytics-status>Turn on JavaScript to see and change your setting.</p>
<button type="button" class="c-privacy__toggle" data-analytics-toggle aria-pressed="false" hidden>Opt out</button>

## Everything else

- The site is hosted by [Netlify](https://www.netlify.com/privacy/), which, like any web host, handles your IP address to serve pages.
- The headings use a font served by [Google Fonts](https://policies.google.com/privacy), so your browser requests it from Google.

Questions? E-mail [hello@tylensthilaire.com](mailto:hello@tylensthilaire.com).
