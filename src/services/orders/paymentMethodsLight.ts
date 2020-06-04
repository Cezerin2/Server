import { db } from "../../lib/mongo.ts"

class PaymentMethodsLightService {
  getMethods(filter = {}) {
    return db
      .collection("paymentMethods")
      .find(filter)
      .toArray()
      .then(items => items.map(item => this.changeProperties(item)))
  }

  changeProperties(item) {
    if (item) {
      item.id = item._id.toString()
      delete item._id
    }
    return item
  }
}

export default new PaymentMethodsLightService()
