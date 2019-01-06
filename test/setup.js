import winston from 'winston';
import url from 'url';
import { MongoClient } from 'mongodb';
import logger from '../src/api/server/lib/logger';
import settings from '../src/api/server/lib/settings';

const prepare = require('mocha-prepare');

const mongodbConnection = settings.mongodbServerUrl;
const mongoPathName = url.parse(mongodbConnection).pathname;
const dbName = mongoPathName.substring(mongoPathName.lastIndexOf('/') + 1);

const CONNECT_OPTIONS = {
	useNewUrlParser: true
};

const DEFAULT_LANGUAGE = 'english';

const addUser = async (db, userEmail) => {
	if (userEmail && userEmail.includes('@')) {
		const tokensCount = await db.collection('tokens').countDocuments({
			email: userEmail
		});
		const tokensNotExists = tokensCount === 0;

		if (tokensNotExists) {
			await db.collection('tokens').insertOne({
				is_revoked: false,
				date_created: new Date(),
				expiration: 72,
				name: 'Owner',
				email: userEmail,
				scopes: ['admin']
			});
			winston.info(`- Added token with email: ${userEmail}`);
		}
	}
};

const addSettings = async (db, { domain }) => {
	if (domain && (domain.includes('https://') || domain.includes('http://'))) {
		await db.collection('settings').updateOne(
			{},
			{
				$set: {
					domain
				}
			},
			{ upsert: true }
		);
		winston.info(`- Set domain: ${domain}`);
	}
};

before(async () => {
	let client = null;
	let db = null;

	try {
		client = await MongoClient.connect(
			mongodbConnection,
			CONNECT_OPTIONS
		);
		db = client.db(dbName);
		winston.info(`Successfully connected to ${mongodbConnection}`);
	} catch (e) {
		winston.error(`MongoDB connection was failed. ${e.message}`);
		return;
	}

	const adminEmail = settings.adminEmail;
	const domain = settings.domain;

	await addUser(db, adminEmail);
	await addSettings(db, {
		domain
	});

	client.close();
});
