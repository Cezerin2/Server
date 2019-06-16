import AWS from 'aws-sdk';
import parse from '../../lib/parse';
import lruCache from 'lru-cache';
import settings from '../../lib/settings';

const cache = lruCache({
	max: 10000,
	maxAge: 1000 * 60 * 60 * 24 // 24h
});

const cognitoClient = new AWS.CognitoIdentityServiceProvider(
	{
		apiVersion: '2016-04-18',
		region: settings.security.cognitoRegion,
		ClientId: settings.security.cognitoClientId
	}
);

const BLACKLIST_CACHE_KEY = 'blacklist';

class CognitoService {
	getTokens(params = {}) {
		const email = parse.getString(params.email).toLowerCase();
		const username = parse.getString(params.id)

		let filter = "status='Enabled'";

		if (email && email.length > 0) {
			filter += `email=\"${email}\`"`;
		}

		if (username && username.length > 0) {
			filter += `username=\"${username}\`"`;
		}

		var input = {
			UserPoolId: settings.security.cognitoUserPool,
			AttributesToGet: [
				'name',
				'email',
				'custom:scopes'
			],
			Filter: filter
		};

		return cognitoClient
			.listUsers(input)
			.promise()
			.then(items => items.Users.map(user => this.changeProperties(user)));
	}

	getTokensBlacklist() {
		const blacklistFromCache = cache.get(BLACKLIST_CACHE_KEY);

		if (blacklistFromCache) {
			return Promise.resolve(blacklistFromCache);
		}

		return cognitoClient
			.listUsers({
				UserPoolId: settings.security.cognitoUserPool,
				AttributesToGet: [ 'email' ],
				Filter: "status='Disabled'"
			})
			.promise()
			.then(items => {
				users = items.Users.map(user => this.changeProperties(user))
				cache.set(BLACKLIST_CACHE_KEY, users);
				return users
			});
	}

	getSingleToken(id) {
		return this.getTokens({ id }).then(items =>
			items.length > 0 ? items[0] : null
		);
	}

	getSingleTokenByEmail(email) {
		return this.getTokens({ email }).then(items =>
			items.length > 0 ? items[0] : null
		);
	}

	addToken(data) {
		const params = this.getValidDocumentForInsert(data);

		return cognitoClient
			.adminCreateUser(params)
			.promise()
			.then(item => {
				// This returns the token, this is no longer possible
				return this.changeProperties(item.User)
			});
	}

	updateToken(id, data) {
		return Promise.reject()
	}

	deleteToken(email) {
		return Promise.reject()
	}

	getValidDocumentForInsert(data) {
		const email = parse.getString(data.email);
		const scopes = parse.getArrayIfValid(data.scopes);
		const name = parse.getString(data.name);

		const params = {
			UserPoolId: settings.security.cognitoUserPool,
			Username: email,
			DesiredDeliveryMediums: [ 'EMAIL' ],
			UserAttributes: [
				{
				Name: 'email',
				Value: email
				},
				{
				Name: 'name',
				Value: name
				},
				{
				Name: 'custom:scopes',
				Value: scopes.join(',')
				}
			],  
			ValidationData: [
				{
				Name: 'email',
				Value: email
				}
			]
		}

		return  params;
	}

	getValidDocumentForUpdate(id, data) {
		return Promise.reject()
	}

	changeProperties(item) {
		if (item) {
			const attributes = item.Attributes.reduce((acc, attribute) => {
				acc[attribute.Name] = attribute.Value;
				return acc;
			}, {})

			item.id = item.Username;
			item.is_revoked = !item.Enabled;
			item.scopes = attributes['custom:scopes'].split(",");
			item.name = attributes['name'];
			item.email = attributes['email'];
			
			delete item.Attributes;
			delete item.Username;
			delete item.Enabled;
		}

		return item;
	}

	async sendDashboardSigninUrl(req) {
		return { sent: false, error: 'Access Denied' };
	}
}

export default new CognitoService();
