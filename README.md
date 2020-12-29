<!-- markdownlint-disable MD041 -->
<div align=center>
<!-- Logo here -->
<h1>Tylen St Hilaire's Portfolio</br>
<sub>Source code for tylensthilaire.com</sub></h1>

![Netlify](https://img.shields.io/netlify/7736d6e0-31e9-48c3-9228-2175540f8c02)
![Status](https://img.shields.io/website?url=https%3A%2F%2Ftylensthilaire.com)
![Activity](https://img.shields.io/github/last-commit/tylensthilaire/portfolio/develop)
![Dependencies](https://img.shields.io/david/tylensthilaire/portfolio)
![Version](https://img.shields.io/github/package-json/v/tylensthilaire/portfolio)

This is the source code for `tylensthilaire.com`,
a collection of creative output from Tylen St Hilaire.
The site and content are created and maintained in public,
as an exercise in practice and collaboration.

</div>

<!-- Screenshot here -->

## Contributing

This website is continually evolving.
Suggestions, improvements and bugs are welcomed
via [issues](../../issues)
or by a pull request from your fork.

### Design and content

The easiest way to contribute to the design or content
is by raising an issue
and describing the suggested change.
For more substantial changes
a pull request is recommended.
If you don't use GitHub,
you can download the repo
edit the .sketch or .md files,
and attach them (zipped) to an issue.

### Code

All but the most negligible code contributions
should come in the form of a pull request.
To run the site locally,
clone the repo,
install the npm dependencies
and run the serve command.
Once cloned,
the repository should be self documenting
– if not,
raise an issue for help.

<details>
  <summary>Quickstart steps</summary>

### 1. Clone this Repository

```bash
git clone https://github.com/tylensthilaire/portfolio.git my-fork
```

### 2. Navigate to the directory

```bash
cd my-fork
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npx eleventy --serve
```

</details>

### Conventions

**Semantic versioning** is used to track version numbers following the [SemVer](https://semver.org) standard.

- Version numbers aren't too important for the repo as a whole,
  but are important for content.
- Each content file has an individual version number,
  separate from the repository as a whole.
- Content changes do not update the repo version number.
- The repo version number is stored in the `package.json`,
- Version numbers for content are stored in the yaml frontmatter of each markdown file.

**Commit messages** should follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard.

- This makes the project history easy to understand
  and helps track changes for semantic versioning.

**Self documenting** code, in the form of comments, ensures the repo is easy for people to pick up and run with.

- Comment everything. E v e r y t h i n g.
- Designers should be able to read the code,
  because at least one _will_ need to read the code.

**Semantic line breaks** keeps content version-control friendly.
For more information see [Semantic Line Breaks](https://sembr.org).

- Following the letter of the specification is not required.
- Following the spirit is.

<details>
  <summary>Project structure</summary>

```ascii
.
├─ _data/metadata.json      // Global data file
├─ _includes
   ├─ layouts
      ├─ base.njk           // Master template
      ├─ home.njk           // Homepage template
      └─ post.njk           // Post template
   └─ postslist.njk         // Post lists component
├─ .github/funding.yml
├─ .vscode/settings.json
├─ about                    // Bio page
├─ css                      // Electron JS app folder
├─ feed                     // Feed files
   └─ ...
├─ img                      // Image files
   └─ ...
├─ posts
   └─ ...                   // Posts
├─ .editorconfig
├─ .gitignore
├─ .nvmrc
├─ .travis.yml
├─ archive.njk
├─ index.njk                // Homepage
├─ LICENSE
├─ netlify.toml
├─ package.json
├─ page-list.njk
└─ README.md                // ☛ You are here
├─ sitemap.xml.njk
├─ tags-list.njk
└─ tags.njk
```

</details>

### Help

For help, raise an issue and label it `question`.
Alternatively, contact an [author](#author) directly.

## Technologies

<table role="presentation">
  <tr align="center">
    <td><img width="4rem" src="img/readme/npm.png" alt="npm"></br>npm</td>
    <td><img width="4rem" src="img/readme/11ty.png" alt="11ty"></br>11ty</td>
    <td><img width="4rem" src="img/readme/netlify.png" alt="netlify"></br>Netlify</td>
    <td><img width="4rem" src="img/readme/sketch.png" alt="sketch"></br>Sketch</td>
    <td><img width="4rem" src="img/readme/markdown.png" alt="markdown"></br>Markdown</td>
    <td><img width="4rem" src="img/readme/nunjucks.png" alt="nunjucks"></br>Nunjucks</td>
    <td><img width="4rem" src="img/readme/sass.png" alt="sass"></br>Sass</td>
  </tr>
</table>

<!--
## Support

Buy me a coffee, ko-fi, patreon badge / button etc
-->

## Authors

<table role="presentation">
  <tr align="center">
    <td><a href="https://twitter.com/"><img width="6rem" src="img/readme/tylensthilaire.jpg" alt="Portrait of Tylen St Hilaire"></br>@tylensthilaire</a></td>
    <td><img width="6rem" src="img/readme/11ty.png" alt="Blank portrait"></br>You?</td>
  </tr>
</table>
<!-- See also the list of [contributors](../../contributors) who helped this project. -->

<!--
## Acknowledgements

-->

## Licence

© 2020–present, Tylen St Hilaire  
Except where otherwise noted,
code is licenced under [MIT](https://choosealicense.com/licenses/mit/)
and content is licenced under [CC BY-SA 4.0](https://choosealicense.com/licenses/cc-by-sa-4.0/).
