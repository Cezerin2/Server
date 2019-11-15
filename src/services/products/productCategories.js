import { ObjectID } from 'mongodb';
import path from 'path';
import url from 'url';
import formidable from 'formidable';
import settings from '../../lib/settings';
import AssetService from '../assets/assets';
import SettingsService from '../settings/settings';
import { db } from '../../lib/mongo';
import utils from '../../lib/utils';
import parse from '../../lib/parse';

class ProductCategoriesService {
	getFilter(params = {}) {
		const filter = {};
		const enabled = parse.getBooleanIfValid(params.enabled);
		if (enabled !== null) {
			filter.enabled = enabled;
		}
		const id = parse.getObjectIDIfValid(params.id);
		if (id) {
			filter._id = id;
		}
		return filter;
	}

	async getCategories(params = {}) {
		const filter = this.getFilter(params);
		const projection = utils.getProjectionFromFields(params.fields);
		const generalSettings = await SettingsService.getSettings();
		const { domain } = generalSettings;
		const assetsDomain = settings.assetServer.domain;
		const items = await db
			.collection('productCategories')
			.find(filter, { projection })
			.sort({ position: 1 })
			.toArray();
		const result = items.map(category =>
			this.changeProperties(category, domain, assetsDomain)
		);
		return result;
	}

	getSingleCategory(id) {
		if (!ObjectID.isValid(id)) {
			return Promise.reject('Invalid identifier');
		}
		return this.getCategories({ id }).then(categories =>
			categories.length > 0 ? categories[0] : null
		);
	}

	async addCategory(data) {
		const lastCategory = await db
			.collection('productCategories')
			.findOne({}, { sort: { position: -1 } });
		const newPosition =
			lastCategory && lastCategory.position > 0 ? lastCategory.position + 1 : 1;
		const dataToInsert = await this.getValidDocumentForInsert(
			data,
			newPosition
		);
		const insertResult = await db
			.collection('productCategories')
			.insertMany([dataToInsert]);
		return this.getSingleCategory(insertResult.ops[0]._id.toString());
	}

	updateCategory(id, data) {
		if (!ObjectID.isValid(id)) {
			return Promise.reject('Invalid identifier');
		}
		const categoryObjectID = new ObjectID(id);

		return this.getValidDocumentForUpdate(id, data)
			.then(dataToSet =>
				db
					.collection('productCategories')
					.updateOne({ _id: categoryObjectID }, { $set: dataToSet })
			)
			.then(res => (res.modifiedCount > 0 ? this.getSingleCategory(id) : null));
	}

	findAllChildren(items, id, result) {
		if (id && ObjectID.isValid(id)) {
			result.push(new ObjectID(id));
			const finded = items.filter(
				item => (item.parent_id || '').toString() === id.toString()
			);
			if (finded.length > 0) {
				for (const item of finded) {
					this.findAllChildren(items, item.id, result);
				}
			}
		}

		return result;
	}

	deleteCategory(id) {
		if (!ObjectID.isValid(id)) {
			return Promise.reject('Invalid identifier');
		}

		// 1. get all categories
		return this.getCategories()
			.then(items => {
				// 2. find category and children
				const idsToDelete = [];
				this.findAllChildren(items, id, idsToDelete);
				return idsToDelete;
			})
			.then(idsToDelete => {
				// 3. delete categories
				const objectsToDelete = idsToDelete.map(id => new ObjectID(id));
				// return db.collection('productCategories').deleteMany({_id: { $in: objectsToDelete}}).then(() => idsToDelete);
				return db
					.collection('productCategories')
					.deleteMany({ _id: { $in: objectsToDelete } })
					.then(deleteResponse =>
						deleteResponse.deletedCount > 0 ? idsToDelete : null
					);
			})
			.then(idsToDelete =>
				// 4. update category_id for products
				idsToDelete
					? db
							.collection('products')
							.updateMany(
								{ category_id: { $in: idsToDelete } },
								{ $set: { category_id: null } }
							)
							.then(() => idsToDelete)
					: null
			)
			.then(idsToDelete =>
				// 5. update additional category_ids for products
				idsToDelete
					? db
							.collection('products')
							.updateMany(
								{ category_ids: { $all: idsToDelete } },
								{ $pull: { category_ids: { $all: idsToDelete } } }
							)
							.then(() => idsToDelete)
					: null
			)
			.then(idsToDelete => {
				// 6. delete directories with images
				if (idsToDelete) {
					for (const categoryId of idsToDelete) {
						const deleteDir = `${settings.assetServer.categoriesUploadPath}/${categoryId}`;
						AssetService.deleteDir(deleteDir);
					}
					return Promise.resolve(true);
				}
				return Promise.resolve(false);
			});
	}

