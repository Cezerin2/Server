import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import { IEmailSettings, ISmtpSettings, serverConfig } from './settings';
import EmailSettingsService from '../services/settings/email';
import * as winston from 'winston';
import { MailOptions } from 'nodemailer/lib/json-transport';


const SMTP_FROM_CONFIG_FILE = {
	host: serverConfig.smtpServer.host,
	port: serverConfig.smtpServer.port,
	secure: serverConfig.smtpServer.secure,
	auth: {
		user: serverConfig.smtpServer.user,
		pass: serverConfig.smtpServer.pass
	}
};

const getSmtpFromEmailSettings = (emailSettings: IEmailSettings): ISmtpSettings => ({
	host: emailSettings.host,
	port: emailSettings.port,
	secure: emailSettings.port === 465,
	auth: {
		user: emailSettings.user,
		pass: emailSettings.pass
	}
});

const getSmtp = (emailSettings: IEmailSettings) => {
	const useSmtpServerFromConfigFile = emailSettings.host === '';
	const smtp = useSmtpServerFromConfigFile
		? SMTP_FROM_CONFIG_FILE
		: getSmtpFromEmailSettings(emailSettings);

	return smtp;
};
// tslint:disable-next-line
const sendMail = (smtp: smtpTransport.SmtpOptions, message: MailOptions) =>
	new Promise((resolve, reject) => {
		if (!(message.to! as string).includes('@')) {
			reject('Invalid email address');
			return;
		}

		const transporter = nodemailer.createTransport(smtpTransport(smtp));
		transporter.sendMail(message, (err: Error, info: string) => {
			if (err) {
				reject(err);
			} else {
				resolve(info);
			}
		});
	});

const getFrom = (emailSettings: IEmailSettings) => {
	const useSmtpServerFromConfigFile = emailSettings.host === '';
	return useSmtpServerFromConfigFile
		? `"${serverConfig.smtpServer.fromName}" <${serverConfig.smtpServer.fromAddress}>`
		: `"${emailSettings.from_name}" <${emailSettings.from_address}>`;
};

const send = async (message: MailOptions) => {
	const emailSettings = await EmailSettingsService.getEmailSettings();
	const smtp = getSmtp(emailSettings);
	message.from = getFrom(emailSettings);

	try {
		const result = await sendMail(smtp as smtpTransport.SmtpOptions, message);
		winston.info('Email sent', result);
		return true;
	} catch (e) {
		winston.error('Email send failed', e);
		return false;
	}
};

export default {
	send
};
