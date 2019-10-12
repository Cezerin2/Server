import { ObjectID } from 'mongodb';

const getString = (value: string | number) => (value || '').toString();

const getDateIfValid = (value: string) => {
	const date = Date.parse(value);
	return isNaN(date) ? null : new Date(date);
};

const getArrayIfValid = (value: string) => (Array.isArray(value) ? value : null);

const getObjectIDIfValid = (value: string) =>
	ObjectID.isValid(value) ? new ObjectID(value) : null;

const getArrayOfObjectID = (value: string) => {
	if (Array.isArray(value) && value.length > 0) {
		return value.map(id => getObjectIDIfValid(id)).filter(id => !!id);
	}
	return [];
};

const isNumber = (value: string | number) => !isNaN(parseFloat(value as string)) && isFinite(value as number);

const getNumberIfValid = (value: string | number) => (isNumber(value) ? parseFloat(value as string) : null);

const getNumberIfPositive = (value: number) => {
	const n = getNumberIfValid(value);
	return n && n >= 0 ? n : null;
};

const getBooleanIfValid = (value: string, defaultValue: unknown = null) => {
	if (value === 'true' || value === 'false') {
		return value === 'true';
	}
	return typeof value === 'boolean' ? value : defaultValue;
};

const getBrowser = (browser: { ip: string, user_agent: string }) =>
	browser
		? {
			ip: getString(browser.ip),
			user_agent: getString(browser.user_agent)
		}
		: {
			ip: '',
			user_agent: ''
		};

export interface ICustomerAddress {
	coordinates?: {
		latitude: string;
		longitude: string;
	};
	address1: string;
	address2: string;
	city: string;
	country: string;
	state: string;
	phone: string;
	postal_code: string;
	full_name: string;
	company: string;
	tax_number: string;
	details: string;
	default_billing: boolean;
	default_shipping: boolean;

}
const getCustomerAddress = (address: ICustomerAddress) => {
	const coordinates = {
		latitude: '',
		longitude: ''
	};

	if (address && address.coordinates) {
		coordinates.latitude = address.coordinates.latitude;
		coordinates.longitude = address.coordinates.longitude;
	}

	return address
		? {
			id: new ObjectID(),
			address1: getString(address.address1),
			address2: getString(address.address2),
			city: getString(address.city),
			country: getString(address.country).toUpperCase(),
			state: getString(address.state),
			phone: getString(address.phone),
			postal_code: getString(address.postal_code),
			full_name: getString(address.full_name),
			company: getString(address.company),
			tax_number: getString(address.tax_number),
			coordinates,
			details: address.details,
			default_billing: false,
			default_shipping: false
		}
		: {};
};

const getOrderAddress = (address: ICustomerAddress) => {
	const coordinates = {
		latitude: '',
		longitude: ''
	};

	if (address && address.coordinates) {
		coordinates.latitude = address.coordinates.latitude;
		coordinates.longitude = address.coordinates.longitude;
	}

	const emptyAddress = {
		address1: '',
		address2: '',
		city: '',
		country: '',
		state: '',
		phone: '',
		postal_code: '',
		full_name: '',
		company: '',
		tax_number: '',
		coordinates,
		details: null
	};

	return address
		? Object.assign(
			{},
			{
				address1: getString(address.address1),
				address2: getString(address.address2),
				city: getString(address.city),
				country: getString(address.country).toUpperCase(),
				state: getString(address.state),
				phone: getString(address.phone),
				postal_code: getString(address.postal_code),
				full_name: getString(address.full_name),
				company: getString(address.company),
				tax_number: getString(address.tax_number),
				coordinates,
				details: address.details
			},
			address
		)
		: emptyAddress;
};

export default {
	getString,
	getObjectIDIfValid,
	getDateIfValid,
	getArrayIfValid,
	getArrayOfObjectID,
	getNumberIfValid,
	getNumberIfPositive,
	getBooleanIfValid,
	getBrowser,
	getCustomerAddress,
	getOrderAddress
};