	getErrorMessage(err) {
		return { error: true, message: err.toString() };
	}

	getValidDocumentForInsert(data, newPosition) {
		//  Allow empty category to create draft

		const category = {
			date_created: new Date(),
			date_updated: null,
			image: ''
		};

		category.name = parse.getString(data.name);
		category.description = parse.getString(data.description);
		category.meta_description = parse.getString(data.meta_description);
		category.meta_title = parse.getString(data.meta_title);
		category.enabled = parse.getBooleanIfValid(data.enabled, true);
		category.sort = parse.getString(data.sort);
		category.parent_id = parse.getObjectIDIfValid(data.parent_id);
		category.position = parse.getNumberIfValid(data.position) || newPosition;

		const slug = !data.slug || data.slug.length === 0 ? data.name : data.slug;
		if (!slug || slug.length === 0) {
			return Promise.resolve(category);
		}
		return utils.getAvailableSlug(slug).then(newSlug => {
			category.slug = newSlug;
			return category;
		});
	}

	getValidDocumentForUpdate(id, data) {
		return new Promise((resolve, reject) => {
			if (!ObjectID.isValid(id)) {
				reject('Invalid identifier');
			}
			if (Object.keys(data).length === 0) {
				reject('Required fields are missing');
			}

			const category = {
				date_updated: new Date()
			};

			if (data.name !== undefined) {
				category.name = parse.getString(data.name);
			}

			if (data.description !== undefined) {
				category.description = parse.getString(data.description);
			}

			if (data.meta_description !== undefined) {
				category.meta_description = parse.getString(data.meta_description);
			}

			if (data.meta_title !== undefined) {
				category.meta_title = parse.getString(data.meta_title);
			}

			if (data.enabled !== undefined) {
				category.enabled = parse.getBooleanIfValid(data.enabled, true);
			}

			if (data.image !== undefined) {
				category.image = data.image;
			}

			if (data.position >= 0) {
				category.position = data.position;
			}

			if (data.sort !== undefined) {
				category.sort = data.sort;
			}

			if (data.parent_id !== undefined) {
				category.parent_id = parse.getObjectIDIfValid(data.parent_id);
			}

			if (data.slug !== undefined) {
				let { slug } = data;
				if (!slug || slug.length === 0) {
					slug = data.name;
				}

				utils
					.getAvailableSlug(slug, id)
					.then(newSlug => {
						category.slug = newSlug;
						resolve(category);
					})
					.catch(err => {
						reject(err);
					});
			} else {
				resolve(category);
			}
		});
	}

	changeProperties(item, domain, assetsDomain) {
		if (item) {
			item.id = item._id.toString();
			item._id = undefined;

			if (item.parent_id) {
				item.parent_id = item.parent_id.toString();
			}

			if (item.slug) {
				item.url = url.resolve(domain, `/${item.slug}`);
				item.path = url.resolve('/', item.slug);
			}

			if (item.image) {
				item.image = url.resolve(
					assetsDomain,
					`${settings.assetServer.categoriesUploadPath}/${item.id}/${item.image}`
				);
			}
		}

		return item;
	}

	deleteCategoryImage(id) {
		const dir = `${settings.assetServer.categoriesUploadPath}/${id}`;

		AssetService.emptyDir(dir);
		this.updateCategory(id, { image: '' });
	}

	uploadCategoryImage(req, res) {
		const categoryId = req.params.id;
		const dir = `${settings.assetServer.categoriesUploadPath}/${categoryId}`;

		AssetService.uploadFile(req, res, dir, file_name => {
			this.updateCategory(categoryId, { image: file_name });
		});
	}
}

export default new ProductCategoriesService();
