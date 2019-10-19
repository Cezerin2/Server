import * as WebSocket from 'ws';
import * as url from 'url';
import security from './security';
import * as http from 'http';
import * as https from 'https';

let wss: WebSocket.Server | null = null;

const getTokenFromRequestPath = (requestPath: string) => {
	try {
		const urlObj = url.parse(requestPath, true);
		return urlObj.query.token;
	} catch (e) {
		return null;
	}
};

const verifyClient = (info: any, done: (success: boolean, code?: number) => void) => {
	if (security.DEVELOPER_MODE === true) {
		done(true);
	} else {
		const requestPath = info.req.url;
		const token = getTokenFromRequestPath(requestPath);
		security
			.verifyToken(token)
			.then(tokenDecoded => {
				// TODO: check access to dashboard
				done(true);
			})
			.catch(err => {
				done(false, 401);
			});
	}
};

const onConnection = (ws: WebSocket.Server, req: any) => {
	// TODO: ws.user = token.email
	ws.on('error', () => { });
	ws.on('message', (data: any) => broadcastToAll(data));
};

const broadcastToAll = (data: any) => {
	wss!.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data, error => { });
		}
	});
};

const listen = (server: http.Server | https.Server) => {
	wss = new WebSocket.Server({
		path: '/ws/dashboard', // Accept only connections matching this path
		maxPayload: 1024, // The maximum allowed message size
		backlog: 100, // The maximum length of the queue of pending connections.
		verifyClient, // An hook to reject connections
		server // A pre-created HTTP/S server to use
	});

	wss.on('connection', onConnection);
};

const send = (data: { event: any, payload: any }) => {
	broadcastToAll(JSON.stringify({ event: data.event, payload: data.payload }));
};

const events = {
	ORDER_CREATED: 'order.created',
	THEME_INSTALLED: 'theme.installed'
};

export default {
	listen,
	send,
	events
};
