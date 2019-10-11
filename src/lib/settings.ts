export { default } from '../../config/server';

export interface SmtpSettings {
	host: String;
	port: number;
	secure: boolean;
	auth: SmtpAuth;
}

export interface SmtpAuth {
	user: string;
	pass: string;
}

export interface EmailSettings {
	host: string;
	port: number;
	user: string;
	pass: string;
	from_name: string;
	from_address: string;
}