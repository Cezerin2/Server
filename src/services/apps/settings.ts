import { db } from "../../lib/mongo"

class AppSettingsService {
  getSettings(appKey: any) {
    return db
      .collection("appSettings")
      .findOne({ key: appKey }, { _id: 0, key: 0 })
  }

  updateSettings(appKey: any, data: { key?: any }) {
    if (Object.keys(data).length === 0) {
      return new Error("Required fields are missing")
    }

    delete data.key

    return db
      .collection("appSettings")
      .updateOne(
        { key: appKey },
        {
          $set: data,
        },
        { upsert: true }
      )
      .then((res: any) => this.getSettings(appKey))
  }
}

export default new AppSettingsService()
