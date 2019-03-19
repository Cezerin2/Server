import security from '../lib/security';
import WebhooksService from '../services/webhooks';

class WebhooksRoute {
	constructor(router) {
		this.router = router;
		this.registerRoutes();
	}

	registerRoutes() {
		this.router.get(
			'/v1/webhooks',
			security.checkUserScope.bind(this, security.scope.READ_SETTINGS),
			this.getWebhooks.bind(this)
		);
		this.router.post(
			'/v1/webhooks',
			security.checkUserScope.bind(this, security.scope.WRITE_SETTINGS),
			this.addWebhook.bind(this)
		);
		this.router.get(
			'/v1/webhooks/:id',
			security.checkUserScope.bind(this, security.scope.READ_SETTINGS),
			this.getSingleWebhook.bind(this)
		);
		this.router.put(
			'/v1/webhooks/:id',
			security.checkUserScope.bind(this, security.scope.WRITE_SETTINGS),
			this.updateWebhook.bind(this)
		);
		this.router.delete(
			'/v1/webhooks/:id',
			security.checkUserScope.bind(this, security.scope.WRITE_SETTINGS),
			this.deleteWebhook.bind(this)
		);
	}

	async getWebhooks(req, res, next) {
		WebhooksService.getWebhooks(req.query)
			.then(data => {
				return res.send(data);
			})
			.catch(next);
	}

	async getSingleWebhook(req, res, next) {
		WebhooksService.getSingleWebhook(req.params.id)
			.then(data => {
				if (data) {
					return res.send(data);
				} else {
					return res.status(404).end();
				}
			})
			.catch(next);
	}

	async addWebhook(req, res, next) {
		WebhooksService.addWebhook(req.body)
			.then(data => {
				return res.send(data);
			})
			.catch(next);
	}

	async updateWebhook(req, res, next) {
		WebhooksService.updateWebhook(req.params.id, req.body)
			.then(data => {
				if (data) {
					return res.send(data);
				} else {
					return res.status(404).end();
				}
			})
			.catch(next);
	}

	async deleteWebhook(req, res, next) {
		WebhooksService.deleteWebhook(req.params.id)
			.then(data => {
				return res.status(data ? 200 : 404).end();
			})
			.catch(next);
	}
}

export default WebhooksRoute;
