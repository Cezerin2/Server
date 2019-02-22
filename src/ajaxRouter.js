import express from 'express';
import jwt from 'jsonwebtoken';
import { ObjectID } from 'mongodb';
import CezerinClient from 'cezerin2-client';
import handlebars from 'handlebars';
import serverSettings from './lib/settings';
import serverConfigs from '../config/server';
import { db } from './lib/mongo';
import AuthHeader from './lib/auth-header';
import mailer from './lib/mailer';
import EmailTemplatesService from './services/settings/emailTemplates';
import SettingsService from './services/settings/settings';

const ajaxRouter = express.Router();

const TOKEN_PAYLOAD = { email: 'store', scopes: ['admin'] };
const STORE_ACCESS_TOKEN = jwt.sign(TOKEN_PAYLOAD, serverSettings.jwtSecretKey);

const api = new CezerinClient({
	apiBaseUrl: serverSettings.apiBaseUrl,
	apiToken: STORE_ACCESS_TOKEN
});

const DEFAULT_CACHE_CONTROL = 'public, max-age=60';
const PRODUCTS_CACHE_CONTROL = 'public, max-age=60';
const PRODUCT_DETAILS_CACHE_CONTROL = 'public, max-age=60';

const getCartCookieOptions = isHttps => ({
	maxAge: 24 * 60 * 60 * 1000, // 24 hours
	httpOnly: true,
	signed: true,
	secure: isHttps,
	sameSite: 'strict'
});

const getIP = req => {
	let ip = req.get('x-forwarded-for') || req.ip;

	if (ip && ip.includes(', ')) {
		ip = ip.split(', ')[0];
	}

	if (ip && ip.includes('::ffff:')) {
		ip = ip.replace('::ffff:', '');
	}

	return ip;
};

const getUserAgent = req => {
	return req.get('user-agent');
};

const getVariantFromProduct = (product, variantId) => {
	if (product.variants && product.variants.length > 0) {
		return product.variants.find(
			variant => variant.id.toString() === variantId.toString()
		);
	} else {
		return null;
	}
};

const fillCartItemWithProductData = (products, cartItem) => {
	const product = products.find(p => p.id === cartItem.product_id);
	if (product) {
		cartItem.image_url =
			product.images && product.images.length > 0
				? product.images[0].url
				: null;
		cartItem.path = product.path;
		cartItem.stock_backorder = product.stock_backorder;
		cartItem.stock_preorder = product.stock_preorder;
		if (cartItem.variant_id && cartItem.variant_id.length > 0) {
			const variant = getVariantFromProduct(product, cartItem.variant_id);
			cartItem.stock_quantity = variant ? variant.stock_quantity : 0;
		} else {
			cartItem.stock_quantity = product.stock_quantity;
		}
	}
	return cartItem;
};

const fillCartItems = cartResponse => {
	let cart = cartResponse.json;
	if (cart && cart.items && cart.items.length > 0) {
		const productIds = cart.items.map(item => item.product_id);
		return api.products
			.list({
				ids: productIds,
				fields:
					'images,enabled,stock_quantity,variants,path,stock_backorder,stock_preorder'
			})
			.then(({ status, json }) => {
				const newCartItem = cart.items.map(cartItem =>
					fillCartItemWithProductData(json.data, cartItem)
				);
				cartResponse.json.items = newCartItem;
				return cartResponse;
			});
	} else {
		return Promise.resolve(cartResponse);
	}
};

ajaxRouter.get('/products', (req, res, next) => {
	let filter = req.query;
	filter.enabled = true;
	api.products.list(filter).then(({ status, json }) => {
		res
			.status(status)
			.header('Cache-Control', PRODUCTS_CACHE_CONTROL)
			.send(json);
	});
});

ajaxRouter.get('/products/:id', (req, res, next) => {
	api.products.retrieve(req.params.id).then(({ status, json }) => {
		res
			.status(status)
			.header('Cache-Control', PRODUCT_DETAILS_CACHE_CONTROL)
			.send(json);
	});
});

ajaxRouter.get('/cart', (req, res, next) => {
	const order_id = req.signedCookies.order_id;
	if (order_id) {
		api.orders
			.retrieve(order_id)
			.then(cartResponse => fillCartItems(cartResponse))
			.then(({ status, json }) => {
				json.browser = undefined;
				res.status(status).send(json);
			});
	} else {
		res.end();
	}
});

