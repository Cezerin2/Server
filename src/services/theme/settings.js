import fs from 'fs';
import path from 'path';
import lruCache from 'lru-cache';
import serverSettings from '../../lib/settings';
import utils from '../../lib/utils';

const cache = lruCache({
	max: 10000,
	maxAge: 1000 * 60 * 60 * 24 // 24h
});

const THEME_SETTINGS_CACHE_KEY = 'themesettings';
const SETTINGS_FILE = path.resolve('theme/settings/settings.json');
const SETTINGS_SCHEMA_FILE = path.resolve(
	`theme/settings/${serverSettings.language}.json`
);
const SETTINGS_SCHEMA_FILE_EN = path.resolve('theme/settings/en.json');
const THEME_IMAGE_ASSET_BASE = 
	`${serverSettings.assetServer.domain}/${serverSettings.assetServer.themeImageUploadPath}/`;

class ThemeSettingsService {
	readFile(file) {
		return new Promise((resolve, reject) => {
			fs.readFile(file, 'utf8', (err, data) => {
				if (err) {
					reject(err);
				} else {
					let jsonData = {};
					try {
						jsonData = data.length > 0 ? JSON.parse(data) : {};
						resolve(jsonData);
					} catch (e) {
						reject('Failed to parse JSON');
					}
				}
			});
		});
	}

	writeFile(file, jsonData) {
		return new Promise((resolve, reject) => {
			const stringData = JSON.stringify(jsonData);
			fs.writeFile(file, stringData, err => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	getSettingsSchema() {
		if (fs.existsSync(SETTINGS_SCHEMA_FILE)) {
			return this.readFile(SETTINGS_SCHEMA_FILE);
		}

		// If current locale not exist, use scheme in English
		return this.readFile(SETTINGS_SCHEMA_FILE_EN);
	}

	getSettings() {
		const settingsFromCache = cache.get(THEME_SETTINGS_CACHE_KEY);

		if (settingsFromCache) {
			return Promise.resolve(settingsFromCache);
		}

		return this.readFile(SETTINGS_FILE).then(settings => {
			const updatedSettings = this.changeProperties(settings, true);
			cache.set(THEME_SETTINGS_CACHE_KEY, updatedSettings);
			return updatedSettings;
		});
	}

	updateSettings(settings) {
		cache.set(THEME_SETTINGS_CACHE_KEY, settings);
		return this.writeFile(
			SETTINGS_FILE, 
			this.changeProperties(
				utils.deepCopy(settings), 
				false));
	}

	changeProperties(settings, addAssetPath) {
		Object.keys(settings).forEach(placeholder => {
			if (settings[placeholder] instanceof Array) {
				// iterate over properties in placeholder
				settings[placeholder].forEach((_, index) => {
					// look for image in placeholder property objects
					if (settings[placeholder][index].hasOwnProperty('image')) {
						const file = settings[placeholder][index].image;
						settings[placeholder][index].image = addAssetPath ? 
							THEME_IMAGE_ASSET_BASE + file :
							file.replace(THEME_IMAGE_ASSET_BASE, '');
					}
				})
			} else if (settings[placeholder] instanceof Object) {
				// look for image in placeholder object
				if (settings[placeholder].hasOwnProperty('image')) {
					const file = settings[placeholder].image;
					settings[placeholder].image = addAssetPath ? 
						THEME_IMAGE_ASSET_BASE + file :
						file.replace(THEME_IMAGE_ASSET_BASE, '');
				}
			}
		})

		return settings;
	}
}

export default new ThemeSettingsService();
