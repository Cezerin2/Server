import fs from "fs"
import formidable from "formidable"
import pathModule from "path"
import utils from "../../lib/utils"
import settings from "../../lib/settings"

const Minio = require("minio")

const minio = new Minio.Client({
  endPoint: settings.assetServer.minioHost,
  port: settings.assetServer.minioPort,
  useSSL: false,
  accessKey: settings.assetServer.minioAccessKey,
  secretKey: settings.assetServer.minioSecretKey,
})

/*
 * Minio has url like http://minio/BUCKET/path/to/object.ext
 * Wе need separate bucket from file path
 */
function separateBucket(file_name) {
  const [bucket, ...fileNameRest] = file_name.split("/")
  return [bucket, fileNameRest.join("/") || ""]
}

const upload = (file_name, fileBuffer) => {
  const [bucket, file] = separateBucket(file_name)

  return new Promise((resolve, reject) => {
    minio.putObject(bucket, file, fileBuffer, (err, resp) => {
      if (err) {
        reject({ success: false, data: err })
      }

      resolve({ success: true, data: resp })
    })
  })
}

class MinioService {
  getFileData(path, fileName) {
    const filePath = `${path}/${fileName}`

    const [bucket, file] = separateBucket(filePath)

    return minio.statObject(bucket, file, (err, data) => {
      if (err) {
        return null
      }

      return {
        file: fileName,
        size: data.size,
        modified: data.lastModified,
      }
    })
  }

  getFilesData(path, files) {
    return files
      .map(fileName => this.getFileData(path, fileName))
      .filter(fileData => fileData !== null)
      .sort((a, b) => a.modified - b.modified)
  }

  getFiles(path) {
    const [bucket, file] = separateBucket(path)

    return this.getListObjects(bucket, file).then((objectsList: Array<any>) =>
      objectsList.map(obj => ({
        file: [bucket, obj.prefix, obj.name].filter(x => !!x).join("/"),
        size: obj.size,
        modified: obj.lastModified,
      }))
    )
  }

  getListObjects(bucket, file) {
    return new Promise((resolve, reject) => {
      const objectsList = []
      const objectsStream = minio.listObjects(bucket, file, true)

      objectsStream.on("data", obj => {
        objectsList.push(obj)
      })

      objectsStream.on("error", function (e) {
        reject("Error minio")
      })

      objectsStream.on("end", function () {
        resolve(objectsList)
      })
    })
  }

  deleteFile(path, fileName) {
    const [bucket, file] = separateBucket(`${path}/${fileName}`)

    return new Promise((resolve, reject) => {
      minio.removeObject(bucket, file, (err, data) => {
        if (err) {
          return reject("File not found")
        }

        resolve()
      })
    })
  }

  async deleteDir(path) {
    this.emptyDir(path)
  }

  emptyDir(path) {
    const [bucket, file] = separateBucket(path)

    return this.getListObjects(bucket, file).then((objectsList: Array<any>) =>
      objectsList.map(obj => {
        minio.removeObjects(
          bucket,
          objectsList.map(obj => [obj.prefix, obj.name].join("/")),
          err => {
            console.log(err)
          }
        )
      })
    )
  }

  uploadFile(req, res, path, onUploadEnd) {
    const form = new formidable.IncomingForm()
    let file_name = null
    let buffer = null

    form
      .on("fileBegin", (name, file) => {
        file.name = utils.getCorrectFileName(file.name)
      })
      .on("file", (name, file) => {
        file_name = file.name
        buffer = fs.readFileSync(pathModule.resolve(file.path))
      })
      .on("error", err => {
        res.status(500).send(this.getErrorMessage(err))
      })
      .on("end", () => {
        upload(`${path}/${file_name}`, buffer)
          .then(async fileData => {
            await onUploadEnd(`${file_name}`)
            res.json({
              successful: true,
              fileData,
            })
          })
          .catch(err => {
            console.log(err)
            res.sendStatus(500)
          })
      })

    form.parse(req)
  }

  async uploadFiles(req, res, path, onFileUpload, onFilesEnd) {
    const uploadedFiles = []

    const form = new formidable.IncomingForm()

    form
      .on("fileBegin", (name, file) => {
        // Emitted whenever a field / value pair has been received.
        file.name = utils.getCorrectFileName(file.name)
      })
      .on("file", async (field, file) => {
        // every time a file has been uploaded successfully,
        if (file.name) {
          const buffer = fs.readFileSync(file.path)
          await upload(`${path}/${file.name}`, buffer)
            .then(async fileData => {
              uploadedFiles.push(file.name)
              await onFileUpload(file.name)
            })
            .catch(err => {
              console.log(err)
            })
        }
      })
      .on("error", err => {
        res.status(500).send(this.getErrorMessage(err))
      })
      .on("end", async () => {
        await onFilesEnd(uploadedFiles)
        res.send(uploadedFiles)
      })

    form.parse(req)
  }

  getErrorMessage(err) {
    return { error: true, message: err.toString() }
  }
}

export default new MinioService()
