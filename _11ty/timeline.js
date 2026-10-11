// The `timeline` shortcode: see the Timeline section of articles/README.md
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

module.exports = (eleventyConfig, markdownLibrary) => {
  // Eleventy's own Nunjucks environment, so the partial has the site's filters and includes
  let nunjucks;
  eleventyConfig.amendLibrary("njk", env => {
    nunjucks = env;
  });

  eleventyConfig.addPairedShortcode("timeline", (content, key) => {
    const file = path.join(root, "_data", "timelines", `${key}.json`);
    if (!fs.existsSync(file)) {
      throw new Error(`Timeline "${key}": no data at ${file}`);
    }
    const timeline = JSON.parse(fs.readFileSync(file, "utf8"));

    // Fail the build on data the template can't place
    const lanes = timeline.lanes.map(lane => lane.id);
    if (lanes.length < 1 || lanes.length > 2) {
      throw new Error(`Timeline "${key}": needs one or two lanes`);
    }
    // The years an event could start in: "1987", "2013–15", "1940s–54", "Late 1980s" or "Now"
    const starts = year => {
      if (/^now$/i.test(year)) return [Infinity, Infinity];
      const match = year.match(/^(?:(early|mid|late)-?\s*)?(\d{4})(s?)/i);
      if (!match) {
        throw new Error(`Timeline "${key}": can't read the year "${year}"`);
      }
      const [, part, digits, decade] = match;
      const from = Number(digits);
      if (!decade) return [from, from];
      return { early: [from, from + 3], mid: [from + 4, from + 6], late: [from + 7, from + 9] }[part?.toLowerCase()] ?? [from, from + 9];
    };
    // Events run in the order they start, so the year in the bar never runs backwards
    let earliest = -Infinity;
    for (const chapter of timeline.chapters) {
      if (!["apart", "close", "braid"].includes(chapter.rails)) {
        throw new Error(`Timeline "${key}": "${chapter.title}" has unknown rails "${chapter.rails}"`);
      }
      for (const event of chapter.events) {
        const crossover = event.lane === "both" && lanes.length === 2;
        if (!crossover && !lanes.includes(event.lane)) {
          throw new Error(`Timeline "${key}": "${event.title}" has unknown lane "${event.lane}"`);
        }
        const [from, to] = starts(event.year);
        if (to < earliest) {
          throw new Error(`Timeline "${key}": "${event.title}" (${event.year}) starts before an event listed ahead of it`);
        }
        earliest = Math.max(earliest, from);
        if (event.figure) {
          if (!event.figure.alt) {
            throw new Error(`Timeline "${key}": the figure for "${event.title}" needs alt text`);
          }
          if (!fs.existsSync(path.join(root, event.figure.src))) {
            throw new Error(`Timeline "${key}": no image at ${event.figure.src}`);
          }
        }
      }
    }

    const parts = content.split(/^\s*-{3,}\s*$/m);
    if (parts.length > 2) {
      throw new Error(`Timeline "${key}": use one --- line, between the opening and the closing`);
    }
    const [opening, closing] = parts.map(part => (part.trim() ? markdownLibrary.render(part.trim()) : ""));

    // Markdown ends an HTML block at a blank line, so drop them
    return nunjucks
      .render("partials/timeline.njk", { key, timeline, opening, closing })
      .replace(/\n\s*\n/g, "\n")
      .trim();
  });
};
