import nodemailer from 'nodemailer';
import asyncHandler from 'express-async-handler';
import dotenv from 'dotenv';
dotenv.config();

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

    const mailOptions = {
        from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_NAME}>`,
        to: email,
        subject,
        html,
    };

    let info = await transporter.sendMail(mailOptions);

    return info;
});

export default sendMail;
