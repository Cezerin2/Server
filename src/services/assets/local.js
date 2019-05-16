import fse from 'fs-extra';
import formidable from 'formidable';
import utils from '../../lib/utils';

class LocalService {
	getFileData(path, fileName) {
		const filePath = `${path}/${fileName}`;
		const stats = fse.statSync(filePath);
		if (stats.isFile()) {
			return {
				file: fileName,
				size: stats.size,
				modified: stats.mtime
			};
		} else {
			return null;
		}
	}

	getFilesData(path, files) {
		return files
			.map(fileName => this.getFileData(path, fileName))
			.filter(fileData => fileData !== null)
			.sort((a, b) => a.modified - b.modified);
	}

	getFiles(path) {
		return new Promise((resolve, reject) => {
			fse.readdir(path, (err, files) => {
				if (err) {
					reject(err);
				} else {
					const filesData = this.getFilesData(path, files);
					resolve(filesData);
				}
			});
		});
	}

	deleteFile(path, fileName) {
		return new Promise((resolve, reject) => {
			const filePath = `${path}/${fileName}`;
			if (fse.existsSync(filePath)) {
				fse.unlink(filePath, err => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	deleteDir(path) {
		fse.remove(path, err => {});
	}

	emptyDir(path) {
		fse.emptyDirSync(path);
	}

	uploadFile(req, res, path, onUploadEnd) {
		const uploadDir = path;

		fse.ensureDirSync(uploadDir);

		let form = new formidable.IncomingForm(),
			file_name = null,
			file_size = 0;

		form.uploadDir = uploadDir;

		form
			.on('fileBegin', (name, file) => {
				// Emitted whenever a field / value pair has been received.
				file.name = utils.getCorrectFileName(file.name);
				file.path = `${uploadDir}/${file.name}`;
			})
			.on('file', function(name, file) {
				// every time a file has been uploaded successfully,
				file_name = file.name;
				file_size = file.size;
			})
			.on('error', err => {
				res.status(500).send(this.getErrorMessage(err));
			})
			.on('end', async () => {
				//Emitted when the entire request has been received, and all contained files have finished flushing to disk.
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

	uploadFiles(req, res, path, onFileUpload, onFilesEnd) {
		let uploadedFiles = [];

		fse.ensureDirSync(path);

		let form = new formidable.IncomingForm();
		form.uploadDir = path;

		form
			.on('fileBegin', (name, file) => {
				// Emitted whenever a field / value pair has been received.
				file.name = utils.getCorrectFileName(file.name);
				file.path = path + '/' + file.name;
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
