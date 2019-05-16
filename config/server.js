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
	storeBaseUrl: process.env.STORE_BASE_URL || `http://localhost:3000`,

	// used by API
	adminBaseURL: process.env.ADMIN_BASE_URL || 'http://localhost:3002',
	adminLoginPath: process.env.ADMIN_LOGIN_PATH || '/login',

	// used by API to service assets
	assetsBaseURL: process.env.ASSETS_BASE_URL || 'http://localhost:3001',

	apiListenPort: process.env.API_PORT || 3001,

	// used by API
	mongodbServerUrl: dbUrl,

	// assest
	assetServer: {
		type: 'local', // 'local' | 's3'
		domain: 'http://localhost:3001', // add localBasePath to S3 domain
		localBasePath: 'public/content',
		categoriesUploadPath: 'images/categories',
		productsUploadPath: 'images/products',
		themeImageUploadPath: 'theme/assets/images',
		filesUploadPath: 'files',

		// S3 Config
		bucket: 'cezerin2-asset-test'
	},

	// smpt server parameters
	smtpServer: {
		host: process.env.SMTP_HOST || '',
		port: process.env.SMTP_PORT || 587,
		secure: process.env.SMTP_SECURE || false,
		user: process.env.SMTP_USER || '',
		pass: process.env.SMTP_PASS || '',
		fromName: process.env.SMTP_FROM_NAME || '',
		fromAddress: process.env.SMTP_FROM_ADDRESS || ''
	},

	// key to sign tokens
	jwtSecretKey: process.env.JWT_SECRET_KEY || '-',

	// key to sign store cookies
	cookieSecretKey: process.env.COOKIE_SECRET_KEY || '-',

	// store UI language
	language: process.env.LANGUAGE || 'en',

	// used by API
	orderStartNumber: 1000,

	// cost factor, controls how much time is needed to calculate a single BCrypt hash
	// for production: recommended salRounds > 12
	saltRounds: process.env.SALT_ROUNDS || 12,

	developerMode: process.env.DEVELOPER_MODE || true
};
