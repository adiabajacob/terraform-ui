import nodemailer from "nodemailer";

// Create email transporter using SMTP settings from environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendCompanyCredentials = async (companyName, email, password) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@rds-dr.com",
      to: email,
      subject: "Welcome to AWS RDS DR Manager - Your Account Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #2563eb; margin: 0;">AWS RDS DR Manager</h1>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to AWS RDS DR Manager!</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              Your company <strong>${companyName}</strong> has been successfully registered in our AWS RDS Disaster Recovery management platform.
            </p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Your Login Credentials:</h3>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>Important:</strong> Please change your password after your first login for security purposes.
              </p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              You can now access the platform to configure and manage your AWS RDS disaster recovery deployments.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Platform
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              If you have any questions or need assistance, please contact our support team.
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">© 2024 AWS RDS DR Manager. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    // For development, log the preview URL
    if (process.env.NODE_ENV === "development") {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send email: " + error.message);
  }
};
