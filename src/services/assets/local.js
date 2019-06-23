import fse from 'fs-extra';
import formidable from 'formidable';
import path from 'path';
import utils from '../../lib/utils';
import settings from '../../lib/settings';

const ResolveSystemPath = (dir, file = '') => {
	const BaseAssetPath = `${settings.assetServer.localBasePath}`;

	const paths = [BaseAssetPath, dir, file].filter(
		x => typeof x === 'string' && x.length > 0
	);

	return path.resolve(paths.join('/'));
};

const ResolveUrlPath = (dir, file) => {
	const BaseAssetPath = `${settings.assetServer.domain}`;

	const paths = [BaseAssetPath, dir, file].filter(
		x => typeof x === 'string' && x.length > 0
	);

	return paths.join('/');
};

class LocalService {
	getFileData(dir, fileName) {
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

	getFilesData(dir, files) {
		return files
			.map(fileName => this.getFileData(dir, fileName))
			.filter(fileData => fileData !== null)
			.sort((a, b) => a.modified - b.modified);
	}

	getFiles(dir) {
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

	deleteFile(dir, fileName) {
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

	deleteDir(dir) {
		const dirPath = ResolveSystemPath(dir);
		fse.remove(dirPath, err => {});
	}

	emptyDir(dir) {
		const dirPath = ResolveSystemPath(dir);
		fse.emptyDirSync(dirPath);
	}

	uploadFile(req, res, dir, onUploadEnd) {
		const uploadDir = ResolveSystemPath(dir);
		fse.ensureDirSync(uploadDir);

		const form = new formidable.IncomingForm();
		let file_name = null;
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
						url: `${settings.assetServer.domain}/${settings.assetServer.themeImageUploadPath}/${file_name}`
					});
				} else {
					res
						.status(400)
						.send(this.getErrorMessage('Required fields are missing'));
				}
			});

		form.parse(req);
	}

	uploadFiles(req, res, dir, onFileUpload, onFilesEnd) {
		const uploadedFiles = [];
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

	getErrorMessage(err) {
		return { error: true, message: err.toString() };
	}
}

export default new LocalService();
