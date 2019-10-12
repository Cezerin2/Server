import LocalService, { File } from './local';
import S3Service from './s3';
import { Request, Response } from 'express';
import { serverConfig } from '../../lib/settings';

const service = serverConfig.assetServer.type === 's3' ? S3Service : LocalService;

class AssetsService {
	getFileData(path: string, fileName: string) {
		return service.getFileData(path, fileName);
	}

	getFilesData(path: string, files: string[]) {
		return service.getFilesData(path, files);
	}

	getFiles(path: string) {
		return service.getFiles(path);
	}

	deleteFile(path: string, fileName: string) {
		return service.deleteFile(path, fileName);
	}

	deleteDir(path: string) {
		return service.deleteDir(path);
	}

	emptyDir(path: string) {
		return service.emptyDir(path);
	}

	uploadFile(req: Request, res: Response, path: string, onUploadEnd: (fileName: string) => void) {
		return service.uploadFile(req, res, path, onUploadEnd);
	}

	uploadFiles(req: Request, res: Response, path: string, onFileUpload: (fielName: string) => void, onFilesEnd: (files: File[]) => void) {
		return service.uploadFiles(req, res, path, onFileUpload, onFilesEnd);
	}
}

export default new AssetsService();
