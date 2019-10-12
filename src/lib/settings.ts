export { default as serverConfig } from '../../config/server';

export interface ISmtpSettings {
	host: string;
	port: number;
	secure: boolean;
	auth: ISmtpAuth;
}

export interface ISmtpAuth {
	user: string;
	pass: string;
}

export interface IEmailSettings {
	host: string;
	port: number;
	user: string;
	pass: string;
	from_name: string;
	from_address: string;
}
