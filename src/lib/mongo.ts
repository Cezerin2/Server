import * as winston from 'winston';
import * as url from 'url';
import { MongoClient, Db } from 'mongodb';
import { serverConfig } from './settings';

const mongodbConnection = serverConfig.mongodbServerUrl;
const mongoPathName = url.parse(mongodbConnection as string).pathname;
const dbName = mongoPathName!.substring(mongoPathName!.lastIndexOf('/') + 1);

const RECONNECT_INTERVAL = 1000;
const CONNECT_OPTIONS = {
	reconnectTries: 3600,
	reconnectInterval: RECONNECT_INTERVAL,
	useNewUrlParser: true
};

const onClose = () => {
	winston.info('MongoDB connection was closed');
};

const onReconnect = () => {
	winston.info('MongoDB reconnected');
};

export let db: Db | null = null;

const connectWithRetry = () => {
	MongoClient.connect(mongodbConnection as string, CONNECT_OPTIONS, (err, client) => {
		if (err) {
			winston.error(
				`MongoDB connection was failed: ${err.message}`,
				err.message
			);
			setTimeout(connectWithRetry, RECONNECT_INTERVAL);
		} else {
			db = client.db(dbName);
			db.on('close', onClose);
			db.on('reconnect', onReconnect);
			winston.info('MongoDB connected successfully');
		}
	});
};

connectWithRetry();
