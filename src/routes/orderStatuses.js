import security from '../lib/security';
import OrderStatusesService from '../services/orders/orderStatuses';

class OrderStatusesRoute {
	constructor(router) {
		this.router = router;
		this.registerRoutes();
	}

	registerRoutes() {
		this.router.get(
			'/v1/order_statuses',
			security.checkUserScope.bind(this, security.scope.READ_ORDER_STATUSES),
			this.getStatuses.bind(this)
		);
		this.router.post(
			'/v1/order_statuses',
			security.checkUserScope.bind(this, security.scope.WRITE_ORDER_STATUSES),
			this.addStatus.bind(this)
		);
		this.router.get(
			'/v1/order_statuses/:id',
			security.checkUserScope.bind(this, security.scope.READ_ORDER_STATUSES),
			this.getSingleStatus.bind(this)
		);
		this.router.put(
			'/v1/order_statuses/:id',
			security.checkUserScope.bind(this, security.scope.WRITE_ORDER_STATUSES),
			this.updateStatus.bind(this)
		);
		this.router.delete(
			'/v1/order_statuses/:id',
			security.checkUserScope.bind(this, security.scope.WRITE_ORDER_STATUSES),
			this.deleteStatus.bind(this)
		);
	}

	async getStatuses(req, res, next) {
		try {
			const data = await OrderStatusesService.getStatuses(req.query);
			return res.send(data);
		} catch (err) {
			return next(err);
		}
	}

	async getSingleStatus(req, res, next) {
		try {
			const data = await OrderStatusesService.getSingleStatus(req.params.id);
			if (data) {
				return res.send(data);
			}
			return res.status(404).end();
		} catch (err) {
			return next(err);
		}
	}

	async addStatus(req, res, next) {
		try {
			const data = OrderStatusesService.addStatus(req.body);
			return res.send(data);
		} catch (err) {
			return next(err);
		}
	}

	async updateStatus(req, res, next) {
		try {
			const data = await OrderStatusesService.updateStatus(
				req.params.id,
				req.body
			);
			if (data) {
				return res.send(data);
			}
			return res.status(404).end();
		} catch (err) {
			return next(err);
		}
	}

	async deleteStatus(req, res, next) {
		try {
			const data = await OrderStatusesService.deleteStatus(req.params.id);
			return res.status(data ? 200 : 404).end();
		} catch (err) {
			return next(err);
		}
	}
}

export default OrderStatusesRoute;
