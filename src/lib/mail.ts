import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

export interface MailAttachment {
    filename: string;
    content: Buffer | string;
    contentType?: string;
}

export async function sendMail({ to, subject, html, replyTo, attachments }: { to: string; subject: string; html: string; replyTo?: string; attachments?: MailAttachment[] }) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        throw new Error('GMAIL_USER or GMAIL_PASS environment variables are not set.');
    }

    const info = await transporter.sendMail({
        from: `"SMARTLABS Team" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
        ...(replyTo ? { replyTo } : {}),
        ...(attachments?.length ? { attachments } : {}),
    });
    return info;
}
