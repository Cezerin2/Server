import LocalService, { IFile } from './local';
import S3Service from './s3';
import { Request, Response } from 'express';
import { serverConfig } from '../../lib/settings';

const service = serverConfig.assetServer.type === 's3' ? S3Service : LocalService;

class AssetsService {
	public getFileData(path: string, fileName: string) {
		return service.getFileData(path, fileName);
	}

	public getFilesData(path: string, files: string[]) {
		return service.getFilesData(path, files);
	}

	public getFiles(path: string) {
		return service.getFiles(path);
	}

	public deleteFile(path: string, fileName: string) {
		return service.deleteFile(path, fileName);
	}

	public deleteDir(path: string) {
		return service.deleteDir(path);
	}

	public emptyDir(path: string) {
		return service.emptyDir(path);
	}

	public uploadFile(req: Request, res: Response, path: string, onUploadEnd: (fileName: string) => void) {
		return service.uploadFile(req, res, path, onUploadEnd);
	}

	public uploadFiles(
		req: Request,
		res: Response,
		path: string,
		onFileUpload: (fielName: string) => void,
		onFilesEnd: (files: Array<IFile>) => void) {
		return service.uploadFiles(req, res, path, onFileUpload, onFilesEnd);
	}
}

export default new AssetsService();
