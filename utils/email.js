const nodemailer = require("nodemailer");
const logger = require("./logger");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send order confirmation email
const sendOrderConfirmation = async (orderData) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: orderData.email,
      subject: "Order Confirmation - PawMart",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Order Confirmation</h2>
          <p>Dear ${orderData.buyerName},</p>
          <p>Thank you for your order! Here are the details:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Details</h3>
            <p><strong>Product:</strong> ${orderData.productName}</p>
            <p><strong>Quantity:</strong> ${orderData.quantity}</p>
            <p><strong>Total Price:</strong> $${
              orderData.price * orderData.quantity
            }</p>
            <p><strong>Delivery Address:</strong> ${orderData.address}</p>
            <p><strong>Phone:</strong> ${orderData.phone}</p>
          </div>
          
          <p>We'll contact you soon to arrange delivery.</p>
          <p>Thank you for choosing PawMart!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated email. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Order confirmation email sent to ${orderData.email}`);
  } catch (error) {
    logger.error("Failed to send order confirmation email:", error);
  }
};

// Send welcome email
const sendWelcomeEmail = async (userData) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userData.email,
      subject: "Welcome to PawMart!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Welcome to PawMart!</h2>
          <p>Dear ${userData.name},</p>
          <p>Welcome to PawMart - your trusted marketplace for pets and pet supplies!</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Get Started</h3>
            <ul>
              <li>Browse our wide selection of pets and supplies</li>
              <li>Create listings to sell your pet products</li>
              <li>Connect with other pet lovers in your area</li>
              <li>Enjoy secure and reliable transactions</li>
            </ul>
          </div>
          
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Happy pet shopping!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated email. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${userData.email}`);
  } catch (error) {
    logger.error("Failed to send welcome email:", error);
  }
};

module.exports = {
  sendOrderConfirmation,
  sendWelcomeEmail,
};
