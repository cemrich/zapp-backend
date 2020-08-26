const cache = require('./cache');

const downloaders = [
	require('./ard-downloader'),
	require('./zdf-downloader'),
	require('./dw-downloader'),
	require('./parliament-downloader'),
];

exports.getShow = async function(channelId) {
	// look up in cache
	let show = cache.getShow(channelId);
	if (show !== null) {
		return show;
	}

	// download
	for (let downloader of downloaders) {
		if (downloader.channelIds.includes(channelId)) {
			return downloader.getShow(channelId).then(cache.save);
		}
	}

	// neither cache nor download available
	throw 'no downloader available';
};
