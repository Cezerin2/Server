import AWS from 'aws-sdk';
import fs from 'fs';
import formidable from 'formidable';
import path from 'path';
import utils from '../../lib/utils';
import settings from '../../lib/settings';

const BUCKET = settings.assetServer.bucket;
const s3 = new AWS.S3();

const upload = (file_name, file) => {
	const s3Config = {
		Bucket: BUCKET,
		Key: file_name,
		Body: file
	};
	return new Promise((resolve, reject) => {
		s3.putObject(s3Config, (err, resp) => {
			if (err) {
				console.log(err);
				reject({ success: false, data: err });
			}
			resolve({ sucess: true, data: resp });
		});
	});
};

class S3Service {
	getFileData(path, fileName) {
		const filePath = `${path}/${fileName}`;

		return s3.headObject({ Key: filePath, Bucket: BUCKET }, (err, data) => {
			if (err) {
				return null;
			}

			return {
				file: fileName,
				size: data.ContentLength,
				modified: data.LastModified
			};
		});
	}

	getFilesData(path, files) {
		return files
			.map(fileName => this.getFileData(fileName))
			.filter(fileData => fileData !== null)
			.sort((a, b) => a.modified - b.modified);
	}

	getFiles(path) {
		return new Promise((resolve, reject) => {
			s3.ListObjects({ Key: path, Bucket: BUCKET }, (err, data) => {
				if (err) {
					return reject(err);
				}
				const filesData = data.Contents.map(ObjectData => ({
					file: ObjectData.Key,
					size: data.Size,
					modified: ObjectData.LastModified
				}));
				resolve(filesData);
			});
		});
	}

	deleteFile(path, fileName) {
		return new Promise((resolve, reject) => {
			const params = {
				Bucket: BUCKET,
				Delete: {
					Objects: [
						{
							Key: `${path}/${fileName}`
						}
					]
				}
			};

			s3.deleteObject(params, (err, data) => {
				if (err) {
					return reject('File not found');
				}
				resolve();
			});
		});
	}

	async deleteDir(path) {
		this.emptyDir(path);
	}

	emptyDir(path) {
		let params = {
			Bucket: BUCKET,
			Prefix: path
		};

		s3.listObjects(params, (err, data) => {
			if (err) return;

			if (data.Contents.length == 0) return;

			params = { Bucket: BUCKET };
			params.Delete = { Objects: [] };

			data.Contents.forEach(content => {
				params.Delete.Objects.push({ Key: content.Key });
			});

			s3.deleteObjects(params, (err, data) => {});
		});
	}

	uploadFile(req, res, path, onUploadEnd) {
		const form = new formidable.IncomingForm();
		let file_name = null;
		const file_size = 0;
		let buffer = null;

		form
			.on('fileBegin', (name, file) => {
				// Emitted whenever a field / value pair has been received.
				file.name = utils.getCorrectFileName(file.name);
			})
			.on('file', (name, file) => {
				// every time a file has been uploaded successfully,
				file_name = file.name;
				buffer = fs.readFileSync(path.resolve(file.path));
			})
			.on('error', err => {
				res.status(500).send(this.getErrorMessage(err));
			})
			.on('end', () => {
				upload(`${path}/${file_name}`, buffer)
					.then(async fileData => {
						await onUploadEnd(`${path}/${file_name}`);
						res.json({
							successful: true,
							fileData
						});
					})
					.catch(err => {
						console.log(err);
						res.sendStatus(500);
					});
			});

		form.parse(req);
	}

	async uploadFiles(req, res, path, onFileUpload, onFilesEnd) {
		const uploadedFiles = [];

		const form = new formidable.IncomingForm();

		form
			.on('fileBegin', (name, file) => {
				// Emitted whenever a field / value pair has been received.
				file.name = utils.getCorrectFileName(file.name);
			})
			.on('file', async (field, file) => {
				// every time a file has been uploaded successfully,
				if (file.name) {
					const buffer = fs.readFileSync(file.path);
					await upload(`${path}/${file.name}`, buffer)
						.then(async fileData => {
							uploadedFiles.push(file.name);
							await onFileUpload(file.name);
						})
						.catch(err => {
							console.log(err);
						});
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

export default new S3Service();
