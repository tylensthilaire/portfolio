// Timeline: lays out the list from partials/timeline.njk along its lanes, in a stage that holds the screen while the page scroll moves it sideways.
// Loaded by js/main.js on pages with a timeline.
// Sizes come from the --timeline-* properties in scss/_components-timeline.scss.

const SVG = "http://www.w3.org/2000/svg";
const TOKENS = ["container", "start", "end", "bookend", "step", "gap", "pin", "marker", "stalk", "close", "apart", "wave"]; // as $timeline-tokens in the SCSS
// Marker sizes, in pixels: fixed, whatever the grid
const MARKS = { dot: 5, halo: 11, knot: 7, knotHalo: 14, start: 5.5, finish: 4, clearance: 4 };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// To whole device pixels, so text in moving layers isn't resampled between them
function snap(value) {
  return Math.round(value * devicePixelRatio) / devicePixelRatio;
}

function smooth(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function html(tag, className, parent) {
  const element = document.createElement(tag);
  element.className = className;
  if (parent) parent.append(element);
  return element;
}

function svg(tag, attributes, parent) {
  const element = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (parent) parent.append(element);
  return element;
}

// Drops points within a tolerance of the line between their neighbours (Ramer–Douglas–Peucker)
function simplify(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const spans = [[0, points.length - 1]];
  while (spans.length) {
    const [first, last] = spans.pop();
    const [x1, y1] = points[first];
    const [x2, y2] = points[last];
    const length = Math.hypot(x2 - x1, y2 - y1) || 1;
    let furthest = -1;
    let distance = tolerance;
    for (let i = first + 1; i < last; i++) {
      const [x, y] = points[i];
      const d = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / length;
      if (d > distance) {
        distance = d;
        furthest = i;
      }
    }
    if (furthest === -1) continue;
    keep[furthest] = 1;
    spans.push([first, furthest], [furthest, last]);
  }
  return points.filter((point, i) => keep[i]);
}

// Path data to a tenth of a pixel, with level runs as horizontal lines
function pathData(points) {
  const round = n => Math.round(n * 10) / 10;
  let d = "";
  let previous = null;
  for (const [x, y] of points.map(([x, y]) => [round(x), round(y)])) {
    d += previous === null ? `M${x} ${y}` : y === previous ? `H${x}` : `L${x} ${y}`;
    previous = y;
  }
  return d;
}

function readTokens(section) {
  const style = getComputedStyle(section);
  const tokens = {};
  for (const name of TOKENS) tokens[name] = parseFloat(style.getPropertyValue(`--timeline-${name}`));
  return tokens;
}

function enhance(section) {
  const stage = section.querySelector(".c-timeline__stage");
  const track = section.querySelector(".c-timeline__track");
  const opening = stage.querySelector(".c-timeline__bookend--opening");
  const closing = stage.querySelector(".c-timeline__bookend--closing");
  const single = section.classList.contains("c-timeline--single");
  // The bookends' paragraphs, put back before each layout
  const openingParts = opening ? [...opening.children] : [];
  const closingParts = closing ? [...closing.children] : [];

  section.classList.add("is-enhanced");
  if (TOKENS.some(name => Number.isNaN(readTokens(section)[name]))) {
    // Without resolved sizes (no @property support) the list stays a list
    section.classList.remove("is-enhanced");
    return;
  }

  // Events sit above or below the line; one lane alternates, two lanes keep to their own side
  let alternate = 0;
  const chapters = [...track.querySelectorAll(".c-timeline__chapter")].map(element => ({
    id: element.id,
    title: element.querySelector(".c-timeline__chapter-title").textContent,
    rails: element.dataset.rails,
    heading: element.querySelector(".c-timeline__chapter-heading"),
    number: element.querySelector(".c-timeline__chapter-heading").dataset.number,
    summary: element.querySelector(".c-timeline__chapter-summary"),
    events: [...element.querySelectorAll(".c-timeline__event")].map(event => {
      const lane = event.classList.contains("c-timeline__event--lane-2") ? "lane-2"
        : event.classList.contains("c-timeline__event--crossover") ? "crossover" : "lane-1";
      const side = single ? (alternate++ % 2 ? "below" : "above")
        : lane === "lane-1" ? "above" : lane === "lane-2" ? "below" : "on";
      return { element: event, lane, side, year: event.querySelector(".c-timeline__year").textContent };
    })
  }));
  const events = chapters.flatMap(chapter => chapter.events);

  // Images change the cards' heights as they load
  for (const image of track.querySelectorAll("img")) {
    image.loading = "eager";
    image.addEventListener("load", () => relayout());
  }

  // Furniture -----------------------------------------------------------------
  // Everything that moves each frame is its own layer, moved by transform, so nothing repaints as it scrolls.
  // In order: the dashed lanes, a window revealing the filled lanes, their tips, then the track's cards and markers.
  const lanes = single ? ["lane-1"] : ["lane-1", "lane-2"];
  const lines = svg("svg", { class: "c-timeline__lines", "aria-hidden": "true" });
  const bases = lanes.map(() => svg("path", { class: "c-timeline__rail" }, lines));
  const reveal = html("div", "c-timeline__reveal");
  const fillLines = svg("svg", { class: "c-timeline__lines", "aria-hidden": "true" }, reveal);
  const fills = lanes.map(lane => svg("path", { class: `c-timeline__fill c-timeline__fill--${lane}` }, fillLines));
  stage.insertBefore(lines, track);
  stage.insertBefore(reveal, track);
  const marks = svg("svg", { class: "c-timeline__marks", "aria-hidden": "true" });
  track.prepend(marks);
  const tips = lanes.map(lane => stage.insertBefore(html("span", `c-timeline__tip c-timeline__tip--${lane}`), track));

  const progress = html("div", "c-timeline__progress", stage);
  progress.setAttribute("aria-hidden", "true");

  // The top bar: a link to each chapter, the current one named, then the current year
  const bar = html("div", "c-timeline__bar", stage);
  const nav = html("nav", "c-timeline__nav", bar);
  nav.setAttribute("aria-label", "Timeline chapters");
  const links = chapters.map(chapter => {
    const link = html("a", "", nav);
    link.href = `#${chapter.id}`;
    link.setAttribute("aria-label", `Chapter ${chapter.number}: ${chapter.title}`);
    link.append(chapter.number);
    // The name opens out while its chapter is current
    html("span", "c-timeline__nav-title", html("span", "c-timeline__nav-name", link)).textContent = chapter.title;
    return link;
  });
  const underline = html("span", "c-timeline__nav-line", nav);
  underline.setAttribute("aria-hidden", "true");
  const nowYear = html("span", "c-timeline__now", bar);
  nowYear.setAttribute("aria-hidden", "true");

  // One layer holding the rest of the stage, to fade as the timeline arrives and leaves.
  // The bookends stay outside it, in reading order either side, so they read as the article's own text.
  // The progress bar stays outside it too, so it sits above the stage's edge fades.
  // The chapter links come first in it, so they're read and reached before the chapters.
  const scene = html("div", "c-timeline__scene");
  scene.append(bar, ...[...stage.children].filter(child => ![opening, closing, progress, bar].includes(child)));
  stage.insertBefore(scene, closing);
  stage.insertBefore(progress, closing);

  // Layout --------------------------------------------------------------------
  let geometry = null;

  function layout() {
    const tokens = readTokens(section);
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const padding = getComputedStyle(stage);
    const top = parseFloat(padding.paddingTop);
    const bottom = height - parseFloat(padding.paddingBottom);
    const close = single ? 0 : tokens.close;

    // Where the lines start, and where the track comes to rest, on screen
    const left = (width - tokens.container) / 2;
    let start = left + tokens.start;
    let end = left + tokens.end;
    if (end < start) start = end = (start + end) / 2;

    // The bookends sit on the article's text column, at its measure
    const column = section.parentElement;
    const columnStyle = getComputedStyle(column);
    const columnBox = column.getBoundingClientRect();
    const textLeft = snap(columnBox.left + parseFloat(columnStyle.paddingLeft) - stage.getBoundingClientRect().left);
    const textWidth = columnBox.width - parseFloat(columnStyle.paddingLeft) - parseFloat(columnStyle.paddingRight);
    for (const bookend of [opening, closing]) {
      if (bookend) bookend.style.maxWidth = `${textWidth}px`;
    }
    // The bookends sit beside the lanes, so they only need to fit on screen.
    // Paragraphs that don't fit read before or after the stage instead, furthest from the lanes first.
    if (opening) {
      opening.append(...openingParts);
      while (opening.children.length > 1 && opening.offsetTop + opening.offsetHeight > bottom) section.before(opening.firstElementChild);
    }
    if (closing) {
      closing.append(...closingParts);
      while (closing.children.length > 1 && closing.offsetHeight > height - top) section.after(closing.lastElementChild);
    }
    for (const part of [...openingParts, ...closingParts]) part.style.transform = "";
    if (opening) {
      opening.style.left = `${textLeft}px`;
      // The lanes start a fixed gap after it
      start = Math.round(textLeft + opening.offsetWidth + tokens.bookend);
    }
    const closingHeight = closing ? closing.offsetHeight : 0;

    // Shrink the cards until both sides fit between the bands
    const sides = [
      ...chapters.flatMap(chapter => [
        { element: chapter.heading, side: "above", apart: chapter.rails === "apart" },
        { element: chapter.summary, side: "below", apart: chapter.rails === "apart" }
      ]),
      ...chapters.flatMap(chapter => chapter.events.map(event => ({ element: event.element, side: event.side, apart: chapter.rails === "apart" })))
    ];
    let scale = 1;
    let tallest;
    for (let attempt = 0; attempt < 10; attempt++) {
      track.style.setProperty("--timeline-scale", scale);
      tallest = { above: 0, below: 0, on: 0, aboveApart: 0, belowApart: 0 };
      for (const item of sides) {
        const h = item.element.offsetHeight;
        tallest[item.side] = Math.max(tallest[item.side], h);
        if (item.apart && item.side !== "on") tallest[`${item.side}Apart`] = Math.max(tallest[`${item.side}Apart`], h);
      }
      const fits = tallest.above + tallest.below + 2 * (tokens.stalk + close) <= bottom - top && tallest.on <= bottom - top;
      if (fits || scale < 0.82) break;
      scale *= 0.95;
    }

    // The line, and how far apart the lanes run where chapters ask for it
    const low = top + close + tokens.stalk + tallest.above;
    const high = bottom - close - tokens.stalk - tallest.below;
    const line = low <= high ? (low + high) / 2 : low;
    const apart = single ? 0 : Math.max(close, Math.min(
      tokens.apart / 2, // the token is the distance between the lanes
      line - tokens.stalk - tallest.aboveApart - top,
      bottom - line - tokens.stalk - tallest.belowApart
    ));

    // Pack the cards along the track, each side independently, on whole pixels so their text stays sharp
    const placed = [];
    const pins = [];
    let x = start + tokens.gap;
    let above = x;
    let below = x;
    let last = x - tokens.step;
    for (const chapter of chapters) {
      const cx = Math.round(Math.max(above, below, last + tokens.step));
      chapter.x = cx;
      placed.push({ element: chapter.heading, side: "above", x: cx, chapter });
      placed.push({ element: chapter.summary, side: "below", x: cx });
      above = below = cx + chapter.heading.offsetWidth + tokens.gap;
      last = cx;
      for (const event of chapter.events) {
        const w = event.element.offsetWidth;
        let ex;
        if (event.side === "above") {
          ex = Math.round(Math.max(above, last + tokens.step));
          above = ex + w + tokens.gap;
        } else if (event.side === "below") {
          ex = Math.round(Math.max(below, last + tokens.step));
          below = ex + w + tokens.gap;
        } else {
          ex = Math.round(Math.max(above, below, last + tokens.step) + tokens.pin);
          above = below = ex + w + tokens.pin + tokens.gap;
          pins.push({ from: ex - tokens.marker, to: ex + w });
        }
        event.x = ex;
        last = ex;
        placed.push({ element: event.element, side: event.side, x: ex, event });
      }
    }
    const finish = Math.round(Math.max(above, below));

    // The closing comes in a fixed gap after the lanes end, at the foot of the stage, and comes to rest on the text column.
    // The track stops when it does.
    let stop = finish;
    if (closing) {
      stop = finish + Math.round(tokens.bookend);
      end = textLeft;
      closing.style.left = `${stop}px`;
      closing.style.top = `${Math.round(height - closingHeight)}px`;
    }

    // Lane separation: eased across each chapter towards the next one's
    const stops = chapters.map(chapter => ({ x: chapter.x, gap: chapter.rails === "apart" ? apart : close }));
    function separation(at) {
      if (at <= stops[0].x) return stops[0].gap;
      for (let i = 0; i < stops.length - 1; i++) {
        const from = stops[i];
        const to = stops[i + 1];
        if (at < to.x) return from.gap + (to.gap - from.gap) * smooth((at - from.x) / (to.x - from.x));
      }
      return stops[stops.length - 1].gap;
    }

    // Braided chapters weave the lanes across each other, from after their heading
    const braids = [];
    chapters.forEach((chapter, i) => {
      if (chapter.rails !== "braid" || chapters[i - 1]?.rails === "braid") return;
      const next = chapters.slice(i + 1).find(other => other.rails !== "braid");
      braids.push({ from: chapter.x + chapter.heading.offsetWidth + tokens.gap, to: next ? next.x : Infinity });
    });
    function braid(at) {
      const region = braids.find(r => at > r.from && at < r.to);
      if (!region) return { swing: 1, reach: 1 };
      const fade = 1 - smooth((at - region.to + tokens.wave) / tokens.wave);
      const swing = 1 + (Math.cos(2 * Math.PI * (at - region.from) / tokens.wave) - 1) * fade;
      return { swing, reach: 1 + 0.7 * smooth((at - region.from) / tokens.wave) * fade };
    }

    // Lanes meet at each crossover
    for (const pin of pins) pin.width = 0.9 * (tokens.pin + separation(pin.from));
    function pinch(at) {
      let v = 1;
      for (const pin of pins) {
        const d = at < pin.from ? pin.from - at : at > pin.to ? at - pin.to : 0;
        if (d < pin.width) v *= d <= 0 ? 0 : (1 - Math.cos(Math.PI * d / pin.width)) / 2;
      }
      return v;
    }

    // How far a lane sits from the line, before and after the weave and pinches.
    // One lane runs on the line; two run above and below it.
    const reach = at => separation(at) * braid(at).reach;
    const offset = at => reach(at) * braid(at).swing * pinch(at);
    const laneSides = single ? ["line"] : ["above", "below"];
    const laneY = (side, at) => side === "line" ? line : side === "above" ? line - offset(at) : line + offset(at);

    // Place the cards and draw their markers
    marks.replaceChildren();
    const markers = [];
    for (const item of placed) {
      const h = item.element.offsetHeight;
      const mx = item.x + tokens.marker;
      const y = Math.round(item.side === "above" ? line - reach(mx) - tokens.stalk - h
        : item.side === "below" ? line + reach(mx) + tokens.stalk
        : line - h / 2);
      item.element.style.left = `${item.x}px`;
      item.element.style.top = `${y}px`;

      if (item.chapter) {
        const tx = item.x - tokens.gap / 2;
        svg("line", { class: "c-timeline__tick", x1: tx, x2: tx, y1: line - reach(tx) - tokens.stalk, y2: line + reach(tx) + tokens.stalk }, marks);
      }
      if (!item.event) continue;

      if (item.side === "on") {
        const kx = item.x - tokens.marker;
        const knot = svg("g", { class: "c-timeline__knot" }, marks);
        const r = MARKS.knot;
        svg("circle", { class: "c-timeline__halo", cx: kx, cy: line, r: MARKS.knotHalo }, knot);
        svg("path", { class: "c-timeline__knot-half c-timeline__knot-half--lane-1", d: `M${kx - r} ${line}A${r} ${r} 0 0 1 ${kx + r} ${line}Z` }, knot);
        svg("path", { class: "c-timeline__knot-half c-timeline__knot-half--lane-2", d: `M${kx - r} ${line}A${r} ${r} 0 0 0 ${kx + r} ${line}Z` }, knot);
        markers.push({ element: knot, x: kx, year: item.event.year });
      } else {
        const ly = laneY(single ? "line" : item.side, mx);
        const edge = item.side === "above" ? y + h + MARKS.clearance : y - MARKS.clearance;
        const mark = svg("g", { class: `c-timeline__mark c-timeline__mark--${single ? "lane-1" : item.event.lane}` }, marks);
        svg("line", { class: "c-timeline__stalk", x1: mx, x2: mx, y1: ly, y2: edge }, mark);
        svg("circle", { class: "c-timeline__halo", cx: mx, cy: ly, r: MARKS.halo }, mark);
        svg("circle", { class: "c-timeline__dot", cx: mx, cy: ly, r: MARKS.dot }, mark);
        markers.push({ element: mark, x: mx, year: item.event.year });
      }
    }
    markers.sort((a, b) => a.x - b.x);

    // The lanes themselves, sampled finely then reduced to the points that shape them
    laneSides.forEach((side, i) => {
      const points = [];
      for (let at = start; at < finish; at += 2) points.push([at, laneY(side, at)]);
      points.push([finish, laneY(side, finish)]);
      const d = pathData(simplify(points, 0.25));
      bases[i].setAttribute("d", d);
      fills[i].setAttribute("d", d);
      svg("circle", { class: `c-timeline__end c-timeline__end--${lanes[i]}`, cx: start, cy: laneY(side, start), r: MARKS.start }, marks);
      svg("circle", { class: `c-timeline__end c-timeline__end--finish c-timeline__end--${lanes[i]}`, cx: finish, cy: laneY(side, finish), r: MARKS.finish }, marks);
    });

    // The track runs on past where it stops, so it can come to rest on its mark
    const trackWidth = stop + (width - end);
    track.style.width = `${trackWidth}px`;
    for (const layer of [lines, fillLines, marks]) {
      layer.setAttribute("width", trackWidth);
      layer.setAttribute("height", height);
    }

    // The push eases in and out over half a screen at either end, moving the content half that again in all
    const ease = height / 2;
    const travel = Math.max(0, stop - end - ease); // brings the stop to its mark
    // The bookends only move while the stage is held, so never while the article's other text is on screen.
    // The opening's paragraphs leave top first, each once the page has scrolled as far as its distance from the first, and the lanes set off with the last.
    // The closing's arrive the same way, the first with the lanes, and the last settles as the stage lets go.
    // The paragraphs nearest the lanes move with them, so the others only ever pull away.
    const leaving = [...(opening?.children ?? [])];
    const arriving = [...(closing?.children ?? [])];
    const hold = leaving.length ? ease + leaving.at(-1).offsetTop - leaving[0].offsetTop : 0;
    const settle = arriving.length ? ease + arriving.at(-1).offsetTop - arriving[0].offsetTop : 0;
    const parts = [
      ...leaving.map(part => ({ element: part, delay: part.offsetTop - leaving.at(-1).offsetTop })),
      ...arriving.map(part => ({ element: part, delay: part.offsetTop - arriving[0].offsetTop }))
    ];
    geometry = {
      width,
      height,
      ease,
      start,
      finish,
      travel,
      hold,
      held: hold + travel + settle, // how far the page scrolls while the stage is held
      parts,
      bookend: tokens.bookend,
      openingRight: opening ? textLeft + opening.offsetWidth : 0,
      markers,
      laneY,
      laneSides
    };
    section.style.height = `${geometry.held + height}px`;
  }

  // Scroll --------------------------------------------------------------------
  function progressAt(top) {
    return geometry.held > 0 ? clamp(-top / geometry.held, 0, 1) : 0;
  }

  function pinned() {
    const top = section.getBoundingClientRect().top;
    return top <= 1 && top >= -geometry.held - 1;
  }

  // How far the stage is from being held, in screen heights: 0 while held, up to 1 arriving and -1 leaving
  function outside(top) {
    const g = geometry;
    if (reduceMotion.matches) return 0;
    if (top > 0) return Math.min(top / g.height, 1);
    if (top < -g.held) return -Math.min((-g.held - top) / g.height, 1);
    return 0;
  }

  // How far the content has moved left: a pixel per pixel scrolled while held.
  // It starts from rest once the stage is halfway up the screen, reaching that speed as it's held, and slows to rest over as far after.
  // With bookends, it starts and comes to rest while held instead.
  function push(top) {
    const { travel, ease, hold } = geometry;
    const y = -top - hold;
    if (y <= -ease) return 0;
    if (y < 0) return (y + ease) ** 2 / (2 * ease);
    if (y <= travel) return ease / 2 + y;
    if (y < travel + ease) return ease + travel - (travel + ease - y) ** 2 / (2 * ease);
    return ease + travel;
  }

  let currentChapter = null;
  let away = null; // which side of the screen the stage was last drawn off, so it's only drawn there once

  function update() {
    const g = geometry;
    const top = section.getBoundingClientRect().top;
    const offScreen = top >= g.height ? 1 : top <= -g.held - g.height ? -1 : 0;
    if (offScreen && offScreen === away) return;
    away = offScreen;
    const p = progressAt(top);
    // The lanes and the bookends' nearest paragraphs move together, so the gaps between them never change
    const shift = snap(-push(top));
    // Fades in slowly across the whole arrival, fully in as it's held, and out the same way
    scene.style.opacity = progress.style.opacity = smooth(1 - Math.abs(outside(top))) ** 2;
    progress.style.transform = `scaleX(${p})`;

    // The point the lines have filled to stays mid-screen, as the lines pass under it
    const head = clamp(g.width / 2 - shift, g.start, g.finish);
    const onScreen = snap(head + shift);
    const running = head > g.start && head < g.finish;

    // The window's right edge sits on the head; its contents move back by as much, so they keep pace with the track
    lines.style.transform = track.style.transform = `translate3d(${shift}px, 0, 0)`;
    reveal.style.transform = `translate3d(${onScreen - g.width}px, 0, 0)`;
    fillLines.style.transform = `translate3d(${g.width - onScreen + shift}px, 0, 0)`;
    tips.forEach((tip, i) => {
      tip.hidden = !running;
      tip.style.transform = `translate3d(${onScreen}px, ${g.laneY(g.laneSides[i], head)}px, 0)`;
    });

    for (const part of g.parts) part.element.style.transform = `translate3d(${snap(-push(top + part.delay))}px, 0, 0)`;

    // The bar fades in once the opening has gone off the left, and out once the tips have reached the end of the lanes
    let shown = clamp(1 + (g.finish + shift - g.width / 2) / g.bookend, 0, 1);
    if (opening) shown = Math.min(shown, clamp(-(g.openingRight + shift) / g.bookend, 0, 1));
    bar.style.setProperty("--shown", shown);
    bar.classList.toggle("is-hidden", shown === 0);

    const current = g.markers.findLastIndex(marker => marker.x < head);
    g.markers.forEach((marker, i) => {
      marker.element.classList.toggle("is-past", i <= current);
      marker.element.classList.toggle("is-current", i === current && running);
    });

    const chapter = chapters.findLastIndex(each => each.x < head);
    // These only change between events, so skip rewriting them every frame
    section.classList.toggle("is-started", head > g.start);
    const year = g.markers[current]?.year ?? "";
    if (nowYear.textContent !== year) nowYear.textContent = year;
    if (chapter !== currentChapter) {
      currentChapter = chapter;
      links.forEach((link, i) => {
        if (i === chapter) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      moveUnderline();
    }

    const seen = -shift + g.width * 0.97;
    for (const event of events) if (event.x < seen) event.element.classList.add("is-seen");
  }

  // The underline slides from where it's drawn to the current link, which may itself be moving as names open and close.
  // It eases over as long as the names take, from their CSS, then follows the link until they've settled.
  let underlineBox = null;
  let underlineFrame = 0;

  function moveUnderline() {
    const link = links[currentChapter];
    underline.classList.toggle("is-shown", Boolean(link));
    cancelAnimationFrame(underlineFrame);
    if (!link) {
      underlineBox = null; // reappears in place, rather than sliding from where it was
      return;
    }
    const duration = parseFloat(getComputedStyle(link.querySelector(".c-timeline__nav-name")).transitionDuration) * 1000;
    const from = underlineBox;
    const began = performance.now();
    const step = now => {
      const t = from && duration > 0 ? smooth((now - began) / duration) : 1;
      const to = { x: link.offsetLeft, width: link.offsetWidth };
      underlineBox = from ? { x: from.x + (to.x - from.x) * t, width: from.width + (to.width - from.width) * t } : to;
      underline.style.transform = `translateX(${underlineBox.x}px) scaleX(${underlineBox.width})`;
      if (now - began < duration) underlineFrame = requestAnimationFrame(step);
    };
    step(began);
  }

  function relayout() {
    const top = section.getBoundingClientRect().top;
    const wasPinned = geometry && pinned();
    const p = geometry ? progressAt(top) : 0;
    layout();
    if (wasPinned) scrollTo({ top: section.getBoundingClientRect().top + scrollY + p * geometry.held, behavior: "instant" });
    away = null; // drawn afresh, wherever it is
    update();
    underlineBox = null; // the links may have moved, so place it afresh
    moveUnderline();
  }

  // Moves along the timeline, never past either end
  function scrollAlong(delta, behavior = "instant") {
    const top = section.getBoundingClientRect().top + scrollY;
    scrollTo({ top: clamp(scrollY + delta, top, top + geometry.held), behavior });
  }

  function scrollToChapter(id, behavior) {
    const chapter = chapters.find(each => each.id === id);
    if (!chapter) return;
    // Just past the chapter's start reaching the middle of the screen, where the lines fill to, so it's the current one.
    // While held, the content has moved half the ease plus the distance scrolled since the hold.
    const distance = clamp(chapter.x + 1 - geometry.width / 2 - geometry.ease / 2 + geometry.hold, 0, geometry.held);
    scrollTo({ top: section.getBoundingClientRect().top + scrollY + distance, behavior });
  }

  // Input ---------------------------------------------------------------------
  // Sideways input moves the timeline only while it fills the screen

  section.addEventListener("wheel", event => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || !pinned()) return;
    event.preventDefault();
    // Some wheels count in lines or pages, not pixels
    scrollAlong(event.deltaX * [1, 16, stage.clientWidth][event.deltaMode]);
  }, { passive: false });

  let touch = null;
  let glide = 0;
  section.addEventListener("touchstart", event => {
    const point = event.touches[0];
    touch = { x: point.clientX, y: point.clientY, lastX: point.clientX, time: performance.now(), velocity: 0, axis: null };
    cancelAnimationFrame(glide);
  }, { passive: true });

  section.addEventListener("touchmove", event => {
    if (!touch) return;
    const point = event.touches[0];
    if (!touch.axis) {
      const dx = point.clientX - touch.x;
      const dy = point.clientY - touch.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      touch.axis = Math.abs(dx) > Math.abs(dy) && pinned() ? "x" : "y";
    }
    if (touch.axis !== "x") return;
    event.preventDefault();
    const delta = touch.lastX - point.clientX;
    const time = performance.now();
    touch.velocity = delta / Math.max(1, time - touch.time);
    touch.time = time;
    touch.lastX = point.clientX;
    scrollAlong(delta);
  }, { passive: false });

  section.addEventListener("touchend", () => {
    if (touch && touch.axis === "x" && !reduceMotion.matches) {
      // Carry on with the swipe's momentum
      let velocity = touch.velocity * 16;
      const step = () => {
        if (Math.abs(velocity) < 0.5) return;
        scrollAlong(velocity);
        velocity *= 0.94;
        glide = requestAnimationFrame(step);
      };
      step();
    }
    touch = null;
  }, { passive: true });

  document.addEventListener("keydown", event => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    if (event.altKey || event.ctrlKey || event.metaKey || !pinned()) return;
    if (event.target.closest("input, textarea, select, [contenteditable]")) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    scrollAlong(direction * stage.clientWidth / 2, reduceMotion.matches ? "instant" : "smooth");
  });

  nav.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link) return;
    event.preventDefault();
    // In the address, so the chapter can be shared and Back returns to the one before
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    scrollToChapter(link.hash.slice(1), reduceMotion.matches ? "instant" : "smooth");
  });

  // Links from elsewhere in the article, Back and Forward, and edited addresses
  addEventListener("hashchange", () => scrollToChapter(decodeURIComponent(location.hash.slice(1)), "instant"));

  // Scroll events fire once a frame, before it's drawn, so updating here keeps the timeline in step with the scroll
  addEventListener("scroll", update, { passive: true });

  // Relayout when the stage changes size, but not as mobile toolbars come and go.
  // Starts from the size it's laid out at below, so it doesn't lay out again straight away.
  let size = `${stage.clientWidth}×${stage.clientHeight}`;
  new ResizeObserver(() => {
    const next = `${stage.clientWidth}×${stage.clientHeight}`;
    if (next === size) return;
    size = next;
    relayout();
  }).observe(stage);
  document.fonts?.ready.then(() => relayout());

  // Printed as a list
  addEventListener("beforeprint", () => {
    opening?.append(...openingParts);
    closing?.append(...closingParts);
    section.classList.remove("is-enhanced");
    section.style.height = "";
    track.style.transform = "";
    scene.style.opacity = "";
    for (const part of [...openingParts, ...closingParts]) part.style.transform = "";
  });
  addEventListener("afterprint", () => {
    section.classList.add("is-enhanced");
    relayout();
  });

  relayout();
  if (location.hash) scrollToChapter(decodeURIComponent(location.hash.slice(1)), "instant");
}

document.querySelectorAll("[data-timeline]").forEach(enhance);
