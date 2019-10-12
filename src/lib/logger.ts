import * as winston from 'winston';
import { Request, Response } from 'express';
const LOGS_FILE = 'logs/server.log';

winston.configure({
	transports: [
		new winston.transports.Console({
			level: 'debug',
			handleExceptions: true,
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple()
			)
		}),
		new winston.transports.File({
			level: 'info',
			handleExceptions: true,
			format: winston.format.json(),
			filename: LOGS_FILE
		})
	]
});

const getResponse = (message: string) => ({
	error: true,
	message
});

const logUnauthorizedRequests = (req: Request) => {
	// todo
};

const sendResponse = (err: Error, req: Request, res: Response, next: any) => {
	if (err && err.name === 'UnauthorizedError') {
		logUnauthorizedRequests(req);
		res.status(401).send(getResponse(err.message));
	} else if (err) {
		winston.error(err.stack!);
		res.status(500).send(getResponse(err.message));
	} else {
		next();
	}
};

export default {
	sendResponse
};
