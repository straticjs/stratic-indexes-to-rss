/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var through2 = require('through2'),
    RSS = require('rss'),
    defaults = require('lodash.defaults'),
    ineed = require('ineed'),
    isRelativeUrl = require('is-relative-url'),
    urlToolkit = require('url-toolkit'),
    handleOffset = require('stratic-handle-offset'),
    path = require('path');

module.exports = function(feedOpts, urlPrefix) {
	// Normal
	if (urlPrefix[urlPrefix.length - 1] !== '/') urlPrefix += '/';

	return through2.obj(function(file, enc, callback) {
		var filePath = path.parse(file.relative);
		var feedConfig = defaults({}, {
			generator: 'stratic-indexes-to-rss',
			feed_url: urlPrefix + filePath.dir + '/index.rss',
			site_url: urlPrefix + filePath.dir
		}, feedOpts);

		switch(file.data.indexType) {
		case 'main':
			break;
		case 'category':
			feedConfig.title += ' - ' + '\'' + file.data.category + '\' category';
			break;
		case 'month':
			feedConfig.title += ' - ';
			feedConfig.title += new Date(1970, file.data.month).toLocaleString('en-us', {month: 'long'});
			// TODO: I feel like there's something clever and DRY I can do here by letting this fall through...
			feedConfig.title += ' - ' + file.data.year;
			break;
		case 'year':
			feedConfig.title += ' - ' + file.data.year;
			break;
		default:
			throw new Error('unknown index type: ' + file.data.indexType);
		}

		var feed = new RSS(feedConfig);

		file.data.posts.map(function(post) {
			// TODO: I don't really know what the right behavior here is
			// Should we push for clean URLs by default? Make it customizable? I dunno.
			var _postPath = path.parse(post.relative),
			    postPath = post.relative.replace(_postPath.ext, '');

			// Make relative URLs absolute
			// TODO handle streams
			var _content = post.contents.toString();
			post.contents = Buffer.from(ineed.reprocess.hyperlinks(function(baseUrl, href) {
				return isRelativeUrl(href) ? urlToolkit.buildAbsoluteURL(urlPrefix, href, {normalize: true}) : href;
			}).fromHtml(_content));

			/*

			  This is kind of an evil hack.

			  The problem is that the `rss` module takes a JavaScript Date object, but we like to
			  use MomentJS moments to handle the timezone offset correctly. There's a
			  moment#toDate method, except that this returns a JavaScript Date which will consider
			  the date to be in the host system's local time, not the UTC offset recorded in the
			  post. Which is the bug we were trying to avoid by using MomentJS in the first place.

			  So, what we do is we set the moment to UTC mode so the host system's timezone
			  doesn't interfere. Then, we perform the offset ourselves so that the moment's UTC
			  time information has all the same numbers as the post's local time. We can then
			  convert it to a native Date object and the usual methods like Date#getDate will work
			  okay.

			  Obviously the resultant Date object's notion of timezone or offset information is
			  royally fucked, but I'm guessing `rss` doesn't care about any of that and just needs
			  the basic stuff. So this works, somehow.

			 */
			var moment = handleOffset(post.data.time);
			var date = moment.add(moment.utcOffset(), 'minutes').utc().toDate();

			return {
				title: post.data.title,
				url: urlPrefix + postPath,
				categories: post.data.categories,
				description: post.contents,
				date: date
			};
		}).forEach(function(item) {
			feed.item(item);
		});

		file.contents = Buffer.from(feed.xml());

		this.push(file);
		callback();
	});
};
