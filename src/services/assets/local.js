import fse from 'fs-extra';
import formidable from 'formidable';
import path from 'path';
import utils from '../../lib/utils';

class LocalService {
	getFileData(dir, fileName) {
		const filePath = path.resolve(`${dir}/${fileName}`);
		const stats = fse.statSync(filePath);
		if (stats.isFile()) {
			return {
				file: fileName,
				size: stats.size,
				modified: stats.mtime
			};
		}
		return null;
	}

	getFilesData(dir, files) {
		const folderPath = path.resolve(dir);
		return files
			.map(fileName => this.getFileData(folderPath, fileName))
			.filter(fileData => fileData !== null)
			.sort((a, b) => a.modified - b.modified);
	}

	getFiles(dir) {
		return new Promise((resolve, reject) => {
			const folderPath = path.resolve(dir);
			fse.readdir(folderPath, (err, files) => {
				if (err) {
					reject(err);
				} else {
					const filesData = this.getFilesData(folderPath, files);
					resolve(filesData);
				}
			});
		});
	}

	deleteFile(dir, fileName) {
		return new Promise((resolve, reject) => {
			const filePath = path.resolve(`${dir}/${fileName}`);
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
		const dirPath = path.resolve(dir);
		fse.remove(dirPath, err => {});
	}

	emptyDir(dir) {
		const dirPath = path.resolve(dir);
		fse.emptyDirSync(dirPath);
	}

	uploadFile(req, res, dir, onUploadEnd) {
		const uploadDir = path.resolve(dir);

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
					res.send({ file: file_name, size: file_size });
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
		fse.ensureDirSync(dir);

		const form = new formidable.IncomingForm();
		form.uploadDir = path.resolve(dir);

		form
			.on('fileBegin', (name, file) => {
				// Emitted whenever a field / value pair has been received.
				file.name = utils.getCorrectFileName(file.name);
				file.path = `${dir}/${file.name}`;
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
