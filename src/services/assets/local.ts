import fse from 'fs-extra';
import formidable from 'formidable';
import path from 'path';
import { Request, Response } from 'express';
import utils from '../../lib/utils';
import * as settings from '../../lib/settings';

export interface File {
	url: string;
	file: string;
	size: number;
	modified: Date;
}

const ResolveSystemPath = (dir: string, file = '') => {
	const BaseAssetPath = `${settings.serverConfig.assetServer.localBasePath}`;

	const paths = [BaseAssetPath, dir, file].filter(
		x => typeof x === 'string' && x.length > 0
	);

	return path.resolve(paths.join('/'));
};

const ResolveUrlPath = (dir: string, file: string) => {
	const BaseAssetPath = `${settings.serverConfig.assetServer.domain}`;

	const paths = [BaseAssetPath, dir, file].filter(
		x => typeof x === 'string' && x.length > 0
	);

	return paths.join('/');
};

class LocalService {
	getFileData(dir: string, fileName: string): File | null {
		const fileSystemPath = ResolveSystemPath(dir, fileName);
		const fileUrlPath = ResolveUrlPath(dir, fileName);
		const stats = fse.statSync(fileSystemPath);

		if (stats.isFile()) {
			return {
				url: fileUrlPath,
				file: fileName,
				size: stats.size,
				modified: stats.mtime
			};
		}
		return null;
	}

	getFilesData(dir: string, files: string[]) {
		return files
			.map(fileName => this.getFileData(dir, fileName))
			.filter(fileData => fileData !== null)
			.sort((a, b) => a!.modified.getTime() - b!.modified.getTime());
	}

	getFiles(dir: string) {
		return new Promise((resolve, reject) => {
			const folderPath = ResolveSystemPath(dir);

			// Will error if no folder exists
			fse.ensureDirSync(folderPath);

			fse.readdir(folderPath, (err, files) => {
				if (err) {
					reject(err);
				} else {
					const filesData = this.getFilesData(dir, files);
					resolve(filesData);
				}
			});
		});
	}

	deleteFile(dir: string, fileName: string) {
		return new Promise((resolve, reject) => {
			const filePath = ResolveSystemPath(dir, fileName);
			if (fse.existsSync(filePath)) {
				fse.unlink(filePath, err => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	deleteDir(dir: string) {
		const dirPath = ResolveSystemPath(dir);
		fse.remove(dirPath, err => { });
	}

	emptyDir(dir: string) {
		const dirPath = ResolveSystemPath(dir);
		fse.emptyDirSync(dirPath);
	}

	uploadFile(req: Request, res: Response, dir: string, onUploadEnd: (fielName: string) => void) {
		const uploadDir = ResolveSystemPath(dir);
		fse.ensureDirSync(uploadDir);

		const form = new formidable.IncomingForm();
		let file_name: string | null = null;
		let file_size = 0;

		form.uploadDir = uploadDir;

		form
			.on('fileBegin', (name, file) => {
				// Emitted whenever a field / value pair has been received.
				file.name = utils.getCorrectFileName(file.name);
				file.path = `${uploadDir}/${file.name}`;
			})
			.on('file', (name, file) => {
				// every time a file has been uploaded successfully,
				file_name = file.name;
				file_size = file.size;
			})
			.on('error', err => {
				res.status(500).send(this.getErrorMessage(err));
			})
			.on('end', async () => {
				// Emitted when the entire request has been received, and all contained files have finished flushing to disk.
				if (file_name) {
					await onUploadEnd(file_name);
					res.send({
						file: file_name,
						size: file_size,
						url: `${settings.serverConfig.assetServer.domain}/${settings.serverConfig.assetServer.themeImageUploadPath}/${file_name}`
					});
				} else {
					res
						.status(400)
						.send(this.getErrorMessage('Required fields are missing'));
				}
			});

		form.parse(req);
	}

	uploadFiles(req: Request, res: Response, dir: string, onFileUpload: (fielName: string) => void, onFilesEnd: (files: File[]) => void) {
		const uploadedFiles: File[] = [];
		const uploadDir = ResolveSystemPath(dir);

		fse.ensureDirSync(uploadDir);

		const form = new formidable.IncomingForm();
		form.uploadDir = uploadDir;

		form
			.on('fileBegin', (name, file) => {
				// Emitted whenever a field / value pair has been received.
				file.name = utils.getCorrectFileName(file.name);
				file.path = `${uploadDir}/${file.name}`;
			})
			.on('file', async (field, file) => {
				// every time a file has been uploaded successfully,
				if (file.name) {
					await onFileUpload(file.name);

					uploadedFiles.push(file.name);
				}
			})
			.on('error', err => {
				res.status(500).send(this.getErrorMessage(err));
			})
			.on('end', async () => {
				await onFilesEnd(uploadedFiles);
				res.send(uploadedFiles);
			});

		form.parse(req);
	}

	getErrorMessage(err: Error | string) {
		return { error: true, message: err.toString() };
	}
}

export default new LocalService();
