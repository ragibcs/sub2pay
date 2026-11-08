import nodemailer from "nodemailer";

export interface SendOrderDeliveryEmailOptions {
  toEmail: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  deliveredItems: string[];
  txId?: string | null;
}

export class EmailService {
  private static getTransporter() {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || "587");
    const user = process.env.EMAIL_USER || process.env.EMAIL_HOST_USER;
    const pass = process.env.EMAIL_PASS || process.env.EMAIL_HOST_PASSWORD;

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  /**
   * Sends the delivered credentials and order receipt to the customer
   */
  static async sendOrderDeliveryEmail(options: SendOrderDeliveryEmailOptions): Promise<boolean> {
    const { toEmail, orderNumber, productName, quantity, totalAmount, currency, deliveredItems, txId } =
      options;

    const fromEmail =
      process.env.DEFAULT_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      "Sub2Pay Orders <notifications@choloklabs.tech>";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const lookupUrl = `${siteUrl}/checkout/${orderNumber}`;

    const itemsHtml = deliveredItems
      .map(
        (item) =>
          `<div style="background:#0f1623; border:1px solid #1e2c44; border-radius:8px; padding:12px; margin-bottom:8px; font-family:monospace; color:#34d399; font-size:14px; word-break:break-all;">${item}</div>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order #${orderNumber} is Delivered!</title>
</head>
<body style="background-color:#080c14; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#f8fafc; padding:24px; margin:0;">
  <div style="max-width:600px; margin:0 auto; background-color:#131b2b; border:1px solid #1e2c44; border-radius:16px; padding:32px; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:24px;">
      <h2 style="margin:0; font-size:22px; font-weight:800; color:#ffffff;">SimpleCard / Sub2Pay</h2>
    </div>

    <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); border-radius:12px; padding:16px; margin-bottom:24px;">
      <span style="color:#10b981; font-weight:700; font-size:16px;">✓ Payment Confirmed & Delivered!</span>
      <p style="margin:4px 0 0; color:#94a3b8; font-size:13px;">Your digital credentials have been generated and are ready for use.</p>
    </div>

    <table style="width:100%; border-collapse:collapse; margin-bottom:24px; font-size:13px;">
      <tr>
        <td style="color:#94a3b8; padding:6px 0;">Order Number:</td>
        <td style="font-weight:700; color:#ffffff; text-align:right; font-family:monospace;">#${orderNumber}</td>
      </tr>
      <tr>
        <td style="color:#94a3b8; padding:6px 0;">Product:</td>
        <td style="font-weight:700; color:#ffffff; text-align:right;">${quantity}x ${productName}</td>
      </tr>
      <tr>
        <td style="color:#94a3b8; padding:6px 0;">Amount Paid:</td>
        <td style="font-weight:800; color:#34d399; text-align:right;">${totalAmount} ${currency.toUpperCase()}</td>
      </tr>
      ${
        txId
          ? `<tr>
        <td style="color:#94a3b8; padding:6px 0;">Blockchain TxID:</td>
        <td style="color:#38bdf8; text-align:right; font-family:monospace; font-size:11px;">${txId.substring(0, 16)}...</td>
      </tr>`
          : ""
      }
    </table>

    <div style="margin-bottom:28px;">
      <h4 style="margin:0 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8;">Delivered Credentials / Keys:</h4>
      ${itemsHtml}
    </div>

    <div style="text-align:center; padding-top:16px; border-top:1px solid #1e2c44;">
      <a href="${lookupUrl}" style="display:inline-block; background-color:#6366f1; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; padding:12px 24px; border-radius:10px;">View Order Online & Warranty</a>
      <p style="color:#64748b; font-size:11px; margin-top:16px;">If you need assistance, simply reply to this email or visit our Order Lookup portal.</p>
    </div>
  </div>
</body>
</html>
    `;

    // 1. Try Resend API if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: toEmail,
            subject: `Your Order #${orderNumber} is Delivered! - ${productName}`,
            html,
          }),
        });
        if (res.ok) {
          console.log(`[EmailService] Sent delivery email via Resend to ${toEmail}`);
          return true;
        }
      } catch (resendErr) {
        console.warn("[EmailService] Resend API error:", resendErr);
      }
    }

    // 2. Try SMTP Transporter
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: fromEmail,
          to: toEmail,
          subject: `Your Order #${orderNumber} is Delivered! - ${productName}`,
          html,
        });
        console.log(`[EmailService] Sent delivery email via SMTP to ${toEmail}`);
        return true;
      } catch (smtpErr) {
        console.warn("[EmailService] SMTP error:", smtpErr);
      }
    }

    // Fallback: log delivery when no email credentials provided
    console.log(`[EmailService] (Simulated/No SMTP configured) Order #${orderNumber} delivered to ${toEmail}`);
    return false;
  }

  /**
   * Sends an alert email to the store owner
   */
  static async sendAdminAlert(subject: string, message: string): Promise<void> {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.CONTACT_NOTIFICATION_EMAIL;
    if (!adminEmail) return;

    const fromEmail = process.env.DEFAULT_FROM_EMAIL || "System Alert <alerts@choloklabs.tech>";

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: fromEmail,
          to: adminEmail,
          subject: `[Sub2Pay Alert] ${subject}`,
          text: message,
        });
      } catch (e) {
        console.warn("[EmailService] Could not send admin alert:", e);
      }
    }
  }
}
