import { Resend } from 'resend';

// nodemailer is optional — only used when SMTP_USER/SMTP_PASS env vars are set
let nodemailer: any = null;
try {
    nodemailer = require('nodemailer');
} catch {
    // nodemailer not installed — SMTP sending will be unavailable
}

/**
 * Generic Email Service for sending notifications.
 * Supports Gmail SMTP (Nodemailer) and Resend SDK.
 */
export class EmailService {
    private static _resend: Resend | null = null;
    private static _transporter: any = null;
    private static FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    private static get smtpUser() {
        return process.env.SMTP_USER || process.env.GMAIL_USER;
    }

    private static get smtpPass() {
        return process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    }

    private static get smtpFrom() {
        return process.env.SMTP_FROM || `"Church of God Dasmariñas" <${this.smtpUser}>`;
    }

    private static get transporter() {
        if (!this._transporter && this.smtpUser && this.smtpPass) {
            this._transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: this.smtpUser,
                    pass: this.smtpPass.replace(/\s+/g, ''),
                },
            });
        }
        return this._transporter;
    }

    private static get resend() {
        if (!this._resend && process.env.RESEND_API_KEY) {
            this._resend = new Resend(process.env.RESEND_API_KEY);
        }
        return this._resend;
    }

    /**
     * Sends an email using Gmail SMTP (if configured) or Resend SDK.
     */
    static async sendEmail({
        to,
        subject,
        html,
        text,
        attachments,
    }: {
        to: string | string[];
        subject: string;
        html: string;
        text?: string;
        attachments?: any[];
    }) {
        const recipients = Array.isArray(to) ? to.join(', ') : to;

        // 1. Prioritize Gmail SMTP / Nodemailer if configured
        if (this.smtpUser && this.smtpPass) {
            try {
                const transporter = this.transporter;
                if (!transporter) {
                    throw new Error('SMTP transporter failed to initialize.');
                }

                const mailOptions: any = {
                    from: this.smtpFrom,
                    to: recipients,
                    subject,
                    html: html || text,
                    text: text,
                };
                if (attachments && attachments.length > 0) {
                    mailOptions.attachments = attachments;
                }

                const info = await transporter.sendMail(mailOptions);

                console.log(`[EmailService] Sent via Gmail SMTP to ${recipients}:`, info.messageId);
                return { success: true, messageId: info.messageId, provider: 'smtp' };
            } catch (error) {
                console.error('[EmailService] SMTP send error:', error);
                throw error;
            }
        }

        // 2. Otherwise use Resend if RESEND_API_KEY is configured
        if (process.env.RESEND_API_KEY) {
            try {
                const resend = this.resend;
                if (!resend) {
                    throw new Error('Resend SDK failed to initialize even with API key.');
                }

                const { data, error } = await resend.emails.send({
                    from: this.FROM_EMAIL,
                    to: Array.isArray(to) ? to : [to],
                    subject,
                    html: html || (text as string),
                    text: text,
                });

                if (error) {
                    throw new Error(`Resend SDK error: ${JSON.stringify(error)}`);
                }

                console.log(`[EmailService] Sent via Resend to ${recipients}:`, data?.id);
                return { ...data, provider: 'resend' };
            } catch (error) {
                console.error('[EmailService] Resend send error:', error);
                throw error;
            }
        }

        // 3. Fallback: Mock log
        console.warn('Neither SMTP nor RESEND_API_KEY is configured. Email skipped.');
        console.log('--- Mock Email ---');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Body:', text || 'HTML Content');
        console.log('------------------');
        return { success: true, mock: true };
    }
}

