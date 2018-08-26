process.env.NODE_ENV = 'test';

// Import the test dependencies
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import server from '../../src/api/server';

// Import the database
import { db } from '../../src/api/server/lib/mongo';

let testProduct = {
	images: [
		{
			id: '5b7057dea9f6b6144c4e223c',
			alt: '',
			position: 99,
			filename: 'moto.jpeg',
			url: '/images/products/5b7057d5a9f6b6144c4e223b/moto.jpeg'
		}
	],
	name: 'Product A',
	slug: 'product-a',
	category_id: '5b6b02ee1dc55368eb0d4a63',
	stock_quantity: 1,
	enabled: true,
	discontinued: false,
	sku: '12345',

	attributes: [
		{
			name: 'Brand',
			value: 'Brand A'
		},
		{
			name: 'Size',
			value: 'M'
		}
	],
	regular_price: 950,
	on_sale: false,
	variable: false,
	price: 950,
	stock_status: 'available',
	url: '/category-a/product-a',
	path: '/category-a/product-a',
	category_name: 'Category A',
	category_slug: 'category-a',
	id: ''
};

let loggedInAdminToken,
	product,
	options,
	variants,
	optionValues,
	variantsOptions,
	images;

describe('Products', () => {
	before(done => {
		// Empty database before proceeding with tests
		db.collection('products').drop();

		// Create a Test Admin user for testing, adjust this e-mail address to
		// match an existing user.
		let existingAdminEmail = 'admin@test.com';

		chai
			.request(server)
			.post(`/api/v1/authorize`)
			.set('content-type', 'application/x-www-form-urlencoded')
			.send({ email: existingAdminEmail })
			.end((err, res) => {
				loggedInAdminToken = res.body.token;
				done();
			});
	});

	describe('For Admin users', function() {
		describe('/POST products', function() {
			it('should POST a new product in our inventory', function(done) {
				chai
					.request(server)
					.post('/api/v1/products')
					.set('Authorization', loggedInAdminToken)
					.send(testProduct)
					.end((err, res) => {
						product = res.body;
						res.should.have.status(200);
						res.should.be.a('object');
						res.body.should.have.property('name').eql('Product A');
						res.body.should.have.property('sku').eql('12345');
						res.body.should.have.property('price').eql(950);
						res.body.should.have.property('date_created');
						done();
					});
			});

			it('should POST a new product with unique SKU in our inventory', function(done) {
				chai
					.request(server)
					.post('/api/v1/products')
					.set('Authorization', loggedInAdminToken)
					.send(testProduct)
					.end((err, res) => {
						res.should.have.status(200);
						res.should.be.a('object');
						res.body.should.have.property('name').eql('Product A');
						res.body.should.have.property('sku').eql('12345-2');
						res.body.should.have.property('price').eql(950);
						res.body.should.have.property('date_created');
						done();
					});
			});

			it('should POST new options to an existing product', function(done) {
				let testOptions = {
					name: 'New Options',
					control: 'select',
					required: true
				};

				chai
					.request(server)
					.post(`/api/v1/products/${product.id}/options`)
					.set('Authorization', loggedInAdminToken)
					.send(testOptions)
					.end((err, res) => {
						options = res.body;
						res.should.have.status(200);
						res.body.should.be.a('array');
						res.body[0].should.have.property('name').eql('New Options');
						res.body[0].should.have.property('required').eql(true);
						done();
					});
			});

			it('should POST new variants to an existing product', function(done) {
				let testVariants = {
					sku: '99',
					price: 500,
					stock_quantity: 1
				};

				chai
					.request(server)
					.post(`/api/v1/products/${product.id}/variants`)
					.set('Authorization', loggedInAdminToken)
					.send(testVariants)
					.end((err, res) => {
						variants = res.body;
						res.should.have.status(200);
						res.body.should.be.a('array');
						res.body[0].should.have.property('sku').eql('99');
						res.body[0].should.have.property('price').eql(500);
						res.body[0].should.have.property('stock_quantity').eql(1);
						done();
					});
			});

			it('should POST new values to existing options for an existing product', function(done) {
				let newOptionValues = {
					name: 'New Options Values'
				};

				chai
					.request(server)
					.post(
						`/api/v1/products/${product.id}/options/${options[0].id}/values`
					)
					.set('Authorization', loggedInAdminToken)
					.send(newOptionValues)
					.end((err, res) => {
						optionValues = res.body;
						res.should.have.status(200);
						res.body.should.be.a('array');
						res.body[0].should.have.property('name').eql('New Options Values');
						done();
					});
			});

			it('should POST a new image for a product', function(done) {
				chai
					.request(server)
					.post(`/api/v1/products/${product.id}/images`)
					.set('Authorization', loggedInAdminToken)
					.field('Content-Type', 'multipart/form-data')
					.attach('images', './test/test_image.png', 'test_image.png')
					.end((err, res) => {
						images = res.body;
						res.should.have.status(200);
						res.body[0].should.have.property('filename').eql('test_image.png');
						res.body[0].should.have.property('id');
						done();
					});
			});
		});

		describe('/GET products', function() {
			it('should get all products from our inventory', function(done) {
				chai
					.request(server)
					.get('/api/v1/products')
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.should.be.a('object');
						res.body.should.have.property('data');
						res.body.data.length.should.be.eql(2);
						done();
					});
			});

			it('should GET a single product from inventory with id', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.property('name').eql('Product A');
						res.body.should.have.property('sku').eql('12345');
						res.body.should.have.property('price').eql(950);
						res.body.should.have.property('date_created');
						done();
					});
			});

			it('should GET all options for a single product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/options`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.should.be.a('object');
						res.body.length.should.be.eql(1);
						res.body[0].should.have.property('name').eql('New Options');
						res.body[0].should.have.property('required').eql(true);
						done();
					});
			});

			it('should GET single option for a single product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/options/${options[0].id}`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.should.be.a('object');
						res.body.should.have.property('name').eql('New Options');
						res.body.should.have.property('required').eql(true);
						done();
					});
			});

			it('should GET all values for a single option for a single product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/options/${options[0].id}/values`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.should.be.a('object');
						res.body.length.should.be.eql(1);
						done();
					});
			});

			it('should GET single value for a single option for a single product', function(done) {
				chai
					.request(server)
					.get(
						`/api/v1/products/${product.id}/options/${options[0].id}/values/${
							optionValues[0].id
						}`
					)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.should.be.a('object');
						res.body.should.have.property('name').eql('New Options Values');
						done();
					});
			});

			it('should GET all variants for a single product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/variants`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.body.should.be.a('array');
						res.body.length.should.be.eql(1);
						res.body[0].should.have.property('sku').eql('99');
						res.body[0].should.have.property('price').eql(500);
						res.body[0].should.have.property('stock_quantity').eql(1);
						done();
					});
			});

			it('should GET all images for a product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/images`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						images = res.body;
						res.should.have.status(200);
						res.body[0].should.have.property('filename').eql('test_image.png');
						res.body[0].should.have.property('id');
						done();
					});
			});
		});

		describe('/PUT products', function() {
			it('should UPDATE a single product from inventory with id', function(done) {
				let updateProductData = {};
				updateProductData.name = 'New Product A';
				updateProductData.regular_price = 1;

				chai
					.request(server)
					.put(`/api/v1/products/${product.id}`)
					.set('Authorization', loggedInAdminToken)
					.send(updateProductData)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.property('name').eql('New Product A');
						res.body.should.have.property('sku').eql('12345');
						res.body.should.have.property('regular_price').eql(1);
						done();
					});
			});

			it('should UPDATE a single option for a single product', function(done) {
				let updateOptions = {};
				updateOptions.name = 'Updated Options';

				chai
					.request(server)
					.put(`/api/v1/products/${product.id}/options/${options[0].id}`)
					.set('Authorization', loggedInAdminToken)
					.send(updateOptions)
					.end((err, res) => {
						res.should.have.status(200);
						res.body[0].should.have.property('name').eql('Updated Options');
						done();
					});
			});

			it('should UPDATE a single variant for a single product', function(done) {
				let updateVariants = {};
				updateVariants.sku = '15';
				updateVariants.price = 99;

				chai
					.request(server)
					.put(`/api/v1/products/${product.id}/variants/${variants[0].id}`)
					.set('Authorization', loggedInAdminToken)
					.send(updateVariants)
					.end((err, res) => {
						res.should.have.status(200);
						res.body[0].should.have.property('sku').eql('15');
						res.body[0].should.have.property('price').eql(99);
						done();
					});
			});

			it('should UPDATE single value for a single option for a single product', function(done) {
				let updateOptionValues = {
					name: 'Updated Option Values'
				};

				chai
					.request(server)
					.put(
						`/api/v1/products/${product.id}/options/${options[0].id}/values/${
							optionValues[0].id
						}`
					)
					.set('Authorization', loggedInAdminToken)
					.send(updateOptionValues)
					.end((err, res) => {
						res.should.have.status(200);
						res.should.be.a('object');
						res.body[0].should.have
							.property('name')
							.eql('Updated Option Values');
						done();
					});
			});

			// TODO: Fix me!!
			// it('should UPDATE an image for a product', function(done) {
			// 	chai
			// 		.request(server)
			// 		.put(`/api/v1/images/products/${product.id}/${images[0].id}`)
			// 		.field('Content-Type', 'multipart/form-data')
			// 		.attach('images', './test/test_image2.png', 'test_image2.png')
			// 		.end((err, res) => {
			// 			console.log(res.body);
			// 			res.should.have.status(200);
			// 			res.body[0].should.have.property('filename').eql('test_image2.png');
			// 			res.body[0].should.have.property('id');
			// 			done();
			// 		});
			// });
		});

		describe('/DELETE products', function() {
			it('should DELETE a single option for a single product', function(done) {
				chai
					.request(server)
					.delete(`/api/v1/products/${product.id}/options/${options[0].id}`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.empty;
						done();
					});
			});

			it('should DELETE a single variant for a single product', function(done) {
				chai
					.request(server)
					.delete(`/api/v1/products/${product.id}/variants/${variants[0].id}`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.empty;
						done();
					});
			});

			it('should DELETE single value for a single option for a single product', function(done) {
				chai
					.request(server)
					.delete(
						`/api/v1/products/${product.id}/options/${options[0].id}/values/${
							optionValues[0].id
						}`
					)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.should.be.a('object');
						res.body.should.be.empty;
						done();
					});
			});

			it('should DELETE an image for a product', function(done) {
				chai
					.request(server)
					.delete(`/api/v1/products/${product.id}/images/${images[0].id}`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.empty;
						done();
					});
			});

			it('should delete a product from inventory with id', function(done) {
				chai
					.request(server)
					.delete(`/api/v1/products/${product.id}`)
					.set('Authorization', loggedInAdminToken)
					.end((err, res) => {
						res.should.have.status(200);
						res.should.be.a('object');
						res.body.should.be.empty;
						done();
					});
			});
		});
	});

	// If NOT in developer mode, all routes should provide a 401 error.
	describe('For Non-Admin users', function() {
		describe('/POST products', function() {
			// These next four tests are required to create a new product in the database
			// to stop the following .id's from being undefined.
			it('should POST a new product in our inventory', function(done) {
				chai
					.request(server)
					.post('/api/v1/products')
					.set('Authorization', loggedInAdminToken)
					.send(testProduct)
					.end((err, res) => {
						product = res.body;
						res.should.have.status(200);
						done();
					});
			});

			it('should POST new options to an existing product', function(done) {
				let testOptions = {
					name: 'New Options',
					control: 'select',
					required: true
				};

				chai
					.request(server)
					.post(`/api/v1/products/${product.id}/options`)
					.set('Authorization', loggedInAdminToken)
					.send(testOptions)
					.end((err, res) => {
						options = res.body;
						res.should.have.status(200);
						done();
					});
			});

			it('should POST new variants to an existing product', function(done) {
				let testVariants = {
					sku: '99',
					price: 500,
					stock_quantity: 1
				};

				chai
					.request(server)
					.post(`/api/v1/products/${product.id}/variants`)
					.set('Authorization', loggedInAdminToken)
					.send(testVariants)
					.end((err, res) => {
						variants = res.body;
						res.should.have.status(200);
						done();
					});
			});

			it('should POST new values to existing options for an existing product', function(done) {
				let newOptionValues = {
					name: 'New Options Values'
				};

				chai
					.request(server)
					.post(
						`/api/v1/products/${product.id}/options/${options[0].id}/values`
					)
					.set('Authorization', loggedInAdminToken)
					.send(newOptionValues)
					.end((err, res) => {
						optionValues = res.body;
						res.should.have.status(200);
						done();
					});
			});

			it('should give a 401 error when POSTing a new product in our inventory', function(done) {
				chai
					.request(server)
					.post('/api/v1/products')
					.send(testProduct)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when POSTing a new product with unique SKU in our inventory', function(done) {
				chai
					.request(server)
					.post('/api/v1/products')
					.send(testProduct)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when POSTing new options to an existing product', function(done) {
				let testOptions = {
					name: 'New Options',
					control: 'select',
					required: true
				};

				chai
					.request(server)
					.post(`/api/v1/products/${product.id}/options`)
					.send(testOptions)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when POSTing new variants to an existing product', function(done) {
				let testVariants = {
					sku: '99',
					price: 500,
					stock_quantity: 1
				};

				chai
					.request(server)
					.post(`/api/v1/products/${product.id}/variants`)
					.send(testVariants)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when POSTing new values to existing options for an existing product', function(done) {
				let newOptionValues = {
					name: 'New Options Values'
				};

				chai
					.request(server)
					.post(
						`/api/v1/products/${product.id}/options/${options[0].id}/values`
					)
					.send(newOptionValues)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});
		});

		describe('/GET products', function() {
			it('should give a 401 error when GETTING all products from our inventory', function(done) {
				chai
					.request(server)
					.get('/api/v1/products')
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when GETTING a single product from inventory with id', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}`)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when GETTING all options for a single product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/options`)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when GETTING single option for a single product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/options/${options[0].id}`)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when GETTING all values for a single option for a single product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/options/${options[0].id}/values`)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when GETTING single value for a single option for a single product', function(done) {
				chai
					.request(server)
					.get(
						`/api/v1/products/${product.id}/options/${options[0].id}/values/${
							optionValues[0].id
						}`
					)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when GETTING all variants for a single product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/variants`)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when GETTING all images for a product', function(done) {
				chai
					.request(server)
					.get(`/api/v1/products/${product.id}/images`)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});
		});

		describe('/PUT products', function() {
			it('should give a 401 error when UPDATING a single product from inventory with id', function(done) {
				let updateProductData = {};
				updateProductData.name = 'New Product A';
				updateProductData.regular_price = 1;

				chai
					.request(server)
					.put(`/api/v1/products/${product.id}`)
					.send(updateProductData)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when UPDATING a single option for a single product', function(done) {
				let updateOptions = {};
				updateOptions.name = 'Updated Options';

				chai
					.request(server)
					.put(`/api/v1/products/${product.id}/options/${options[0].id}`)
					.send(updateOptions)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 error when UPDATING a single variant for a single product', function(done) {
				let updateVariants = {};
				updateVariants.sku = '15';
				updateVariants.price = 99;

				chai
					.request(server)
					.put(`/api/v1/products/${product.id}/variants/${variants[0].id}`)
					.send(updateVariants)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			it('should give a 401 when UPDATING single value for a single option for a single product', function(done) {
				let updateOptionValues = {
					name: 'Updated Option Values'
				};

				chai
					.request(server)
					.put(
						`/api/v1/products/${product.id}/options/${options[0].id}/values/${
							optionValues[0].id
						}`
					)
					.send(updateOptionValues)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});

			describe('/DELETE products', function() {
				it('should give a 401 error when DELETING a single option for a single product', function(done) {
					chai
						.request(server)
						.delete(`/api/v1/products/${product.id}/options/${options[0].id}`)
						.end((err, res) => {
							res.should.have.status(401);
							done();
						});
				});

				it('should give a 401 error when DELETING a single variant for a single product', function(done) {
					chai
						.request(server)
						.delete(`/api/v1/products/${product.id}/variants/${variants[0].id}`)
						.end((err, res) => {
							res.should.have.status(401);
							done();
						});
				});

				it('should give a 401 error when DELETING single value for a single option for a single product', function(done) {
					chai
						.request(server)
						.delete(
							`/api/v1/products/${product.id}/options/${options[0].id}/values/${
								optionValues[0].id
							}`
						)
						.end((err, res) => {
							res.should.have.status(401);
							done();
						});
				});

				it('should give a 401 error when DELETING an image for a product', function(done) {
					chai
						.request(server)
						.delete(`/api/v1/products/${product.id}/images/${images[0].id}`)
						.end((err, res) => {
							res.should.have.status(401);
							done();
						});
				});

				it('should give a 401 error when DELETING a product from inventory with id', function(done) {
					chai
						.request(server)
						.delete(`/api/v1/products/${product.id}`)
						.end((err, res) => {
							res.should.have.status(401);
							done();
						});
				});
			});
		});
	});
});
