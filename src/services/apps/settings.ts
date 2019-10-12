import { db } from '../../lib/mongo';
import { Dictionary } from 'express-serve-static-core';
import { FindOneOptions } from 'mongodb';

class AppSettingsService {
	public getSettings(appKey: string): Promise<Dictionary<string> | null> {
		return db!
			.collection('appSettings')
			.findOne({ key: appKey }, { _id: 0, key: 0 } as FindOneOptions);
	}

	public updateSettings(appKey: string, data: Dictionary<string>): Promise<Dictionary<string> | null> | Error {
		if (Object.keys(data).length === 0) {
			return new Error('Required fields are missing');
		}

		delete data.key;

		return db!
			.collection('appSettings')
			.updateOne(
				{ key: appKey },
				{
					$set: data
				},
				{ upsert: true }
			).then(res => this.getSettings(appKey));
	}
}

export default new AppSettingsService();
