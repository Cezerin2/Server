import * as winston from 'winston';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import settings, { EmailSettings, SmtpSettings } from './settings';
import EmailSettingsService from '../services/settings/email';

const SMTP_FROM_CONFIG_FILE = {
	host: settings.smtpServer.host,
	port: settings.smtpServer.port,
	secure: settings.smtpServer.secure,
	auth: {
		user: settings.smtpServer.user,
		pass: settings.smtpServer.pass
	}
};

const getSmtpFromEmailSettings = (emailSettings: EmailSettings): SmtpSettings => ({
	host: emailSettings.host,
	port: emailSettings.port,
	secure: emailSettings.port === 465,
	auth: {
		user: emailSettings.user,
		pass: emailSettings.pass
	}
});

const getSmtp = (emailSettings: EmailSettings) => {
	const useSmtpServerFromConfigFile = emailSettings.host === '';
	const smtp = useSmtpServerFromConfigFile
		? SMTP_FROM_CONFIG_FILE
		: getSmtpFromEmailSettings(emailSettings);

	return smtp;
};

const sendMail = (smtp: smtpTransport.SmtpOptions, message: Mail.Options) =>
	new Promise((resolve, reject) => {
		if (!(message.to! as String).includes('@')) {
			reject('Invalid email address');
			return;
		}

		const transporter = nodemailer.createTransport(smtpTransport(smtp));
		transporter.sendMail(message, (err, info) => {
			if (err) {
				reject(err);
			} else {
				resolve(info);
			}
		});
	});

const getFrom = (emailSettings: EmailSettings) => {
	const useSmtpServerFromConfigFile = emailSettings.host === '';
	return useSmtpServerFromConfigFile
		? `"${settings.smtpServer.fromName}" <${settings.smtpServer.fromAddress}>`
		: `"${emailSettings.from_name}" <${emailSettings.from_address}>`;
};

const send = async (message: Mail.Options) => {
	const emailSettings = await EmailSettingsService.getEmailSettings();
	const smtp = getSmtp(emailSettings);
	message.from = getFrom(emailSettings);

	try {
		const result = await sendMail(smtp, message);
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
