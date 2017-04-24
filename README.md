# `stratic-paginate-indexes`

[Gulp][1] plugin to convert [Stratic][2] indexes into RSS feeds

## Installation

    npm install stratic-indexes-to-rss

## Usage

The module exports a function that takes two parameters:

* `feedOpts` (`Object`) - options for the feed which are passed (with some additions) directly to the [`rss`][3] module
* `urlPrefix` (`String`) - the URL under which all blog resources are published; also normally the main index's first page's URL. Used for things like converting relative URLs to absolute URLs and computing feed metadata URLs.

This function returns an object-mode through stream suitable for use inside `.pipe()`.

## Examples

Minimal `gulpfile.js` for this module to work:

```js
var gulp = require('gulp');
var frontMatter = require('gulp-gray-matter');
var straticDateInPath = require('stratic-date-in-path');
var starticIndexesToRss = require('stratic-indexes-to-rss');

gulp.task('rss', function() {
    gulp.src('*.md')
        .pipe(frontMatter())
        .pipe(straticDateInPath())
        .pipe(addsrc('src/blog/index.jade'))
        .pipe(postsToIndex('index.jade'))
        .pipe(straticIndexesToRss({title: 'Blag!'}, 'https://example.com/blog/'));
});
```

Complete example `gulpfile.js`:

```js
var gulp = require('gulp');
var frontMatter = require('gulp-gray-matter');
var remark = require('gulp-remark');
var remarkHtml = require('remark-html');
var straticDateInPath = require('stratic-date-in-path');
var addsrc = require('gulp-add-src');
var postsToIndex = require('stratic-posts-to-index');
var straticIndexesToRss = require('stratic-indexes-to-rss');
var rename = require('gulp-rename');

gulp.task('rss', function() {
    gulp.src('*.md')
        .pipe(frontMatter())
        .pipe(remark().use(remarkHtml))
        .pipe(straticDateInPath())
        .pipe(addsrc('src/blog/index.jade'))
        .pipe(postsToIndex('index.jade'))
        .pipe(straticIndexesToRss({title: 'Blag!'}, 'https://example.com/blog/'));
        .pipe(rename({ extname: '.rss' }))
        .pipe(gulp.dest('dist/blog'));
});
```

## License

LGPL 3.0+

## Author

Alex Jordan <alex@strugee.net>

 [1]: http://gulpjs.com/
 [2]: https://github.com/strugee/generator-stratic
 [3]: https://npmjs.com/package/rss
