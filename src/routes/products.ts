import security from '../lib/security';
import ProductsService from '../services/products/products';
import ProductOptionsService from '../services/products/options';
import ProductOptionValuesService from '../services/products/optionValues';
import ProductVariantsService from '../services/products/variants';
import ProductImagesService from '../services/products/images';
import { Router, Request, Response, NextFunction } from 'express';

class ProductsRoute {
	public router: Router;
	constructor(router: Router) {
		this.router = router;
		this.registerRoutes();
	}

	public registerRoutes() {
		this.router.get(
			'/v1/products',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.getProducts.bind(this)
		);
		this.router.post(
			'/v1/products',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.addProduct.bind(this)
		);
		this.router.get(
			'/v1/products/:productId',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.getSingleProduct.bind(this)
		);
		this.router.put(
			'/v1/products/:productId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.updateProduct.bind(this)
		);
		this.router.delete(
			'/v1/products/:productId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.deleteProduct.bind(this)
		);

		this.router.get(
			'/v1/products/:productId/images',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.getImages.bind(this)
		);
		this.router.post(
			'/v1/products/:productId/images',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.addImage.bind(this)
		);
		this.router.put(
			'/v1/products/:productId/images/:imageId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.updateImage.bind(this)
		);
		this.router.delete(
			'/v1/products/:productId/images/:imageId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.deleteImage.bind(this)
		);

		this.router.get(
			'/v1/products/:productId/sku',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.isSkuExists.bind(this)
		);
		this.router.get(
			'/v1/products/:productId/slug',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.isSlugExists.bind(this)
		);

		this.router.get(
			'/v1/products/:productId/options',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.getOptions.bind(this)
		);
		this.router.get(
			'/v1/products/:productId/options/:optionId',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.getSingleOption.bind(this)
		);
		this.router.post(
			'/v1/products/:productId/options',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.addOption.bind(this)
		);
		this.router.put(
			'/v1/products/:productId/options/:optionId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.updateOption.bind(this)
		);
		this.router.delete(
			'/v1/products/:productId/options/:optionId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.deleteOption.bind(this)
		);

		this.router.get(
			'/v1/products/:productId/options/:optionId/values',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.getOptionValues.bind(this)
		);
		this.router.get(
			'/v1/products/:productId/options/:optionId/values/:valueId',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.getSingleOptionValue.bind(this)
		);
		this.router.post(
			'/v1/products/:productId/options/:optionId/values',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.addOptionValue.bind(this)
		);
		this.router.put(
			'/v1/products/:productId/options/:optionId/values/:valueId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.updateOptionValue.bind(this)
		);
		this.router.delete(
			'/v1/products/:productId/options/:optionId/values/:valueId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.deleteOptionValue.bind(this)
		);

		this.router.get(
			'/v1/products/:productId/variants',
			security.checkUserScope.bind(this, security.scope.READ_PRODUCTS),
			this.getVariants.bind(this)
		);
		this.router.post(
			'/v1/products/:productId/variants',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.addVariant.bind(this)
		);
		this.router.put(
			'/v1/products/:productId/variants/:variantId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.updateVariant.bind(this)
		);
		this.router.delete(
			'/v1/products/:productId/variants/:variantId',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.deleteVariant.bind(this)
		);
		this.router.put(
			'/v1/products/:productId/variants/:variantId/options',
			security.checkUserScope.bind(this, security.scope.WRITE_PRODUCTS),
			this.setVariantOption.bind(this)
		);
	}

	public getProducts(req: Request, res: Response, next: NextFunction) {
		ProductsService.getProducts(req.query)
			.then(data => res.send(data))
			.catch(next);
	}

	public getSingleProduct(req: Request, res: Response, next: NextFunction) {
		ProductsService.getSingleProduct(req.params.productId)
			.then(data => {
				if (data) {
					return res.send(data);
				}
				return res.status(404).end();
			})
			.catch(next);
	}

	public addProduct(req: Request, res: Response, next: NextFunction) {
		ProductsService.addProduct(req.body)
			.then(data => res.send(data))
			.catch(next);
	}

	public updateProduct(req: Request, res: Response, next: NextFunction) {
		ProductsService.updateProduct(req.params.productId, req.body)
			.then(data => {
				if (data) {
					return res.send(data);
				}
				return res.status(404).end();
			})
			.catch(next);
	}

	public deleteProduct(req: Request, res: Response, next: NextFunction) {
		ProductsService.deleteProduct(req.params.productId)
			.then(data => res.status(data ? 200 : 404).end())
			.catch(next);
	}

	public getImages(req: Request, res: Response, next: NextFunction) {
		ProductImagesService.getImages(req.params.productId)
			.then(data => res.send(data))
			.catch(next);
	}

