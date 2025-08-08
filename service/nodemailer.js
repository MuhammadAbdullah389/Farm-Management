const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.mail,
    pass: process.env.mail_Pass,
  },
});

const sendOtpEmail = async (newUser, fname, id) => {
  const mailOptions = {
    from: '"Progress Solutions" <muhammad389abdullah@gmail.com>',
    to: newUser,
    subject: "Welcome to Progress Solutions - Complete Your Registration",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #007bff; text-align: center;">Welcome to Progress Solutions!</h2>

        <p>Dear <strong>${fname}</strong>,</p>

        <p>Thank you for joining <strong>Progress Solutions</strong>. We are excited to have you with us!</p>

        <p>To complete your registration, please enter the following unique ID on our website:</p>

        <div style="background-color: #f4f4f4; padding: 10px; margin: 20px 0; text-align: center; font-size: 20px; font-weight: bold; border-radius: 5px;">
          ${id}
        </div>

        <p>If you did not initiate this registration, you can safely ignore this email. No further action is needed.</p>

        <p>If you have any questions, feel free to contact us at <a href="mailto:muhammad389abdullah@gmail.com">muhammad389abdullah@gmail.com</a>.</p>

        <p>Welcome aboard!</p>

        <p>Best regards,</p>

        <p style="font-weight: bold;">Muhammad Abdullah & Soban Ahmad</p>
        <p style="color: #007bff;">Co-CEOs, Progress Solutions</p>

        <hr style="margin-top: 30px;">
        <p style="font-size: 12px; color: #777;">You are receiving this email because you created an account at Progress Solutions.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};


const sendpassOTPEmail = async (newUser, fname, otp) => {
  const mailOptions = {
    from: '"Progress Solutions" <muhammad389abdullah@gmail.com>',
    to: newUser,
    subject: "Password Update Request - Progress Solutions",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #007bff; text-align: center;">Password Update Verification</h2>

        <p>Dear <strong>${fname}</strong>,</p>

        <p>We received a request to update the password for your account at <strong>Progress Solutions</strong>.</p>

        <p>Please use the following One-Time Password (OTP) to verify your request:</p>

        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 20px; font-weight: bold; border-radius: 5px; letter-spacing: 2px;">
          ${otp}
        </div>

        <p>This OTP is valid for a limited time. If you did not request a password update, no action is required.</p>

        <p>If you have any questions, feel free to contact us at <a href="mailto:muhammad389abdullah@gmail.com">muhammad389abdullah@gmail.com</a>.</p>

        <p>Best regards,</p>

        <p style="font-weight: bold;">Muhammad Abdullah & Soban Ahmad</p>
        <p style="color: #007bff;">Co-CEOs, Progress Solutions</p>

        <hr style="margin-top: 20px;">
        <p style="font-size: 12px; color: #777;">You received this email because you requested a password update for your Progress Solutions account.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};


const sendpassUpdEmail = async (newUser, fname) => {
  const mailOptions = {
    from: '"Progress Solutions" <muhammad389abdullah@gmail.com>',
    to: newUser,
    subject: "Password Update Confirmation - Progress Solutions",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #007bff; text-align: center;">Password Successfully Updated</h2>

        <p>Dear <strong>${fname}</strong>,</p>

        <p>We are writing to confirm that your password for <strong>Progress Solutions</strong> has been successfully updated.</p>

        <p>If you did not make this change, please contact our support team as soon as possible by emailing <a href="mailto:muhammad389abdullah@gmail.com">muhammad389abdullah@gmail.com</a>.</p>

        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
          If this update was made by you, no further action is needed.
        </div>

        <p>Thank you for using Progress Solutions. If you have any questions, feel free to reach out to our support team.</p>

        <p>Best regards,</p>

        <p style="font-weight: bold;">Muhammad Abdullah & Soban Ahmad</p>
        <p style="color: #007bff;">Co-CEOs, Progress Solutions</p>

        <hr style="margin-top: 20px;">
        <p style="font-size: 12px; color: #777;">You are receiving this email because you made a change to your Progress Solutions account settings.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};


module.exports = {
  sendOtpEmail,
  sendpassOTPEmail,
  sendpassUpdEmail,
}
