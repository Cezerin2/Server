import { ObjectID } from "mongodb"
import { db } from "../../lib/mongo"
import parse from "../../lib/parse"
import OrdersService from "./orders"

class OrdertDiscountsService {
  addDiscount(order_id: string | number | ObjectID, data: any) {
    if (!ObjectID.isValid(order_id)) {
      return Promise.reject("Invalid identifier")
    }
    const orderObjectID = new ObjectID(order_id)
    const discount = this.getValidDocumentForInsert(data)

    return db.collection("orders").updateOne(
      {
        _id: orderObjectID,
      },
      {
        $push: {
          discounts: discount,
        },
      }
    )
  }

  updateDiscount(
    order_id: string | number | ObjectID,
    discount_id: string | number | ObjectID,
    data: any
  ) {
    if (!ObjectID.isValid(order_id) || !ObjectID.isValid(discount_id)) {
      return Promise.reject("Invalid identifier")
    }
    const orderObjectID = new ObjectID(order_id)
    const discountObjectID = new ObjectID(discount_id)
    const discount = this.getValidDocumentForUpdate(data)

    return db
      .collection("orders")
      .updateOne(
        {
          _id: orderObjectID,
          "discounts.id": discountObjectID,
        },
        { $set: discount }
      )
      .then(() => OrdersService.getSingleOrder(order_id))
  }

  deleteDiscount(
    order_id: string | number | ObjectID,
    discount_id: string | number | ObjectID
  ) {
    if (!ObjectID.isValid(order_id) || !ObjectID.isValid(discount_id)) {
      return Promise.reject("Invalid identifier")
    }
    const orderObjectID = new ObjectID(order_id)
    const discountObjectID = new ObjectID(discount_id)

    return db
      .collection("orders")
      .updateOne(
        {
          _id: orderObjectID,
        },
        {
          $pull: {
            discounts: {
              id: discountObjectID,
            },
          },
        }
      )
      .then(() => OrdersService.getSingleOrder(order_id))
  }

  getValidDocumentForInsert(data: { name: any; amount: any }) {
    return {
      id: new ObjectID(),
      name: parse.getString(data.name),
      amount: parse.getNumberIfPositive(data.amount),
    }
  }

  getValidDocumentForUpdate(data: {
    variant_id?: any
    name?: any
    quantity?: any
    amount?: any
  }) {
    if (Object.keys(data).length === 0) {
      return new Error("Required fields are missing")
    }

    const discount = {}

    if (data.variant_id !== undefined) {
      discount["discounts.$.name"] = parse.getString(data.name)
    }

    if (data.quantity !== undefined) {
      discount["discounts.$.amount"] = parse.getNumberIfPositive(data.amount)
    }

    return discount
  }
}

export default new OrdertDiscountsService()
