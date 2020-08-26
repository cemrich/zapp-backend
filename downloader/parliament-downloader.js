const axios = require('axios');
const moment = require('moment-timezone');
const xml2js = require('xml2js');
const Show = require('../models/Show');

const urls = {
	parlamentsfernsehen_1: 'https://www.bundestag.de/includes/datasources/tv.xml',
	parlamentsfernsehen_2: 'https://www.bundestag.de/includes/datasources/tv2.xml',
};

exports.channelIds = ['parlamentsfernsehen_1', 'parlamentsfernsehen_2'];

function parseShow(showData, channelId) {
	let show = new Show(showData.langtitel[0]);
	show.description = showData.infos[0] || null;
	show.channel = channelId;
	show.startTime = moment(showData.anfangUnix * 1000);
	show.endTime = moment(showData.endeUnix * 1000);
	show.subtitle = showData.live[0] || 'Aufzeichnung vom ' + showData.aufzeichnungsdatum[0];
	return show;
}

async function getShow(xml, channelId) {
	let intermission = Show.INTERMISSION;
	const data = await xml2js.parseStringPromise(xml);

	if (data.tvprogramm.length == 0) {
		return null;
	}

	let lastShow = null;

	for (let show of data.tvprogramm.sendung) {
		let parsedShow = parseShow(show, channelId);

		if (parsedShow.startTime.isBefore()) {
			if (parsedShow.endTime.isAfter()) {
				return parsedShow;
			}
		} else if (lastShow) {
			intermission.startTime = lastShow.endTime;
			intermission.endTime = parsedShow.startTime;
			return intermission;
		}

		lastShow = parsedShow;
	}

	return intermission;
}

exports.getShow = async function (channelId) {
	const url = urls[channelId];
	const response = await axios.get(url);

	if (response.status !== 200) {
		throw 'wrong status code for getShow: ' + response.status;
	}

	const show = await getShow(response.data, channelId);

	if (show === null) {
		throw('show info currently not available');
	}

	return show;
};