ajaxRouter.post('/reset-password', async (req, res, next) => {
	const data = {
		status: false,
		id: null,
		verified: false
	};

	const userId =
		'token' in req.body
			? AuthHeader.decodeUserLoginAuth(req.body.token)
			: AuthHeader.decodeUserLoginAuth(req.body.id).userId.userId;

	const filter = {
		id: userId
	};

	const customerDraft = {
		password: req.body.password
	};

	// update customer password after checking customer id
	if ('id' in req.body) {
		await api.customers
			.update(userId, customerDraft)
			.then(({ status, json }) => {
				data.status = true;
				data.id = userId;
				data.verified = true;
				res.status(status).send(data);
			});
		return false;
	}

	if ('name' in userId && userId.name.indexOf('JsonWebTokenErro') !== -1) {
		res.send(data);
		return false;
	}

	// if customer email exists send status back
	await api.customers.list(filter).then(({ status, json }) => {
		if (json.total_count > 0) {
			data.status = true;
			data.id = AuthHeader.encodeUserLoginAuth(userId);
			res.status(status).send(data);
		}
		res.status(status).send(data);
	});
});

ajaxRouter.post('/forgot-password', async (req, res, next) => {
	const filter = {
		email: req.body.email
	};
	const data = {
		status: true
	};

	// send forgot password email
	async function sendEmail(userId) {
		const countryCode = undefined;
		const [emailTemp] = await Promise.all([
			EmailTemplatesService.getEmailTemplate(
				`forgot_password_${serverConfigs.language}`
			)
		]);
		await handlebars.registerHelper('forgot_password_link', function(obj) {
			var url = `${serverConfigs.storeBaseUrl}${
				countryCode !== undefined ? `/${countryCode}/` : '/'
			}reset-password?token=${AuthHeader.encodeUserLoginAuth(userId)}`;
			var text = emailTemp.link;
			if (text == undefined) {
				text = url;
			}
			return new handlebars.SafeString(
				`<a style="position: relative;text-transform: uppercase;border: 1px solid #ccc;color: #000;padding: 5px;text-decoration: none;" value="${text}" href="${url}"> ${text} </a>`
			);
		});
		const [bodyTemplate, settings] = await Promise.all([
			handlebars.compile(emailTemp.body),
			SettingsService.getSettings()
		]);
		await Promise.all([
			mailer.send({
				to: req.body.email,
				subject: `${emailTemp.subject} ${settings.store_name}`,
				html: bodyTemplate({
					shop_name: settings.store_name
				})
			}),
			res.send(data)
		]);
	}

	// check if customer exists
	await api.customers.list(filter).then(({ status, json }) => {
		if (json.total_count < 1) {
			data.status = false;
			res.status(status).send(data);
			return false;
		}
		sendEmail(json.data[0].id);
	});
});

