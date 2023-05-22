const { URL } = require('url');

const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGO_DB_URL;
const MONGODB_USERNAME = process.env.MONGODB_USERNAME || process.env.MONGO_DB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || process.env.MONGO_DB_PASSWORD;
const MONGODB_NAME = process.env.MONGODB_NAME || process.env.MONGO_DB_NAME;

const parsedUrl = new URL(MONGODB_URL);

if (MONGODB_USERNAME) {
  parsedUrl.username = MONGODB_USERNAME;
}
if (MONGODB_PASSWORD) {
  parsedUrl.password = MONGODB_PASSWORD;
}
if (MONGODB_NAME) {
  parsedUrl.pathname = MONGODB_NAME;
}

const stdout = process.stdout;
stdout.write(parsedUrl.toString(), () => {});
