import path from 'path';
import url from 'url';
import formidable from 'formidable';
import AssetService from '../assets/assets';
import settings from '../../lib/settings';
import utils from '../../lib/utils';
import { db } from '../../lib/mongo';
import parse from '../../lib/parse';

const ThemeAssetsPath = `${settings.assetServer.themeImageUploadPath}`;

class SettingsService {
	constructor() {
		this.defaultSettings = {
			store_name: 'Cezerin',
			domain: '',
			logo_file: 'logo.png',
			language: 'en',
			currency_code: 'USD',
			currency_symbol: '$',
			currency_format: '${amount}',
			thousand_separator: ',',
			decimal_separator: '.',
			decimal_number: 2,
			tax_rate: 0,
			tax_included: true,
			timezone: 'Asia/Singapore',
			date_format: 'MMMM D, YYYY',
			time_format: 'h:mm a',
			default_shipping_country: '',
			default_shipping_state: '',
			default_shipping_city: '',
			default_product_sorting: 'stock_status,price,position',
			product_fields:
				'path,id,name,category_id,category_ids,category_name,sku,images,enabled,discontinued,stock_status,stock_quantity,price,on_sale,regular_price,attributes,tags,position',
			products_limit: 30,
			weight_unit: 'kg',
			length_unit: 'cm',
			hide_billing_address: false,
			order_confirmation_copy_to: ''
		};
	}

	getSettings() {
		return db
			.collection('settings')
			.findOne()
			.then(settings => this.changeProperties(settings));
	}

	updateSettings(data) {
		const settings = this.getValidDocumentForUpdate(data);
		return this.insertDefaultSettingsIfEmpty().then(() =>
			db
				.collection('settings')
				.updateOne(
					{},
					{
						$set: settings
					},
					{ upsert: true }
				)
				.then(res => this.getSettings())
		);
	}

	insertDefaultSettingsIfEmpty() {
		return db
			.collection('settings')
			.countDocuments({})
			.then(count => {
				if (count === 0) {
					return db.collection('settings').insertOne(this.defaultSettings);
				}
			});
	}

	getValidDocumentForUpdate(data) {
		if (Object.keys(data).length === 0) {
			return new Error('Required fields are missing');
		}

		const settings = {};

		if (data.store_name) {
			settings.store_name = parse.getString(data.store_name);
		}

		if (data.language) {
			settings.language = parse.getString(data.language);
		}

		if (data.currency_code) {
			settings.currency_code = parse.getString(data.currency_code);
		}

		if (data.domain) {
			settings.domain = parse.getString(data.domain);
		}

		if (data.currency_symbol) {
			settings.currency_symbol = parse.getString(data.currency_symbol);
		}

		if (data.currency_format) {
			settings.currency_format = parse.getString(data.currency_format);
		}

		if (data.thousand_separator) {
			settings.thousand_separator = parse.getString(data.thousand_separator);
		}

		if (data.decimal_separator) {
			settings.decimal_separator = parse.getString(data.decimal_separator);
		}

		if (data.decimal_number !== undefined) {
			settings.decimal_number =
				parse.getNumberIfPositive(data.decimal_number) || 0;
		}

		if (data.tax_rate !== undefined) {
			settings.tax_rate = parse.getNumberIfPositive(data.tax_rate) || 0;
		}

		if (data.tax_included !== undefined) {
			settings.tax_included = parse.getBooleanIfValid(data.tax_included, true);
		}

		if (data.timezone) {
			settings.timezone = parse.getString(data.timezone);
		}

		if (data.date_format) {
			settings.date_format = parse.getString(data.date_format);
		}

		if (data.time_format) {
			settings.time_format = parse.getString(data.time_format);
		}

		if (data.default_shipping_country) {
			settings.default_shipping_country = parse.getString(
				data.default_shipping_country
			);
		}

		if (data.default_shipping_state) {
			settings.default_shipping_state = parse.getString(
				data.default_shipping_state
			);
		}

		if (data.default_shipping_city) {
			settings.default_shipping_city = parse.getString(
				data.default_shipping_city
			);
		}

		if (data.default_product_sorting) {
			settings.default_product_sorting = parse.getString(
				data.default_product_sorting
			);
		}

		if (data.product_fields) {
			settings.product_fields = parse.getString(data.product_fields);
		}

		if (data.products_limit !== undefined) {
			settings.products_limit = parse.getNumberIfPositive(data.products_limit);
		}

		if (data.weight_unit) {
			settings.weight_unit = parse.getString(data.weight_unit);
		}

		if (data.length_unit) {
			settings.length_unit = parse.getString(data.length_unit);
		}

		if (data.logo_file) {
			settings.logo_file = parse.getString(data.logo_file);
		}

		if (data.hide_billing_address !== undefined) {
			settings.hide_billing_address = parse.getBooleanIfValid(
				data.hide_billing_address,
				false
			);
		}

		if (data.order_confirmation_copy_to) {
			settings.order_confirmation_copy_to = parse.getString(
				data.order_confirmation_copy_to
			);
		}

		return settings;
	}

	changeProperties(settingsFromDB) {
		const data = Object.assign(this.defaultSettings, settingsFromDB, {
			_id: undefined
		});
		if (data.domain === null || data.domain === undefined) {
			data.domain = '';
		}

		if (data.logo_file && data.logo_file.length > 0) {
			data.logo = url.resolve(
				settings.assetServer.domain,
				`${ThemeAssetsPath}/${data.logo_file}`
			);
		} else {
			data.logo = null;
		}
		return data;
	}

	deleteLogo() {
		return this.getSettings().then(data => {
			if (data.logo_file && data.logo_file.length > 0) {
				AssetService.deleteFile(ThemeAssetsPath, data.logo_file).then(() => {
					this.updateSettings({ logo_file: null });
				});
			}
		});
	}

	uploadLogo(req, res, next) {
		AssetService.uploadFile(req, res, ThemeAssetsPath, file_name => {
			this.updateSettings({ logo_file: file_name });
		});
	}

	getErrorMessage(err) {
		return { error: true, message: err.toString() };
	}
}

export default new SettingsService();
