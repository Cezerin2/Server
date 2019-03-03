// config used by server side only
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 27017;
const dbName = process.env.DB_NAME || 'shop';
const dbUser = process.env.DB_USER || '';
const dbPass = process.env.DB_PASS || '';
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

	smtpServer: {},

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

	developerMode: true
};
