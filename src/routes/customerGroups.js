import security from '../lib/security';
import CustomerGroupsService from '../services/customers/customerGroups';

class CustomerGroupsRoute {
	constructor(router) {
		this.router = router;
		this.registerRoutes();
	}

	registerRoutes() {
		this.router.get(
			'/v1/customer_groups',
			security.checkUserScope.bind(this, security.scope.READ_CUSTOMER_GROUPS),
			this.getGroups.bind(this)
		);
		this.router.post(
			'/v1/customer_groups',
			security.checkUserScope.bind(this, security.scope.WRITE_CUSTOMER_GROUPS),
			this.addGroup.bind(this)
		);
		this.router.get(
			'/v1/customer_groups/:id',
			security.checkUserScope.bind(this, security.scope.READ_CUSTOMER_GROUPS),
			this.getSingleGroup.bind(this)
		);
		this.router.put(
			'/v1/customer_groups/:id',
			security.checkUserScope.bind(this, security.scope.WRITE_CUSTOMER_GROUPS),
			this.updateGroup.bind(this)
		);
		this.router.delete(
			'/v1/customer_groups/:id',
			security.checkUserScope.bind(this, security.scope.WRITE_CUSTOMER_GROUPS),
			this.deleteGroup.bind(this)
		);
	}

	async getGroups(req, res, next) {
		try {
			const data = await CustomerGroupsService.getGroups(req.query);
			return res.send(data);
		} catch (err) {
			return next(err);
		}
	}

	async getSingleGroup(req, res, next) {
		try {
			const data = await CustomerGroupsService.getSingleGroup(req.params.id);
			if (data) {
				return res.send(data);
			}
			return res.status(404).end();
		} catch (err) {
			return next(err);
		}
	}

	async addGroup(req, res, next) {
		try {
			const data = CustomerGroupsService.addGroup(req.body);
			return res.send(data);
		} catch (err) {
			return next(err);
		}
	}

	async updateGroup(req, res, next) {
		try {
			const data = await CustomerGroupsService.updateGroup(
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

	async deleteGroup(req, res, next) {
		try {
			const data = await CustomerGroupsService.deleteGroup(req.params.id);
			return res.status(data ? 200 : 404).end();
		} catch (err) {
			return next(err);
		}
	}
}

export default CustomerGroupsRoute;
