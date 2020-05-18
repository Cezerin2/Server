const resolvers = {
  Query: {
    hello: () => "Hello world!",
    cat: () => "It's a dog!",
    dog: () => "It's a cat!",
  },
  Products: { hello: () => "Hello Products!" },
  ProductCategories: { hello: () => "Hello ProductCategories!" },
  Sitemap: { hello: () => "Hello Sitemap!" },
  Theme: { hello: () => "Hello Theme!" },
  Customers: { hello: () => "Hello Customers!" },
  CustomerGroups: { hello: () => "Hello CustomerGroups!" },
  Orders: { hello: () => "Hello Orders!" },
  OrderStatuses: { hello: () => "Hello OrderStatuses!" },
  ShippingMethods: { hello: () => "Hello ShippingMethods!" },
  PaymentMethods: { hello: () => "Hello PaymentMethods!" },
  PaymentGateways: { hello: () => "Hello PaymentGateways!" },
  Settings: { hello: () => "Hello Settings!" },
  Pages: { hello: () => "Hello Pages!" },
  SecurityTokens: { hello: () => "Hello SecurityTokens!" },
  Notifications: { hello: () => "Hello Notifications!" },
  Redirects: { hello: () => "Hello Redirects!" },
  Files: { hello: () => "Hello Files!" },
  Apps: { hello: () => "Hello Apps!" },
  Webhooks: { hello: () => "Hello Webhooks!" },
}

export default resolvers