	public async addImage(req: Request, res: Response, next: NextFunction) {
		console.log(req, res);
		await ProductImagesService.addImage(req, res);
	}

	public updateImage(req: Request, res: Response, next: NextFunction) {
		ProductImagesService.updateImage(
			req.params.productId,
			req.params.imageId,
			req.body
		).then(data => res.end());
	}

	public deleteImage(req: Request, res: Response, next: NextFunction) {
		ProductImagesService.deleteImage(
			req.params.productId,
			req.params.imageId
		).then(data => res.end());
	}

	public isSkuExists(req: Request, res: Response, next: NextFunction) {
		ProductsService.isSkuExists(req.query.sku, req.params.productId)
			.then(exists => res.status(exists ? 200 : 404).end())
			.catch(next);
	}

	public isSlugExists(req: Request, res: Response, next: NextFunction) {
		ProductsService.isSlugExists(req.query.slug, req.params.productId)
			.then(exists => res.status(exists ? 200 : 404).end())
			.catch(next);
	}

	public getOptions(req: Request, res: Response, next: NextFunction) {
		ProductOptionsService.getOptions(req.params.productId)
			.then(data => res.send(data))
			.catch(next);
	}

	public getSingleOption(req: Request, res: Response, next: NextFunction) {
		ProductOptionsService.getSingleOption(
			req.params.productId,
			req.params.optionId
		)
			.then(data => {
				if (data) {
					return res.send(data);
				}
				return res.status(404).end();
			})
			.catch(next);
	}

	public addOption(req: Request, res: Response, next: NextFunction) {
		ProductOptionsService.addOption(req.params.productId, req.body)
			.then(data => res.send(data))
			.catch(next);
	}

	public updateOption(req: Request, res: Response, next: NextFunction) {
		ProductOptionsService.updateOption(
			req.params.productId,
			req.params.optionId,
			req.body
		)
			.then(data => res.send(data))
			.catch(next);
	}

	public deleteOption(req: Request, res: Response, next: NextFunction) {
		ProductOptionsService.deleteOption(
			req.params.productId,
			req.params.optionId
		)
			.then(data => res.send(data))
			.catch(next);
	}

	public getOptionValues(req: Request, res: Response, next: NextFunction) {
		ProductOptionValuesService.getOptionValues(
			req.params.productId,
			req.params.optionId
		)
			.then(data => res.send(data))
			.catch(next);
	}

	public getSingleOptionValue(req: Request, res: Response, next: NextFunction) {
		ProductOptionValuesService.getSingleOptionValue(
			req.params.productId,
			req.params.optionId,
			req.params.valueId
		)
			.then(data => {
				if (data) {
					return res.send(data);
				}
				return res.status(404).end();
			})
			.catch(next);
	}

	public addOptionValue(req: Request, res: Response, next: NextFunction) {
		ProductOptionValuesService.addOptionValue(
			req.params.productId,
			req.params.optionId,
			req.body
		)
			.then(data => res.send(data))
			.catch(next);
	}

	public updateOptionValue(req: Request, res: Response, next: NextFunction) {
		ProductOptionValuesService.updateOptionValue(
			req.params.productId,
			req.params.optionId,
			req.params.valueId,
			req.body
		)
			.then(data => res.send(data))
			.catch(next);
	}

	public deleteOptionValue(req: Request, res: Response, next: NextFunction) {
		ProductOptionValuesService.deleteOptionValue(
			req.params.productId,
			req.params.optionId,
			req.params.valueId
		)
			.then(data => res.send(data))
			.catch(next);
	}

	public getVariants(req: Request, res: Response, next: NextFunction) {
		ProductVariantsService.getVariants(req.params.productId)
			.then(data => res.send(data))
			.catch(next);
	}

	public addVariant(req: Request, res: Response, next: NextFunction) {
		ProductVariantsService.addVariant(req.params.productId, req.body)
			.then(data => res.send(data))
			.catch(next);
	}

	public updateVariant(req: Request, res: Response, next: NextFunction) {
		ProductVariantsService.updateVariant(
			req.params.productId,
			req.params.variantId,
			req.body
		)
			.then(data => res.send(data))
			.catch(next);
	}

	public deleteVariant(req: Request, res: Response, next: NextFunction) {
		ProductVariantsService.deleteVariant(
			req.params.productId,
			req.params.variantId
		)
			.then(data => res.send(data))
			.catch(next);
	}

	public setVariantOption(req: Request, res: Response, next: NextFunction) {
		ProductVariantsService.setVariantOption(
			req.params.productId,
			req.params.variantId,
			req.body
		)
			.then(data => res.send(data))
			.catch(next);
	}
}

export default ProductsRoute;
