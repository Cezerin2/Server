import { ObjectID } from "mongodb"
import { db } from "../../lib/mongo"
import parse from "../../lib/parse"
import ProductsService from "../products/products"
import ProductStockService from "../products/stock"
import OrdersService from "./orders"

class OrderItemsService {
  async addItem(order_id: string | number | ObjectID, data: any) {
    if (!ObjectID.isValid(order_id)) {
      return Promise.reject("Invalid identifier")
    }

    const newItem = this.getValidDocumentForInsert(data)
    const orderItem = await this.getOrderItemIfExists(
      order_id,
      newItem.product_id,
      newItem.variant_id
    )

    if (orderItem) {
      await this.updateItemQuantityIfAvailable(order_id, orderItem, newItem)
    } else {
      await this.addNewItem(order_id, newItem)
    }

    return OrdersService.getSingleOrder(order_id)
  }

  async updateItemQuantityIfAvailable(
    order_id: any,
    orderItem: { quantity: any; id: any },
    newItem: {
      product_image?: any[]
      id?: ObjectID
      product_id: any
      variant_id: any
      quantity: any
    }
  ) {
    const quantityNeeded = orderItem.quantity + newItem.quantity
    const availableQuantity = await this.getAvailableProductQuantity(
      newItem.product_id,
      newItem.variant_id,
      quantityNeeded
    )

    if (availableQuantity > 0) {
      await this.updateItem(order_id, orderItem.id, {
        quantity: availableQuantity,
      })
    }
  }

  async addNewItem(
    order_id: string | number | ObjectID,
    newItem: {
      product_image?: any[]
      id: any
      product_id: any
      variant_id: any
      quantity: any
    }
  ) {
    const orderObjectID = new ObjectID(order_id)
    const availableQuantity = await this.getAvailableProductQuantity(
      newItem.product_id,
      newItem.variant_id,
      newItem.quantity
    )

    if (availableQuantity > 0) {
      newItem.quantity = availableQuantity
      await db.collection("orders").updateOne(
        {
          _id: orderObjectID,
        },
        {
          $push: {
            items: newItem,
          },
        }
      )

      await this.calculateAndUpdateItem(order_id, newItem.id)
      await ProductStockService.handleAddOrderItem(order_id, newItem.id)
    }
  }

  async getAvailableProductQuantity(
    product_id: { toString: () => any },
    variant_id: any,
    quantityNeeded: number
  ) {
    const product = await ProductsService.getSingleProduct(
      product_id.toString()
    )

    if (!product) {
      return 0
    }
    if (product.discontinued) {
      return 0
    }
    if (product.stock_backorder) {
      return quantityNeeded
    }
    if (product.variable && variant_id) {
      const variant = this.getVariantFromProduct(product, variant_id)
      if (variant) {
        return variant.stock_quantity >= quantityNeeded
          ? quantityNeeded
          : variant.stock_quantity
      }
      return 0
    }
    return product.stock_quantity >= quantityNeeded
      ? quantityNeeded
      : product.stock_quantity
  }

  async getOrderItemIfExists(
    order_id: string | number | ObjectID,
    product_id: ObjectID,
    variant_id: ObjectID
  ) {
    const orderObjectID = new ObjectID(order_id)
    const order = await db.collection("orders").findOne(
      {
        _id: orderObjectID,
      },
      {
        items: 1,
      }
    )

    if (order && order.items && order.items.length > 0) {
      return order.items.find(
        (item: { product_id: { toString: () => any }; variant_id: any }) =>
          item.product_id.toString() === product_id.toString() &&
          (item.variant_id || "").toString() === (variant_id || "").toString()
      )
    }
    return null
  }

