import { ObjectID } from 'mongodb';
import url from 'url';
import settings from '../../lib/settings';
import { db } from '../../lib/mongo';
import parse from '../../lib/parse';
import SettingsService from '../settings/settings';
import AssetService from '../assets/assets';

class ProductImagesService {
	getErrorMessage(err) {
		return { error: true, message: err.toString() };
	}

	async getImages(productId) {
		if (!ObjectID.isValid(productId)) {
			return Promise.reject('Invalid identifier');
		}
		const productObjectID = new ObjectID(productId);

		const domain =
			settings.assetServer.domain ||
			(await SettingsService.getSettings()).domain;

		return db
			.collection('products')
			.findOne({ _id: productObjectID }, { fields: { images: 1 } })
			.then(product => {
				if (product && product.images && product.images.length > 0) {
					let images = product.images.map(image => {
						image.url = url.resolve(
							domain,
							`${settings.assetServer.productsUploadPath}/${product._id}/${image.filename}`
						);
						return image;
					});

					images = images.sort((a, b) => a.position - b.position);
					return images;
				}
				return [];
			});
	}

	deleteImage(productId, imageId) {
		if (!ObjectID.isValid(productId) || !ObjectID.isValid(imageId)) {
			return Promise.reject('Invalid identifier');
		}
		const productObjectID = new ObjectID(productId);
		const imageObjectID = new ObjectID(imageId);

		return this.getImages(productId)
			.then(images => {
				if (images && images.length > 0) {
					const imageData = images.find(
						i => i.id.toString() === imageId.toString()
					);
					if (imageData) {
						const { filename } = imageData;
						const filePath = `${settings.assetServer.productsUploadPath}/${productId}`;

						AssetService.deleteFile(filePath, filename)
							.then(() =>
								db
									.collection('products')
									.updateOne(
										{ _id: productObjectID },
										{ $pull: { images: { id: imageObjectID } } }
									)
							)
							.catch(() => false);
					} else {
						return true;
					}
				} else {
					return true;
				}
			})
			.then(() => true);
	}

	async addImage(req, res) {
		const { productId } = req.params;
		if (!ObjectID.isValid(productId)) {
			res.status(500).send(this.getErrorMessage('Invalid identifier'));
			return;
		}

		const productObjectID = new ObjectID(productId);
		const uploadDir = `${settings.assetServer.productsUploadPath}/${productId}`;

		AssetService.uploadFiles(
			req,
			res,
			uploadDir,
			async filename => {
				const imageData = {
					id: new ObjectID(),
					alt: '',
					position: 99,
					filename
				};

				await db.collection('products').updateOne(
					{
						_id: productObjectID
					},
					{
						$push: { images: imageData }
					}
				);
			},
			() => {}
		);
	}

	updateImage(productId, imageId, data) {
		if (!ObjectID.isValid(productId) || !ObjectID.isValid(imageId)) {
			return Promise.reject('Invalid identifier');
		}
		const productObjectID = new ObjectID(productId);
		const imageObjectID = new ObjectID(imageId);

		const imageData = this.getValidDocumentForUpdate(data);

		return db.collection('products').updateOne(
			{
				_id: productObjectID,
				'images.id': imageObjectID
			},
			{ $set: imageData }
		);
	}

	getValidDocumentForUpdate(data) {
		if (Object.keys(data).length === 0) {
			return new Error('Required fields are missing');
		}

		const image = {};

		if (data.alt !== undefined) {
			image['images.$.alt'] = parse.getString(data.alt);
		}

		if (data.position !== undefined) {
			image['images.$.position'] =
				parse.getNumberIfPositive(data.position) || 0;
		}

		return image;
	}
}

export default new ProductImagesService();
