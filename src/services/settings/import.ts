import { db } from "../../lib/mongo"
import parse from "../../lib/parse"

class ImportSettingsService {
  defaultSettings: { apikey: string; sheetid: string; range: string }
  constructor() {
    this.defaultSettings = {
      apikey: "",
      sheetid: "",
      range: "",
    }
  }

  getImportSettings() {
    return db
      .collection("importSettings")
      .findOne()
      .then((settings: any) => {
        return this.changeProperties(settings)
      })
  }

  updateImportSettings(data: any) {
    const settings = this.getValidDocumentForUpdate(data)
    return this.insertDefaultSettingsIfEmpty().then(() =>
      db
        .collection("importSettings")
        .updateOne(
          {},
          {
            $set: settings,
          },
          { upsert: true }
        )
        .then((res: any) => this.getImportSettings())
    )
  }

  insertDefaultSettingsIfEmpty() {
    return db
      .collection("importSettings")
      .countDocuments({})
      .then((count: number) => {
        if (count === 0) {
          return db.collection("importSettings").insertOne(this.defaultSettings)
        }
      })
  }

  getValidDocumentForUpdate(data: {
    apikey?: any
    sheetid?: any
    range?: any
  }) {
    if (Object.keys(data).length === 0) {
      return new Error("Required fields are missing")
    }

    const settings = { apikey: {}, sheetid: {}, range: {} }

    if (data.apikey !== undefined) {
      settings.apikey = parse.getString(data.apikey)
    }

    if (data.sheetid !== undefined) {
      settings.sheetid = parse.getString(data.sheetid)
    }

    if (data.range !== undefined) {
      settings.range = parse.getString(data.range)
    }

    return settings
  }

  changeProperties(settings: { _id: any }) {
    if (settings) {
      delete settings._id
    } else {
      return this.defaultSettings
    }

    return settings
  }
}

export default new ImportSettingsService()
