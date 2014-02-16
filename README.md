# SGF.js

SGF.js is a Go/Baduk/Weiqi game viewer for use in blogs, forums, etc.  It
automatically finds go game records on the page and replaces it with an
interactive player.  We've designed the player to be completely responsive
and fully skinable.

## Basic usage

Simply link the library and stylesheet from your page.

```html
<link rel="stylesheet" href="sgf.css">
<script src="sgf.js"></script>
```

Elsewhere in your HTML content add an `<sgf>` tag with either `src` attribute
linking to an SGF file, a `data` attribute containing SGF data, or the SGF
data surrounded by the tag.
