import { express } from "./deps.ts"
import AppsRoute from "./routes/apps.ts"
import CustomerGroupsRoute from "./routes/customerGroups.ts"
import CustomersRoute from "./routes/customers.ts"
import FilesRoute from "./routes/files.ts"
import NotificationsRoute from "./routes/notifications.ts"
import OrdersRoute from "./routes/orders.ts"
import OrderStatusesRoute from "./routes/orderStatuses.ts"
import PagesRoute from "./routes/pages.ts"
import PaymentGatewaysRoute from "./routes/paymentGateways.ts"
import PaymentMethodsRoute from "./routes/paymentMethods.ts"
import ProductCategoriesRoute from "./routes/productCategories.ts"
import ProductsRoute from "./routes/products.ts"
import RedirectsRoute from "./routes/redirects.ts"
import SettingsRoute from "./routes/settings.ts"
import ShippingMethodsRoute from "./routes/shippingMethods.ts"
import SitemapRoute from "./routes/sitemap.ts"
import ThemeRoute from "./routes/theme.ts"
import SecurityTokensRoute from "./routes/tokens.ts"
import WebhooksRoute from "./routes/webhooks.ts"

const apiRouter = express.Router()

new ProductsRoute(apiRouter)
new ProductCategoriesRoute(apiRouter)
new SitemapRoute(apiRouter)
new ThemeRoute(apiRouter)
new CustomersRoute(apiRouter)
new CustomerGroupsRoute(apiRouter)
new OrdersRoute(apiRouter)
new OrderStatusesRoute(apiRouter)
new ShippingMethodsRoute(apiRouter)
new PaymentMethodsRoute(apiRouter)
new PaymentGatewaysRoute(apiRouter)
new SettingsRoute(apiRouter)
new PagesRoute(apiRouter)
new SecurityTokensRoute(apiRouter)
new NotificationsRoute(apiRouter)
new RedirectsRoute(apiRouter)
new FilesRoute(apiRouter)
new AppsRoute(apiRouter)
new WebhooksRoute(apiRouter)

export default apiRouter
