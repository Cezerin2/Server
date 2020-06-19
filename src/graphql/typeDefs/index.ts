import { gql } from "apollo-server-express"

const typeDefs = gql`
  type Query {
    hello: String
    cat: String
    dog: String
  }
  type Products {
    hello: String
  }
  type ProductCategories {
    hello: String
  }
  type Sitemap {
    hello: String
  }
  type Theme {
    hello: String
  }
  type Customers {
    hello: String
  }
  type CustomerGroups {
    hello: String
  }
  type Orders {
    hello: String
  }
  type OrderStatuses {
    hello: String
  }
  type ShippingMethods {
    hello: String
  }
  type PaymentMethods {
    hello: String
  }
  type PaymentGateways {
    hello: String
  }
  type Settings {
    hello: String
  }
  type Pages {
    hello: String
  }
  type SecurityTokens {
    hello: String
  }
  type Notifications {
    hello: String
  }
  type Redirects {
    hello: String
  }
  type Files {
    hello: String
  }
  type Apps {
    hello: String
  }
  type Webhooks {
    hello: String
  }
`
export default typeDefs
