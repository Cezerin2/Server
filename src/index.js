import * as express from 'express';
import * as helmet from 'helmet';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as responseTime from 'response-time';
import * as winston from 'winston';
import logger from './lib/logger';
import { serverConfig } from './lib/settings';
import security from './lib/security';
import dashboardWebSocket from './lib/dashboardWebSocket';
import ajaxRouter from './ajaxRouter';
import apiRouter from './apiRouter';
const app = express();

const STATIC_OPTIONS = {
	maxAge: 31536000000 // One year
};

app.set('trust proxy', 1);
app.use(helmet());

app.get('/images/:entity/:id/:size/:filename', (req, res, next) => {
	// A stub of image resizing (can be done with Nginx)
	const newUrl = `/images/${req.params.entity}/${req.params.id}/${req.params.filename}`;
	req.url = newUrl;
	next();
});
app.use(express.static('public/content', STATIC_OPTIONS));

security.applyMiddleware(app);

app.all('*', (req, res, next) => {
	// CORS headers
	const allowedOrigins = security.getAccessControlAllowOrigin();
	const { origin } = req.headers;
	if (allowedOrigins === '*') {
		res.setHeader('Access-Control-Allow-Origin', allowedOrigins);
	} else if (allowedOrigins.indexOf(origin) > -1) {
		res.setHeader('Access-Control-Allow-Origin', origin);
	}

	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Key, Authorization'
	);
	next();
});

app.use(responseTime());
app.use(cookieParser(serverConfig.cookieSecretKey));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/ajax', ajaxRouter);
app.use('/api', apiRouter);
app.use(logger.sendResponse);

const server = app.listen(serverConfig.apiListenPort, () => {
	const serverAddress = server.address();
	winston.info(`API running at http://localhost:${serverAddress.port}`);
});

dashboardWebSocket.listen(server);