ajaxRouter.post('/customer-account', async (req, res, next) => {
	const customerData = {
		token: '',
		authenticated: false,
		customer_settings: null,
		order_statuses: null
	};

	customerData.token = AuthHeader.decodeUserLoginAuth(req.body.token);
	const userId = JSON.stringify(customerData.token.userId).replace(/["']/g, '');
	const filter = {
		customer_id: userId
	};

	// retrieve customer data
	await api.customers.retrieve(userId).then(({ status, json }) => {
		customerData.customer_settings = json;
		customerData.customer_settings.password = '*******';
		customerData.token = AuthHeader.encodeUserLoginAuth(userId);
		customerData.authenticated = false;
	});

	// retrieve orders data
	await api.orders.list(filter).then(({ status, json }) => {
		customerData.order_statuses = json;
		let objJsonB64 = JSON.stringify(customerData);
		objJsonB64 = Buffer.from(objJsonB64).toString('base64');
		res.status(status).send(JSON.stringify(objJsonB64));
	});
});

ajaxRouter.post('/login', async (req, res, next) => {
	const customerData = {
		token: '',
		authenticated: false,
		loggedin_failed: false,
		customer_settings: null,
		order_statuses: null,
		cartLayer: req.body.cartLayer !== undefined ? req.body.cartLayer : false
	};

	// check if customer exists in database and grant or denie access
	await db
		.collection('customers')
		.find({
			email: req.body.email,
			password: AuthHeader.decodeUserPassword(req.body.password).password
		})
		.limit(1)
		.next(function getCustomerData(error, result) {
			if (error) {
				//alert
				throw error;
			}
			if (!result) {
				api.customers.list().then(({ status, json }) => {
					customerData.loggedin_failed = true;
					let objJsonB64 = JSON.stringify(customerData);
					objJsonB64 = Buffer.from(objJsonB64).toString('base64');
					res.status(status).send(JSON.stringify(objJsonB64));
				});
				return;
			}

			customerData.token = AuthHeader.encodeUserLoginAuth(result._id);
			customerData.authenticated = true;

			// retrieve all customer and orders data for the myaccount settings
			api.customers.retrieve(result._id).then(({ status, json }) => {
				customerData.customer_settings = json;
				customerData.customer_settings.password = '*******';

				const filter = {
					customer_id: json.id
				};
				api.orders.list(filter).then(({ status, json }) => {
					customerData.order_statuses = json;

					let objJsonB64 = JSON.stringify(customerData);
					objJsonB64 = Buffer.from(objJsonB64).toString('base64');
					res.status(status).send(JSON.stringify(objJsonB64));
				});
			});
		});
});

ajaxRouter.post('/register', async (req, res, next) => {
	// set data for response
	const data = {
		status: false,
		isRightToken: true,
		isCustomerSaved: false
	};
	const filter = {
		email: req.body.email
	};

	// check if url params contains token
	const requestToken = 'token' in req.body ? req.body.token : false;

	if (requestToken && !data.status) {
		const requestTokenArray = requestToken.split('xXx');

		// if requestToken array has no splitable part response token is wrong
		if (requestTokenArray.length < 2) {
			data.isRightToken = false;
			res.status('200').send(data);
			return false;
		}

		(async () => {
			// decode token parts and check if valid email is the second part of them
			const firstName = await AuthHeader.decodeUserLoginAuth(
				requestTokenArray[0]
			).userId;
			const lastName = await AuthHeader.decodeUserLoginAuth(
				requestTokenArray[1]
			).userId;
			const eMail = await AuthHeader.decodeUserLoginAuth(requestTokenArray[2])
				.userId;
			const passWord = await AuthHeader.decodeUserPassword(requestTokenArray[3])
				.password;

			if (
				requestTokenArray.length < 1 ||
				!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
					eMail
				)
			) {
				//if (requestTokenArray.length < 1) {
				data.isRightToken = false;
				res.status('200').send(data);
				return false;
			}

			// check once if customer email is existig in database
			filter.email = eMail;
			await api.customers.list(filter).then(({ status, json }) => {
				if (json.total_count > 0) {
					data.isCustomerSaved = true;
					res.status(status).send(data);
					return false;
				}
			});

			// create new customer in database
			const customerDraft = {
				full_name: `${firstName} ${lastName}`,
				first_name: firstName,
				last_name: lastName,
				email: eMail,
				password: passWord
			};

			await api.customers.create(customerDraft).then(({ status, json }) => {
				data.isCustomerSaved = true;
				res.status(status).send(data);
			});

			return true;
		})();
	}

	// send customer a doi email
	async function registerCustomer() {
		if (data.status) {
			const countryCode = undefined;
			const [emailTemp] = await Promise.all([
				EmailTemplatesService.getEmailTemplate(
					`register_doi_${serverConfigs.language}`
				)
			]);
			await handlebars.registerHelper('register_doi_link', function(obj) {
				var url = `${serverConfigs.storeBaseUrl}${
					countryCode !== undefined ? `/${countryCode}/` : '/'
				}register?token=${tokenConcatString}`;
				var text = emailTemp.link;
				if (text == undefined) {
					text = url;
				}
				return new handlebars.SafeString(
					`<a style="position: relative;text-transform: uppercase;border: 1px solid #ccc;color: #000;padding: 5px;text-decoration: none;" value="${text}" href="${url}"> ${text} </a>`
				);
			});
			const [bodyTemplate, settings] = await Promise.all([
				handlebars.compile(emailTemp.body),
				SettingsService.getSettings()
			]);
			const tokenConcatString = `${AuthHeader.encodeUserLoginAuth(
				req.body.first_name
			)}xXx${AuthHeader.encodeUserLoginAuth(
				req.body.last_name
			)}xXx${AuthHeader.encodeUserLoginAuth(req.body.email)}xXx${
				req.body.password
			}`;
			await Promise.all([
				mailer.send({
					to: req.body.email,
					subject: `${emailTemp.subject} ${settings.store_name}`,
					html: bodyTemplate({
						shop_name: settings.store_name
					})
				}),
				res.status('200').send(data)
			]);
		}
		return false;
	}
	// check if customer exist in database
	if (!requestToken) {
		await api.customers.list(filter).then(({ status, json }) => {
			if (json.total_count > 0) {
				res.status(status).send(data);
				return false;
			}
			data.status = true;
			registerCustomer();
		});
	}
});

ajaxRouter.put('/customer-account', async (req, res, next) => {
	const customerData = req.body;
	const token = AuthHeader.decodeUserLoginAuth(req.body.token);
	const userId = JSON.stringify(token.userId).replace(/["']/g, '');

	const customerDataObj = {
		token: '',
		authenticated: false,
		customer_settings: null,
		order_statuses: null
	};
	// create customer draft object for update
	const customerDraft = {
		first_name: customerData.first_name,
		last_name: customerData.last_name,
		email: customerData.email,
		password: AuthHeader.decodeUserPassword(customerData.password).password
	};

	// update customer profile and addresses
	await api.customers.update(userId, customerDraft).then(({ status, json }) => {
		if (json.total_count < 1) {
			res.status(status).send(json);
			return false;
		}
		customerDataObj.customer_settings = json;
		customerDataObj.customer_settings.password = '*******';
		customerDataObj.token = AuthHeader.encodeUserLoginAuth(userId);
		customerData.authenticated = false;
		db.collection('orders').updateMany(
			{ customer_id: ObjectID(json.id) },
			{
				$set: {
					shipping_address: customerData.shipping_address,
					billing_address: customerData.billing_address
				}
			},
			function(error, result) {
				if (error) {
					//alert
					throw error;
				}
				customerDataObj.order_statuses = status;
				let objJsonB64 = JSON.stringify(customerDataObj);
				objJsonB64 = Buffer.from(objJsonB64).toString('base64');
				res.status(status).send(JSON.stringify(objJsonB64));
			}
		);
	});
});

ajaxRouter.post('/cart/items', (req, res, next) => {
	const isHttps = req.protocol === 'https';
	const CART_COOKIE_OPTIONS = getCartCookieOptions(isHttps);

	const order_id = req.signedCookies.order_id;
	const item = req.body;
	if (order_id) {
		api.orders.items
			.create(order_id, item)
			.then(cartResponse => fillCartItems(cartResponse))
			.then(({ status, json }) => {
				res.status(status).send(json);
			});
	} else {
		let orderDraft = {
			draft: true,
			referrer_url: req.signedCookies.referrer_url,
			landing_url: req.signedCookies.landing_url,
			browser: {
				ip: getIP(req),
				user_agent: getUserAgent(req)
			},
			shipping_address: {}
		};

		api.settings
			.retrieve()
			.then(settingsResponse => {
				const storeSettings = settingsResponse.json;
				orderDraft.shipping_address.address1 =
					storeSettings.default_shipping_address1;
				orderDraft.shipping_address.address2 =
					storeSettings.default_shipping_address2;
				orderDraft.shipping_address.country =
					storeSettings.default_shipping_country;
				orderDraft.shipping_address.state =
					storeSettings.default_shipping_state;
				orderDraft.shipping_address.city = storeSettings.default_shipping_city;
				return orderDraft;
			})
			.then(orderDraft => {
				api.orders.create(orderDraft).then(orderResponse => {
					const orderId = orderResponse.json.id;
					res.cookie('order_id', orderId, CART_COOKIE_OPTIONS);
					api.orders.items
						.create(orderId, item)
						.then(cartResponse => fillCartItems(cartResponse))
						.then(({ status, json }) => {
							res.status(status).send(json);
						});
				});
			});
	}
});

ajaxRouter.delete('/cart/items/:item_id', (req, res, next) => {
	const order_id = req.signedCookies.order_id;
	const item_id = req.params.item_id;
	if (order_id && item_id) {
		api.orders.items
			.delete(order_id, item_id)
			.then(cartResponse => fillCartItems(cartResponse))
			.then(({ status, json }) => {
				res.status(status).send(json);
			});
	} else {
		res.end();
	}
});

ajaxRouter.put('/cart/items/:item_id', (req, res, next) => {
	const order_id = req.signedCookies.order_id;
	const item_id = req.params.item_id;
	const item = req.body;
	if (order_id && item_id) {
		api.orders.items
			.update(order_id, item_id, item)
			.then(cartResponse => fillCartItems(cartResponse))
			.then(({ status, json }) => {
				res.status(status).send(json);
			});
	} else {
		res.end();
	}
});

ajaxRouter.put('/cart/checkout', (req, res, next) => {
	const order_id = req.signedCookies.order_id;
	if (order_id) {
		api.orders
			.checkout(order_id)
			.then(cartResponse => fillCartItems(cartResponse))
			.then(({ status, json }) => {
				res.clearCookie('order_id');
				res.status(status).send(json);
			});
	} else {
		res.end();
	}
});

ajaxRouter.put('/cart', async (req, res, next) => {
	const cartData = req.body;
	const {
		shipping_address: shippingAddress,
		billing_address: billingAddress
	} = cartData;
	const orderId = req.signedCookies.order_id;
	if (orderId) {
		if (shippingAddress) {
			await api.orders.updateShippingAddress(orderId, shippingAddress);
		}
		if (billingAddress) {
			await api.orders.updateBillingAddress(orderId, billingAddress);
		}

		await api.orders
			.update(orderId, cartData)
			.then(cartResponse => fillCartItems(cartResponse))
			.then(({ status, json }) => {
				res.status(status).send(json);
			});
	} else {
		res.end();
	}
});

ajaxRouter.put('/cart/shipping_address', (req, res, next) => {
	const order_id = req.signedCookies.order_id;
	if (order_id) {
		api.orders
			.updateShippingAddress(order_id, req.body)
			.then(cartResponse => fillCartItems(cartResponse))
			.then(({ status, json }) => {
				res.status(status).send(json);
			});
	} else {
		res.end();
	}
});

ajaxRouter.put('/cart/billing_address', (req, res, next) => {
	const order_id = req.signedCookies.order_id;
	if (order_id) {
		api.orders
			.updateBillingAddress(order_id, req.body)
			.then(cartResponse => fillCartItems(cartResponse))
			.then(({ status, json }) => {
				res.status(status).send(json);
			});
	} else {
		res.end();
	}
});

ajaxRouter.post('/cart/charge', async (req, res, next) => {
	const order_id = req.signedCookies.order_id;
	if (order_id) {
		const client = api.orders.client;
		const chargeResponse = await client.post(`/orders/${order_id}/charge`);
		res.status(chargeResponse.status).send(chargeResponse.json);
	} else {
		res.end();
	}
});

ajaxRouter.get('/pages', (req, res, next) => {
	api.pages.list(req.query).then(({ status, json }) => {
		res
			.status(status)
			.header('Cache-Control', DEFAULT_CACHE_CONTROL)
			.send(json);
	});
});

ajaxRouter.get('/pages/:id', (req, res, next) => {
	api.pages.retrieve(req.params.id).then(({ status, json }) => {
		res
			.status(status)
			.header('Cache-Control', DEFAULT_CACHE_CONTROL)
			.send(json);
	});
});

ajaxRouter.get('/sitemap', async (req, res, next) => {
	let result = null;
	let filter = req.query;
	filter.enabled = true;

	const sitemapResponse = await api.sitemap.retrieve(req.query);
	if (sitemapResponse.status !== 404 || sitemapResponse.json) {
		result = sitemapResponse.json;

		if (result.type === 'product') {
			const productResponse = await api.products.retrieve(result.resource);
			result.data = productResponse.json;
		} else if (result.type === 'page') {
			const pageResponse = await api.pages.retrieve(result.resource);
			result.data = pageResponse.json;
		}
	}

	res
		.status(sitemapResponse.status)
		.header('Cache-Control', DEFAULT_CACHE_CONTROL)
		.send(result);
});

ajaxRouter.get('/payment_methods', (req, res, next) => {
	const filter = {
		enabled: true,
		order_id: req.signedCookies.order_id
	};
	api.paymentMethods.list(filter).then(({ status, json }) => {
		const methods = json.map(item => {
			delete item.conditions;
			return item;
		});

		res.status(status).send(methods);
	});
});

ajaxRouter.get('/shipping_methods', (req, res, next) => {
	const filter = {
		enabled: true,
		order_id: req.signedCookies.order_id
	};
	api.shippingMethods.list(filter).then(({ status, json }) => {
		res.status(status).send(json);
	});
});

ajaxRouter.get('/payment_form_settings', (req, res, next) => {
	const order_id = req.signedCookies.order_id;
	if (order_id) {
		api.orders.getPaymentFormSettings(order_id).then(({ status, json }) => {
			res.status(status).send(json);
		});
	} else {
		res.end();
	}
});

export default ajaxRouter;
