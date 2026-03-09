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

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        throw new Error('GMAIL_USER or GMAIL_PASS environment variables are not set.');
    }

    const info = await transporter.sendMail({
        from: `"SMARTLABS Team" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
    });
    return info;
}
