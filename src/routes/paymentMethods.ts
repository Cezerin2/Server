import { Router } from "express-serve-static-core"
import security from "../lib/security"
import PaymentMethodsService from "../services/orders/paymentMethods"

class PaymentMethodsRoute {
  router: any
  constructor(router: Router) {
    this.router = router
    this.registerRoutes()
  }

  registerRoutes() {
    this.router.get(
      "/v1/payment_methods",
      security.checkUserScope.bind(this, security.scope.READ_PAYMENT_METHODS),
      this.getMethods.bind(this)
    )
    this.router.post(
      "/v1/payment_methods",
      security.checkUserScope.bind(this, security.scope.WRITE_PAYMENT_METHODS),
      this.addMethod.bind(this)
    )
    this.router.get(
      "/v1/payment_methods/:id",
      security.checkUserScope.bind(this, security.scope.READ_PAYMENT_METHODS),
      this.getSingleMethod.bind(this)
    )
    this.router.put(
      "/v1/payment_methods/:id",
      security.checkUserScope.bind(this, security.scope.WRITE_PAYMENT_METHODS),
      this.updateMethod.bind(this)
    )
    this.router.delete(
      "/v1/payment_methods/:id",
      security.checkUserScope.bind(this, security.scope.WRITE_PAYMENT_METHODS),
      this.deleteMethod.bind(this)
    )
  }

  getMethods(
    req: { query: {} },
    res: { send: (arg0: any) => any },
    next: (reason: any) => PromiseLike<never>
  ) {
    PaymentMethodsService.getMethods(req.query)
      .then(data => res.send(data))
      .catch(next)
  }

  getSingleMethod(
    req: { params: { id: any } },
    res: {
      send: (arg0: any) => any
      status: (
        arg0: number
      ) => { (): any; new (): any; end: { (): any; new (): any } }
    },
    next: (reason: any) => PromiseLike<never>
  ) {
    PaymentMethodsService.getSingleMethod(req.params.id)
      .then(data => {
        if (data) {
          return res.send(data)
        }
        return res.status(404).end()
      })
      .catch(next)
  }

  addMethod(req: { body: any }, res: { send: (arg0: any) => any }, next: any) {
    PaymentMethodsService.addMethod(req.body)
      .then((data: any) => res.send(data))
      .catch(next)
  }

  updateMethod(
    req: { params: { id: any }; body: any },
    res: {
      send: (arg0: any) => any
      status: (
        arg0: number
      ) => { (): any; new (): any; end: { (): any; new (): any } }
    },
    next: any
  ) {
    PaymentMethodsService.updateMethod(req.params.id, req.body)
      .then((data: any) => {
        if (data) {
          return res.send(data)
        }
        return res.status(404).end()
      })
      .catch(next)
  }

  deleteMethod(
    req: { params: { id: any } },
    res: {
      status: (
        arg0: number
      ) => { (): any; new (): any; end: { (): any; new (): any } }
    },
    next: any
  ) {
    PaymentMethodsService.deleteMethod(req.params.id)
      .then((data: any) => res.status(data ? 200 : 404).end())
      .catch(next)
  }
}

export default PaymentMethodsRoute
