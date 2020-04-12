import { db } from '../../lib/mongo';

class PaymentGatewaysService {
	getGateway(gatewayName) {
		return db
			.collection('paymentGateways')
			.findOne({ name: gatewayName })
			.then(data => this.changeProperties(data));
	}

	updateGateway(gatewayName, data) {
		if (Object.keys(data).length === 0) {
			return this.getGateway(gatewayName);
		}
		return db
			.collection('paymentGateways')
			.updateOne({ name: gatewayName }, { $set: data }, { upsert: true })
			.then(res => this.getGateway(gatewayName));
	}

	changeProperties(data) {
		if (data) {
			delete data._id;
			delete data.name;
		}
		return data;
	}
}

export default new PaymentGatewaysService();
