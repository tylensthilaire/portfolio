// Timeline: lays out the list from partials/timeline.njk along its lanes, in a stage that holds the screen while the page scroll moves it sideways.
// Loaded by js/main.js on pages with a timeline.
// Sizes come from the --timeline-* properties in scss/_components-timeline.scss.

const SVG = "http://www.w3.org/2000/svg";
const TOKENS = ["container", "start", "end", "indent", "step", "gap", "pin", "marker", "stalk", "close", "apart", "wave"];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Eases 0–1 in and out
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
  const legend = track.querySelector(".c-timeline__legend");
  const single = section.classList.contains("c-timeline--single");

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
  const hint = html("p", "c-timeline__hint", track);
  hint.textContent = "Scroll or swipe";
  hint.setAttribute("aria-hidden", "true");

  // Everything that moves each frame is its own layer, moved by transform, so nothing repaints as it scrolls.
  // In order: the dashed lanes, a window revealing the filled lanes, the track's cards and markers, then the tips.
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
  const tips = lanes.map(lane => html("span", `c-timeline__tip c-timeline__tip--${lane}`, stage));

  const progress = html("div", "c-timeline__progress", stage);
  progress.setAttribute("aria-hidden", "true");
  const now = html("p", "c-timeline__now", stage);
  now.setAttribute("aria-hidden", "true");
  const nowChapter = html("span", "c-timeline__now-chapter", now);
  const nowYear = html("span", "c-timeline__now-year", now);

  const nav = html("nav", "c-timeline__nav", stage);
  nav.setAttribute("aria-label", "Timeline chapters");
  const links = chapters.map((chapter, i) => {
    const link = html("a", "", nav);
    const number = String(i + 1).padStart(2, "0");
    link.href = `#${chapter.id}`;
    link.textContent = number;
    link.setAttribute("aria-label", `Chapter ${number}: ${chapter.title}`);
    return link;
  });

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

    // Where the lines start and end on screen
    const left = (width - tokens.container) / 2;
    let start = left + tokens.start;
    let end = left + tokens.end;
    if (end < start) start = end = (start + end) / 2;

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
      tokens.apart,
      line - tokens.stalk - tallest.aboveApart - top,
      bottom - line - tokens.stalk - tallest.belowApart
    ));

    // Pack the cards along the track, each side independently
    const placed = [];
    const pins = [];
    let x = start + tokens.gap;
    let above = x;
    let below = x;
    let last = x - tokens.step;
    for (const chapter of chapters) {
      const cx = Math.max(above, below, last + tokens.step);
      chapter.x = cx;
      placed.push({ element: chapter.heading, side: "above", x: cx, chapter });
      placed.push({ element: chapter.summary, side: "below", x: cx });
      above = below = cx + chapter.heading.offsetWidth + tokens.gap;
      last = cx;
      for (const event of chapter.events) {
        const w = event.element.offsetWidth;
        let ex;
        if (event.side === "above") {
          ex = Math.max(above, last + tokens.step);
          above = ex + w + tokens.gap;
        } else if (event.side === "below") {
          ex = Math.max(below, last + tokens.step);
          below = ex + w + tokens.gap;
        } else {
          ex = Math.max(above, below, last + tokens.step) + tokens.pin;
          above = below = ex + w + tokens.pin + tokens.gap;
          pins.push({ from: ex - tokens.marker, to: ex + w });
        }
        event.x = ex;
        last = ex;
        placed.push({ element: event.element, side: event.side, x: ex, event });
      }
    }
    const finish = Math.max(above, below);

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

    // How far a lane sits from the line, before and after the weave and pinches
    const reach = at => separation(at) * braid(at).reach;
    const offset = at => reach(at) * braid(at).swing * pinch(at);
    const laneY = (side, at) => side === "above" ? line - offset(at) : line + offset(at);

    // Place the cards and draw their markers
    marks.replaceChildren();
    const markers = [];
    for (const item of placed) {
      const h = item.element.offsetHeight;
      const mx = item.x + tokens.marker;
      const y = item.side === "above" ? line - reach(mx) - tokens.stalk - h
        : item.side === "below" ? line + reach(mx) + tokens.stalk
        : line - h / 2;
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
        svg("circle", { class: "c-timeline__halo", cx: kx, cy: line, r: 14 }, knot);
        svg("path", { class: "c-timeline__knot-half c-timeline__knot-half--lane-1", d: `M${kx - 7} ${line}A7 7 0 0 1 ${kx + 7} ${line}Z` }, knot);
        svg("path", { class: "c-timeline__knot-half c-timeline__knot-half--lane-2", d: `M${kx - 7} ${line}A7 7 0 0 0 ${kx + 7} ${line}Z` }, knot);
        markers.push({ element: knot, x: kx, year: item.event.year });
      } else {
        const ly = single ? line : laneY(item.side, mx);
        const edge = item.side === "above" ? y + h + 4 : y - 4;
        const mark = svg("g", { class: `c-timeline__mark c-timeline__mark--${single ? "lane-1" : item.event.lane}` }, marks);
        svg("line", { class: "c-timeline__stalk", x1: mx, x2: mx, y1: ly, y2: edge }, mark);
        svg("circle", { class: "c-timeline__halo", cx: mx, cy: ly, r: 11 }, mark);
        svg("circle", { class: "c-timeline__dot", cx: mx, cy: ly, r: 5 }, mark);
        markers.push({ element: mark, x: mx, year: item.event.year });
      }
    }

    // The lanes themselves, sampled finely then reduced to the points that shape them
    const laneSides = single ? ["line"] : ["above", "below"];
    laneSides.forEach((side, i) => {
      const yAt = at => side === "line" ? line : laneY(side, at);
      const points = [];
      for (let at = start; at < finish; at += 2) points.push([at, yAt(at)]);
      points.push([finish, yAt(finish)]);
      const d = pathData(simplify(points, 0.25));
      bases[i].setAttribute("d", d);
      fills[i].setAttribute("d", d);
      svg("circle", { class: `c-timeline__end c-timeline__end--${lanes[i]}`, cx: start, cy: yAt(start), r: 5.5 }, marks);
      svg("circle", { class: `c-timeline__end c-timeline__end--finish c-timeline__end--${lanes[i]}`, cx: finish, cy: yAt(finish), r: 4 }, marks);
    });

    // Legend and hint in the space before the lines start, level with the line
    const indent = left + tokens.indent;
    let below0 = line;
    if (legend) {
      legend.style.left = `${indent}px`;
      legend.style.maxWidth = `${Math.max(start - indent - tokens.gap, 0)}px`;
      legend.style.top = `${line - legend.offsetHeight / 2}px`;
      below0 = line + legend.offsetHeight / 2;
    }
    hint.style.left = `${indent}px`;
    hint.style.top = `${legend ? below0 + tokens.stalk : line - hint.offsetHeight / 2}px`;

    // The track runs on past the end so it can finish on its mark
    const trackWidth = finish + (width - end);
    track.style.width = `${trackWidth}px`;
    for (const layer of [lines, fillLines, marks]) {
      layer.setAttribute("width", trackWidth);
      layer.setAttribute("height", height);
    }

    geometry = {
      width,
      start,
      end,
      finish,
      travel: Math.max(0, finish - end), // brings the finish to its mark
      markers,
      laneY: single ? () => line : laneY,
      sides: single ? ["line"] : ["above", "below"]
    };
    section.style.height = `${geometry.travel + height}px`;
  }

  // Scroll --------------------------------------------------------------------
  function progressAt(top) {
    return geometry.travel > 0 ? clamp(-top / geometry.travel, 0, 1) : 0;
  }

  function pinned() {
    const top = section.getBoundingClientRect().top;
    return top <= 1 && top >= -geometry.travel - 1;
  }

  function update() {
    const g = geometry;
    const p = progressAt(section.getBoundingClientRect().top);
    const shift = -p * g.travel;
    progress.style.transform = `scaleX(${p})`;

    // The point the lines have filled to, moving on screen from where they start to where they end
    const onScreen = g.start + p * (g.end - g.start);
    const head = onScreen - shift;
    const running = head > g.start && head < g.finish;

    // The window's right edge sits on the head; its contents move back by as much, so they keep pace with the track
    lines.style.transform = track.style.transform = `translate3d(${shift}px, 0, 0)`;
    reveal.style.transform = `translate3d(${onScreen - g.width}px, 0, 0)`;
    fillLines.style.transform = `translate3d(${g.width - onScreen + shift}px, 0, 0)`;
    tips.forEach((tip, i) => {
      tip.hidden = !running;
      tip.style.transform = `translate3d(${onScreen}px, ${g.laneY(g.sides[i], head)}px, 0)`;
    });

    let current = null;
    for (const marker of g.markers) {
      const past = marker.x < head;
      marker.element.classList.toggle("is-past", past);
      if (past) current = marker;
    }
    for (const marker of g.markers) marker.element.classList.toggle("is-current", marker === current && running);

    let chapter = null;
    chapters.forEach((each, i) => {
      if (each.x < head) chapter = i;
    });
    // Text only changes between events, so skip rewriting it every frame
    section.classList.toggle("is-started", head > g.start);
    const year = current ? current.year : "";
    if (nowYear.textContent !== year) nowYear.textContent = year;
    const title = chapter === null ? "" : chapters[chapter].title;
    if (nowChapter.textContent !== title) {
      nowChapter.textContent = title;
      links.forEach((link, i) => {
        if (i === chapter) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }

    const seen = p * g.travel + g.width * 0.97;
    for (const event of events) if (event.x < seen) event.element.classList.add("is-seen");
  }

  function relayout() {
    const top = section.getBoundingClientRect().top;
    const wasPinned = geometry && pinned();
    const p = geometry ? progressAt(top) : 0;
    layout();
    if (wasPinned) scrollTo({ top: section.getBoundingClientRect().top + scrollY + p * geometry.travel, behavior: "instant" });
    update();
  }

  // Moves along the timeline, never past either end
  function scrollAlong(delta, behavior = "instant") {
    const top = section.getBoundingClientRect().top + scrollY;
    scrollTo({ top: clamp(scrollY + delta, top, top + geometry.travel), behavior });
  }

  function scrollToChapter(id, behavior) {
    const chapter = chapters.find(each => each.id === id);
    if (!chapter) return false;
    const tokens = readTokens(section);
    const p = clamp((chapter.x - tokens.gap - geometry.start) / (geometry.finish - geometry.start), 0, 1);
    scrollTo({ top: section.getBoundingClientRect().top + scrollY + p * geometry.travel, behavior });
    return true;
  }

  // Input ---------------------------------------------------------------------
  // Sideways input moves the timeline only while it fills the screen

  section.addEventListener("wheel", event => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || !pinned()) return;
    event.preventDefault();
    scrollAlong(event.deltaX);
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
    scrollToChapter(link.hash.slice(1), reduceMotion.matches ? "instant" : "smooth");
  });

  // Scroll events fire once a frame, before it's drawn, so updating here keeps the timeline in step with the scroll
  addEventListener("scroll", update, { passive: true });

  // Relayout when the stage changes size, but not as mobile toolbars come and go
  let size = "";
  new ResizeObserver(() => {
    const next = `${stage.clientWidth}×${stage.clientHeight}`;
    if (next === size) return;
    size = next;
    relayout();
  }).observe(stage);
  document.fonts?.ready.then(() => relayout());

  // Printed as a list
  addEventListener("beforeprint", () => {
    section.classList.remove("is-enhanced");
    section.style.height = "";
    track.style.transform = "";
  });
  addEventListener("afterprint", () => {
    section.classList.add("is-enhanced");
    relayout();
  });

  layout();
  update();
  if (location.hash) scrollToChapter(decodeURIComponent(location.hash.slice(1)), "instant");
}

document.querySelectorAll("[data-timeline]").forEach(enhance);
