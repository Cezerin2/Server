const enviroment = process.env
// config used by server side only
const dbHost = enviroment.DB_HOST || "127.0.0.1"
const dbPort = enviroment.DB_PORT || 27017
const dbName = enviroment.DB_NAME || "shop"
const dbUser = enviroment.DB_USER || ""
const dbPass = enviroment.DB_PASS || ""
const dbCred =
  dbUser.length > 0 || dbPass.length > 0 ? `${dbUser}:${dbPass}@` : ""

const dbUrl =
  enviroment.DB_URL || `mongodb://${dbCred}${dbHost}:${dbPort}/${dbName}`

const Config = {
  // used by Store (server side)
  apiBaseUrl: enviroment.API_BASE_URL || `http://localhost:3001/api/v1`,

  // Access-Control-Allow-Origin
  storeBaseUrl: enviroment.STORE_BASE_URL || `http://localhost:3000`,

  // used by API
  adminBaseURL: enviroment.ADMIN_BASE_URL || "http://localhost:3002",
  adminLoginPath: enviroment.ADMIN_LOGIN_PATH || "/login",

  apiListenPort: enviroment.API_PORT || 3001,

  // used by API
  mongodbServerUrl: dbUrl,

  // assest
  assetServer: {
    type: enviroment.ASSETS_TYPE || "local", // 'local' | 's3' | 'minio'
    domain: enviroment.ASSETS_BASE_URL || "http://localhost:3001", // add localBasePath to S3 domain
    localBasePath: "public/content",
    categoriesUploadPath: "images/categories",
    productsUploadPath: "images/products",
    themeImageUploadPath: "assets/images",
    filesUploadPath: "assets",

    // S3 Config
    bucket: "cezerin2-asset-test",

    //Minio Config
    minioHost: 'minio',
    minioPort: 9000,
    minioAccessKey: enviroment.MINIO_ACCESS_KEY || '',
    minioSecretKey: enviroment.MINIO_SECRET_KEY || '',

    // disable thumbnail resizing suffix, need for s3/minio work because they are no under nginx
    disableImageResize: enviroment.DISABLE_IMAGE_RESIZE || false
  },

  // smpt server parameters
  smtpServer: {
    host: enviroment.SMTP_HOST || "",
    port: enviroment.SMTP_PORT || 587,
    secure: enviroment.SMTP_SECURE || false,
    user: enviroment.SMTP_USER || "",
    pass: enviroment.SMTP_PASS || "",
    fromName: enviroment.SMTP_FROM_NAME || "",
    fromAddress: enviroment.SMTP_FROM_ADDRESS || "",
  },

  // key to sign tokens
  jwtSecretKey: enviroment.JWT_SECRET_KEY || "-",

  // key to sign store cookies
  cookieSecretKey: enviroment.COOKIE_SECRET_KEY || "-",

  // store UI language
  language: enviroment.LANGUAGE || "en",

  // used by API
  orderStartNumber: 1000,

  // cost factor, controls how much time is needed to calculate a single BCrypt hash
  // for production: recommended salRounds > 12
  saltRounds: enviroment.SALT_ROUNDS || 12,

  developerMode: enviroment.DEVELOPER_MODE || true,
}

export default Config
