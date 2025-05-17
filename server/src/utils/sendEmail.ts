import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendPasswordResetEmail = async ({
  email,
  name,
  resetLink,
}: {
  email: string
  name: string
  resetLink: string
}) => {
  const subject = "Reset your password - Auth System"

  const html = `
    <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2 style="color: #1a73e8;">YourAppName</h2>
      <p>Hi ${name || "there"},</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <a href="${resetLink}" 
         style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0;">
         Reset Password
      </a>
      <p>If you didn’t request this, you can safely ignore this email.</p>
      <p style="font-size: 14px; color: #888;">This link will expire in 15 minutes.</p>
      <hr style="margin: 30px 0;" />
      <p style="font-size: 12px; color: #aaa;">© ${new Date().getFullYear()} YourAppName. All rights reserved.</p>
    </div>
  `

  return await resend.emails.send({
    from: process.env.RESEND_FROM as string,
    to: email,
    subject,
    html,
  })
}
