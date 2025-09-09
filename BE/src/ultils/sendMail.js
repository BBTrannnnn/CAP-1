import nodemailer from 'nodemailer';
import asyncHandler from 'express-async-handler';

const sendMail = asyncHandler(async ({ email, html, subject  }) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, 
        auth: {
            user: process.env.EMAIL_NAME,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });

    let info = await transporter.sendMail({
        from: '"Farming Assistant" <no-reply@farmassistant.com>',
        to: email,
        subject: subject,
        html: html,
    });

    return info;
});

export default sendMail;
