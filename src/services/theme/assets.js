import path from 'path';
import AssetService from '../assets/assets';
import formidable from 'formidable';
import settings from '../../lib/settings';

const ThemeAssetPath = `${settings.assetServer.themeImageUploadPath}`;

class ThemeAssetsService {
	deleteFile(fileName) {
		return AssetService.deleteFile(ThemeAssetPath, fileName);
	}

	uploadFile(req, res, next) {
		const uploadDir = path.resolve(ThemeAssetPath);

		AssetService.uploadFile(req, res, uploadDir, () => {});
	}

	getErrorMessage(err) {
		return { error: true, message: err.toString() };
	}
}

export default new ThemeAssetsService();
