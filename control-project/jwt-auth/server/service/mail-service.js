const nodemailer = require('nodemailer');

class MailService {
  constructor() {
    this.transporter = null;
  }

  _getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
    return this.transporter;
  }

  async sendActivationMail(to, link) {
    await this._getTransporter().sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Активация аккаунта на ' + process.env.API_URL,
      html: `<div><h1>Для активации перейдите по ссылке</h1><a href="${link}">${link}</a></div>`,
    });
  }
}

module.exports = new MailService();