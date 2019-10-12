import path from 'path';
import formidable from 'formidable';
import AssetService from '../assets/assets';
import { serverConfig } from '../../lib/settings';

const ThemeAssetPath = `${serverConfig.assetServer.themeImageUploadPath}`;

class ThemeAssetsService {
	deleteFile(fileName) {
		return AssetService.deleteFile(ThemeAssetPath, fileName);
	}

	uploadFile(req, res, next) {
		AssetService.uploadFile(req, res, ThemeAssetPath, () => { });
	}

	getErrorMessage(err) {
		return { error: true, message: err.toString() };
	}
}

export default new ThemeAssetsService();
