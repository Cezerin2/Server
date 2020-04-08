import security from '../lib/security';
import settings from '../lib/settings';
import AssetsService from '../services/assets/assets';

const filesPath = settings.assetServer.filesUploadPath;

class FilesRoute {
	constructor(router) {
		this.router = router;
		this.registerRoutes();
	}

	registerRoutes() {
		this.router.get(
			'/v1/files',
			security.checkUserScope.bind(this, security.scope.READ_FILES),
			this.getFiles.bind(this)
		);
		this.router.post(
			'/v1/files',
			security.checkUserScope.bind(this, security.scope.WRITE_FILES),
			this.uploadFile.bind(this)
		);
		this.router.delete(
			'/v1/files/:file',
			security.checkUserScope.bind(this, security.scope.WRITE_FILES),
			this.deleteFile.bind(this)
		);
	}

	getFiles(req, res, next) {
		AssetsService.getFiles(filesPath)
			.then(data => res.send(data))
			.catch(next);
	}

	uploadFile(req, res, next) {
		AssetsService.uploadFile(
			req,
			res,
			settings.assetServer.filesUploadPath,
			() => {}
		);
	}

	deleteFile(req, res, next) {
		AssetsService.deleteFile(
			settings.assetServer.filesUploadPath,
			req.params.file
		)
			.then(() => res.end())
			.catch(next);
	}
}

export default FilesRoute;