  async updateItem(
    order_id: string | number | ObjectID,
    item_id: string | number | ObjectID,
    data: { quantity: any }
  ) {
    if (!ObjectID.isValid(order_id) || !ObjectID.isValid(item_id)) {
      return Promise.reject("Invalid identifier")
    }
    const orderObjectID = new ObjectID(order_id)
    const itemObjectID = new ObjectID(item_id)
    const item = this.getValidDocumentForUpdate(data)

    if (parse.getNumberIfPositive(data.quantity) === 0) {
      // delete item
      return this.deleteItem(order_id, item_id)
    }
    // update
    await ProductStockService.handleDeleteOrderItem(order_id, item_id)
    await db.collection("orders").updateOne(
      {
        _id: orderObjectID,
        "items.id": itemObjectID,
      },
      {
        $set: item,
      }
    )

    await this.calculateAndUpdateItem(order_id, item_id)
    await ProductStockService.handleAddOrderItem(order_id, item_id)
    return OrdersService.getSingleOrder(order_id)
  }

  getVariantFromProduct(
    product: { variants: any[] },
    variantId: string | any[]
  ) {
    if (product.variants && product.variants.length > 0) {
      return product.variants.find(
        (variant: { id: { toString: () => any } }) =>
          variant.id.toString() === variantId.toString()
      )
    }

    return null
  }

  getOptionFromProduct(
    product: { options: any[] },
    optionId: { toString: () => any }
  ) {
    if (product.options && product.options.length > 0) {
      return product.options.find(
        (item: { id: { toString: () => any } }) =>
          item.id.toString() === optionId.toString()
      )
    }

    return null
  }

  getOptionValueFromProduct(
    product: any,
    optionId: any,
    valueId: { toString: () => any }
  ) {
    const option = this.getOptionFromProduct(product, optionId)
    if (option && option.values && option.values.length > 0) {
      return option.values.find(
        (item: { id: { toString: () => any } }) =>
          item.id.toString() === valueId.toString()
      )
    }

    return null
  }

  getOptionNameFromProduct(product: any, optionId: any) {
    const option = this.getOptionFromProduct(product, optionId)
    return option ? option.name : null
  }

  getOptionValueNameFromProduct(product: any, optionId: any, valueId: any) {
    const value = this.getOptionValueFromProduct(product, optionId, valueId)
    return value ? value.name : null
  }

  getVariantNameFromProduct(product: any, variantId: any) {
    const variant = this.getVariantFromProduct(product, variantId)
    if (variant) {
      const optionNames = []
      for (const option of variant.options) {
        const optionName = this.getOptionNameFromProduct(
          product,
          option.option_id
        )
        const optionValueName = this.getOptionValueNameFromProduct(
          product,
          option.option_id,
          option.value_id
        )
        optionNames.push(`${optionName}: ${optionValueName}`)
      }
      return optionNames.join(", ")
    }

    return null
  }

  async calculateAndUpdateItem(
    orderId: string | number | ObjectID,
    itemId: string | number | ObjectID
  ) {
    // TODO: tax_total, discount_total

    const orderObjectID = new ObjectID(orderId)
    const itemObjectID = new ObjectID(itemId)

    const order = await OrdersService.getSingleOrder(orderId)

    if (order && order.items && order.items.length > 0) {
      const item = order.items.find(
        (i: { id: { toString: () => any } }) =>
          i.id.toString() === itemId.toString()
      )
      if (item) {
        const itemData = await this.getCalculatedData(item)
        await db.collection("orders").updateOne(
          {
            _id: orderObjectID,
            "items.id": itemObjectID,
          },
          {
            $set: itemData,
          }
        )
      }
    }
  }

