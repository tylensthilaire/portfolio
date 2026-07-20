const { DateTime } = require("luxon");
const sass = require("sass");
const fs = require("fs");
const path = require("path");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItFootnote = require("markdown-it-footnote");

// Tufte sidenotes: repurpose markdown inline-footnote syntax `text^[the note]`
// into an inline, click-toggled margin note (asterisk marker, uncounted).
// Registered before `footnote_inline` so it claims `^[...]` first; reference
// footnotes `[^1]` are untouched and still collect in the footer.
function sidenotePlugin(md) {
  let uid = 0;

  md.inline.ruler.before("footnote_inline", "sidenote", (state, silent) => {
    const max = state.posMax;
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x5E /* ^ */) return false;
    if (start + 1 >= max || state.src.charCodeAt(start + 1) !== 0x5B /* [ */) return false;
    const labelStart = start + 2;
    const labelEnd = state.md.helpers.parseLinkLabel(state, start + 1);
    if (labelEnd < 0) return false;
    if (!silent) {
      state.pos = labelStart;
      state.posMax = labelEnd;
      state.push("sidenote_open", "span", 1);
      state.md.inline.tokenize(state);
      state.push("sidenote_close", "span", -1);
    }
    state.pos = labelEnd + 1;
    state.posMax = max;
    return true;
  });

  md.renderer.rules.sidenote_open = () => {
    const id = `sn-${++uid}`;
    return `<span class="c-sidenote">` +
      `<input type="checkbox" id="${id}" class="c-sidenote__toggle">` +
      `<label class="c-sidenote__marker" for="${id}" role="button" aria-label="Toggle sidenote"></label>` +
      `<small class="c-sidenote__note">`;
  };
  md.renderer.rules.sidenote_close = () => "</small></span>";
}

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);

  // Compile SCSS to CSS before each build
  eleventyConfig.on("eleventy.before", () => {
    const outputDir = path.join(__dirname, "_site", "css");
    fs.mkdirSync(outputDir, { recursive: true });
    for (const file of ["main", "critical"]) {
      const result = sass.compile(path.join(__dirname, "scss", `${file}.scss`), {
        style: "compressed"
      });
      fs.writeFileSync(path.join(outputDir, `${file}.css`), result.css);
    }
  });

  eleventyConfig.addWatchTarget("scss/");

  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");

  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if( n < 0 ) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  eleventyConfig.addFilter("min", (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  eleventyConfig.addCollection("tagList", function(collection) {
    let tagSet = new Set();
    collection.getAll().forEach(function(item) {
      if( "tags" in item.data ) {
        let tags = item.data.tags;

        tags = tags.filter(function(item) {
          switch(item) {
            // this list should match the `filter` list in tags.njk
            case "all":
            case "nav":
            case "post":
            case "posts":
            case "journal":
            return false;
          }

          return true;
        });

        for (const tag of tags) {
          tagSet.add(tag);
        }
      }
    });

    return [...tagSet];
  });

  // Copy the following directories to output directory
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("js");

  /* Markdown Overrides */
  let markdownLibrary = markdownIt({
    html: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "after",
      class: "direct-link",
      symbol: "#"
    })
  }).use(markdownItFootnote).use(sidenotePlugin);

  // Footnote references without square brackets — just the number (styled bold
  // terracotta in CSS to match the sidenote marker).
  markdownLibrary.renderer.rules.footnote_caption = (tokens, idx) => {
    let n = Number(tokens[idx].meta.id + 1).toString();
    if (tokens[idx].meta.subId > 0) n += ":" + tokens[idx].meta.subId;
    return n;
  };

  eleventyConfig.setLibrary("md", markdownLibrary);

  return {
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about those.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`
    // pathPrefix: "/",

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    // These are all optional, defaults are shown:
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
