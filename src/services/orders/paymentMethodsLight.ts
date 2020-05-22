import { db } from "../../lib/mongo"

class PaymentMethodsLightService {
  getMethods(filter = {}) {
    return db
      .collection("paymentMethods")
      .find(filter)
      .toArray()
      .then((items: any[]) =>
        items.map((item: any) => this.changeProperties(item))
      )
  }

  changeProperties(item: { id: any; _id: { toString: () => any } }) {
    if (item) {
      item.id = item._id.toString()
      delete item._id
    }
    return item
  }
}

export default new PaymentMethodsLightService()
