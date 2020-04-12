import LocalService from './local';
import S3Service from './s3';
import settings from '../../lib/settings';

const service = settings.assetServer.type === 's3' ? S3Service : LocalService;

class AssetsService {
	getFileData(path, fileName) {
		return service.getFileData(path, fileName);
	}

	getFilesData(path, files) {
		return service.getFilesData(path, files);
	}

	getFiles(path) {
		return service.getFiles(path);
	}

	deleteFile(path, fileName) {
		return service.deleteFile(path, fileName);
	}

	deleteDir(path) {
		return service.deleteDir(path);
	}

	emptyDir(path) {
		return service.emptyDir(path);
	}

	uploadFile(req, res, path, onUploadEnd) {
		return service.uploadFile(req, res, path, onUploadEnd);
	}

	uploadFiles(req, res, path, onFileUpload, onFilesEnd) {
		return service.uploadFiles(req, res, path, onFileUpload, onFilesEnd);
	}
}

export default new AssetsService();
