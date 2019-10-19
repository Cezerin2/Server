import * as jwt from 'jsonwebtoken';
import serverConfig from '../../config/server';

const cert = serverConfig.jwtSecretKey;
class AuthHeader {
	public encodeUserLoginAuth(userId: string) {
		return jwt.sign({ userId }, cert);
	}

	public decodeUserLoginAuth(token: string) {
		try {
			return jwt.verify(token, cert);
		} catch (error) {
			return error;
		}
	}

	public encodeUserPassword(token: string) {
		return jwt.sign({ password: token }, cert);
	}

	public decodeUserPassword(token: string) {
		return jwt.verify(token, cert);
	}
}
export default new AuthHeader();
