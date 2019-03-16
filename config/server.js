// config used by server side only
const dbHost = process.env.DB_HOST || 'ds147734.mlab.com';
const dbPort = process.env.DB_PORT || 47734;
const dbName = process.env.DB_NAME || 'cezerin2';
const dbUser = process.env.DB_USER || 'admin';
const dbPass = process.env.DB_PASS || 'password01';
const dbCred =
	dbUser.length > 0 || dbPass.length > 0 ? `${dbUser}:${dbPass}@` : '';

const dbUrl =
	process.env.DB_URL || `mongodb://${dbCred}${dbHost}:${dbPort}/${dbName}`;

module.exports = {
	// used by Store (server side)
	apiBaseUrl: process.env.API_BASE_URL || `http://localhost:3001/api/v1`,

	// Access-Control-Allow-Origin
	storeBaseUrl: process.env.STORE_URL || `http://localhost:3000`,

	// used by API
	adminBaseURL: process.env.ADMIN_BASE_URL || 'http://localhost:3002',
	adminLoginPath: process.env.ADMIN_LOGIN_PATH || '/admin/login',

	// used by API to service assets
	assetsBaseURL: process.env.ASSETS_BASE_URL || 'http://localhost:3001',

	apiListenPort: process.env.API_PORT || 3001,

	// used by API
	mongodbServerUrl: dbUrl,

	smtpServer: {
		host: 'in-v3.mailjet.com',
		port: 587,
		secure: false,
		user: '23fc6d9ca38af11fa5f6d133bf0359cd',
		pass: 'adc8d7ac9438464b5418b91ea68723de',
		fromName: 'El Patron',
		fromAddress: 'ninja.elpatron@gmail.com'
	},

	// key to sign tokens
	jwtSecretKey: process.env.JWT_SECRET_KEY || '-',

	// key to sign store cookies
	cookieSecretKey: process.env.COOKIE_SECRET_KEY || '-',

	// path to uploads
	categoriesUploadPath: 'public/content/images/categories',
	productsUploadPath: 'public/content/images/products',
	filesUploadPath: 'public/content',
	themeAssetsUploadPath: 'theme/assets/images',

	// url to uploads
	categoriesUploadUrl: '/images/categories',
	productsUploadUrl: '/images/products',
	filesUploadUrl: '',
	themeAssetsUploadUrl: '/assets/images',

	// store UI language
	language: process.env.LANGUAGE || 'en',

	// used by API
	orderStartNumber: 1000,

	// cost factor, controls how much time is needed to calculate a single BCrypt hash
	// for production: recommended salRounds > 12
	saltRounds: 10,

	developerMode: true
};
