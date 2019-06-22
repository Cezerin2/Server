import fs from 'fs';
import path from 'path';
import lruCache from 'lru-cache';
import serverSettings from '../../lib/settings';

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
			const updatedSettings = this.changeGetProperties(settings)
			cache.set(THEME_SETTINGS_CACHE_KEY, updatedSettings);
			return updatedSettings;
		});
	}

	updateSettings(settings) {
		cache.set(THEME_SETTINGS_CACHE_KEY, settings);
		return this.writeFile(SETTINGS_FILE, this.changeUpdateProperties(settings));
	}

	changeGetProperties(settings) {
		for (var key in settings) {
			if (typeof settings[key] === 'object') {
				for (var extra in settings[key]){
					if (settings[key][extra].hasOwnProperty('image')) {
						settings[key][extra].image = `${serverSettings.assetServer.domain}/${serverSettings.assetServer.themeImageUploadPath}/${settings[key][extra].image}`;
					}
				}
				if (settings[key].hasOwnProperty('image')) {
					settings[key].image = `${serverSettings.assetServer.domain}/${serverSettings.assetServer.themeImageUploadPath}/${settings[key][extra].image}`;
				}
			}
		}

		return settings;
	}

	changeUpdateProperties(settings) {
		// required to deep copy of it will change the cached object
		const settingsCopy = JSON.parse(JSON.stringify(settings))
		for (var key in settingsCopy) {
			if (typeof settingsCopy[key] === 'object') {
				for (var extra in settingsCopy[key]){
					if (settingsCopy[key][extra].hasOwnProperty('image')) {
						settingsCopy[key][extra].image = settingsCopy[key][extra].image.replace(`${serverSettings.assetServer.domain}/${serverSettings.assetServer.themeImageUploadPath}/`, '');
					}
				}
				if (settingsCopy[key].hasOwnProperty('image')) {
					settingsCopy[key].image = settingsCopy[key].image.replace(`${serverSettings.assetServer.domain}/${serverSettings.assetServer.themeImageUploadPath}/`, '');
				}
			}
		}

		return settingsCopy;
	}
}

export default new ThemeSettingsService();