  async getCalculatedData(item: {
    product_id: { toString: () => any }
    custom_price: number
    custom_note: any
    quantity: number
    variant_id: any
  }) {
    const product = await ProductsService.getSingleProduct(
      item.product_id.toString()
    )

    if (item.custom_price && item.custom_price > 0) {
      // product with custom price - can set on client side
      return {
        "items.$.product_image": product.images,
        "items.$.sku": product.sku,
        "items.$.name": product.name,
        "items.$.variant_name": item.custom_note || "",
        "items.$.price": item.custom_price,
        "items.$.tax_class": product.tax_class,
        "items.$.tax_total": 0,
        "items.$.weight": product.weight || 0,
        "items.$.discount_total": 0,
        "items.$.price_total": item.custom_price * item.quantity,
      }
    }
    if (item.variant_id) {
      // product with variant
      const variant = this.getVariantFromProduct(product, item.variant_id)
      const variantName = this.getVariantNameFromProduct(
        product,
        item.variant_id
      )
      const variantPrice =
        variant.price && variant.price > 0 ? variant.price : product.price

      if (variant) {
        return {
          "items.$.product_image": product.images,
          "items.$.sku": variant.sku,
          "items.$.name": product.name,
          "items.$.variant_name": variantName,
          "items.$.price": variantPrice,
          "items.$.tax_class": product.tax_class,
          "items.$.tax_total": 0,
          "items.$.weight": variant.weight || 0,
          "items.$.discount_total": 0,
          "items.$.price_total": variantPrice * item.quantity,
        }
      }

      // variant not exists
      return null
    }
    // normal product
    return {
      "items.$.product_image": product.images,
      "items.$.sku": product.sku,
      "items.$.name": product.name,
      "items.$.variant_name": "",
      "items.$.price": product.price,
      "items.$.tax_class": product.tax_class,
      "items.$.tax_total": 0,
      "items.$.weight": product.weight || 0,
      "items.$.discount_total": 0,
      "items.$.price_total": product.price * item.quantity,
    }
  }

  async calculateAndUpdateAllItems(order_id: any) {
    const order = await OrdersService.getSingleOrder(order_id)

    if (order && order.items) {
      for (const item of order.items) {
        await this.calculateAndUpdateItem(order_id, item.id)
      }
      return OrdersService.getSingleOrder(order_id)
    }

    // order.items is empty
    return null
  }

  async deleteItem(
    order_id: string | number | ObjectID,
    item_id: string | number | ObjectID
  ) {
    if (!ObjectID.isValid(order_id) || !ObjectID.isValid(item_id)) {
      return Promise.reject("Invalid identifier")
    }
    const orderObjectID = new ObjectID(order_id)
    const itemObjectID = new ObjectID(item_id)

    await ProductStockService.handleDeleteOrderItem(order_id, item_id)
    await db.collection("orders").updateOne(
      {
        _id: orderObjectID,
      },
      {
        $pull: {
          items: {
            id: itemObjectID,
          },
        },
      }
    )

    return OrdersService.getSingleOrder(order_id)
  }

  getValidDocumentForInsert(data: {
    product_id: any
    variant_id: any
    quantity: any
    custom_price: any
    custom_note: any
  }) {
    const productImage = parse.getObjectIDIfValid(data.product_id)
    const item = {
      product_image: [],
      id: new ObjectID(),
      product_id: parse.getObjectIDIfValid(data.product_id),
      variant_id: parse.getObjectIDIfValid(data.variant_id),
      quantity: parse.getNumberIfPositive(data.quantity) || 1,
      custom_price: {},
      custom_note: {},
    }

    if (data.custom_price) {
      item.custom_price = parse.getNumberIfPositive(data.custom_price)
    }

    if (data.custom_note) {
      item.custom_note = parse.getString(data.custom_note)
    }

    return item
  }

  getValidDocumentForUpdate(data: { variant_id?: any; quantity?: any }) {
    if (Object.keys(data).length === 0) {
      return new Error("Required fields are missing")
    }

    const item = {}

    if (data.variant_id !== undefined) {
      item["items.$.variant_id"] = parse.getObjectIDIfValid(data.variant_id)
    }

    if (data.quantity !== undefined) {
      item["items.$.quantity"] = parse.getNumberIfPositive(data.quantity)
    }

    return item
  }
}

export default new OrderItemsService()
