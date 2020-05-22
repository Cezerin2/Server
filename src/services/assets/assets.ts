import settings from "../../lib/settings"
import LocalService from "./local"
import MinioService from "./minio"
import S3Service from "./s3"

let service

if (settings.assetServer.type === "s3") {
  service = S3Service
} else if (settings.assetServer.type === "minio") {
  service = MinioService
} else {
  service = LocalService
}

class AssetsService {
  getFileData(path: any, fileName: any) {
    return service.getFileData(path, fileName)
  }

  getFilesData(path: any, files: any) {
    return service.getFilesData(path, files)
  }

  getFiles(path: string) {
    return service.getFiles(path)
  }

  deleteFile(path: string, fileName: any) {
    return service.deleteFile(path, fileName)
  }

  deleteDir(path: string) {
    return service.deleteDir(path)
  }

  emptyDir(path: string) {
    return service.emptyDir(path)
  }

  uploadFile(
    req: any,
    res: any,
    path: string,
    onUploadEnd: {
      (file_name: any): void
      (file_name: any): void
      (): void
      (): void
    }
  ) {
    return service.uploadFile(req, res, path, onUploadEnd)
  }

  uploadFiles(
    req: any,
    res: any,
    path: string,
    onFileUpload: (filename: any) => Promise<void>,
    onFilesEnd: () => void
  ) {
    return service.uploadFiles(req, res, path, onFileUpload, onFilesEnd)
  }
}

export default new AssetsService()
