'use strict';

const Http = require('http'),
	  Url = require('url'),
	  Fs = require('fs'),
	  Path = require('path'),
	  IFTTT = require('./ifttt');

const log = require('./logger');
const routines_path = '/routines.json';
const ifttt = new IFTTT(process.env.IFTTT_KEY);

let routines;

try {
	routines = require(routines_path);
} catch (e) {
	log.error(`${routines_path} not found.`);
	return;
}

const routes = Object.keys(routines).reduce((obj, key) => {
	obj[key] = (url, res) => {
		routines[key].forEach(event => ifttt.trigger(event, () => {
			log.debug("Trigger called for event:", event);
		}));
	};

	return obj;
}, {});

const app = Http.createServer((req, res) => {
	const { headers, method } = req;
	const url = Url.parse(req.url, true);
	const route = routes[url.pathname];

	log.debug(headers, method);

	if (url.query.access_code !== process.env.ACCESS_CODE) {
		res.writeHead(403);
		res.end();	
		return;
	}

	if (!route) {
		res.writeHead(404);
		res.end();	
		return;
	}

	try {
		route(url, res);
	} catch (e) {
		log.error(e);
		res.writeHead(500);
		res.end();
	}
});

app.listen(80);