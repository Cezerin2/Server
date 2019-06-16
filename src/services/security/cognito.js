import AWS from 'aws-sdk';
import parse from '../../lib/parse';
import settings from '../../lib/settings';

const cognitoClient = new AWS.CognitoIdentityServiceProvider(
	{
		apiVersion: '2016-04-18',
		region: settings.security.cognitoRegion,
		ClientId: settings.security.cognitoClientId
	}
);

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
		return Promise.reject()
	}

	getSingleToken(id) {
		return Promise.reject()
	}

	getSingleTokenByEmail(email) {
		return Promise.reject()
	}

	addToken(data) {
		return Promise.reject()
	}

	updateToken(id, data) {
		return Promise.reject()
	}

	deleteToken(email) {
		return Promise.reject()
	}

	getValidDocumentForInsert(data) {
		return Promise.reject()
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
