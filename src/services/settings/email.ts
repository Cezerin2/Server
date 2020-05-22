import { db } from "../../lib/mongo"
import parse from "../../lib/parse"

class EmailSettingsService {
  constructor() {
    this.defaultSettings = {
      host: "",
      port: "",
      user: "",
      pass: 0,
      from_name: "",
      from_address: "",
    }
  }

  getEmailSettings() {
    return db
      .collection("emailSettings")
      .findOne()
      .then((settings: any) => this.changeProperties(settings))
  }

  updateEmailSettings(data: any) {
    const settings = this.getValidDocumentForUpdate(data)
    return this.insertDefaultSettingsIfEmpty().then(() =>
      db
        .collection("emailSettings")
        .updateOne(
          {},
          {
            $set: settings,
          },
          { upsert: true }
        )
        .then(() => this.getEmailSettings())
    )
  }

  insertDefaultSettingsIfEmpty() {
    return db
      .collection("emailSettings")
      .countDocuments({})
      .then((count: number) => {
        if (count === 0) {
          return db.collection("emailSettings").insertOne(this.defaultSettings)
        }
      })
  }

  getValidDocumentForUpdate(data: {
    host?: any
    port?: any
    user?: any
    pass?: any
    from_name?: any
    from_address?: any
  }) {
    if (Object.keys(data).length === 0) {
      return new Error("Required fields are missing")
    }

    const settings = {
      host: {},
      port: {},
      user: {},
      pass: {},
      from_name: {},
      from_address: {},
    }

    if (data.host !== undefined) {
      settings.host = parse.getString(data.host).toLowerCase()
    }

    if (data.port !== undefined) {
      settings.port = parse.getNumberIfPositive(data.port)
    }

    if (data.user !== undefined) {
      settings.user = parse.getString(data.user)
    }

    if (data.pass !== undefined) {
      settings.pass = parse.getString(data.pass)
    }

    if (data.from_name !== undefined) {
      settings.from_name = parse.getString(data.from_name)
    }

    if (data.from_address !== undefined) {
      settings.from_address = parse.getString(data.from_address)
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

export default new EmailSettingsService()
