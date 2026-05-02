import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, company, inquiryType, message } = body;

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ message: 'Please fill in all required fields.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Please provide a valid email address.' }, { status: 400 });
    }

    const contactEmail = process.env.CONTACT_EMAIL ?? process.env.ADMIN_EMAIL ?? 'agenttrustprotocol@gmail.com';
    const fallbackEmail = 'dev@agenttrustprotocol.com';
    const subject = `New Contact Form Submission from ${firstName} ${lastName}`;

    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company ?? 'Not provided'}</p>
      <p><strong>Inquiry Type:</strong> ${inquiryType ?? 'Not specified'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
    `;

    const sentToPrimary = await emailService.sendEmail({ to: contactEmail, subject, html, replyTo: email });

    const sentToFallback = contactEmail === fallbackEmail
      ? true
      : await emailService.sendEmail({ to: fallbackEmail, subject: `[Copy] ${subject}`, html, replyTo: email });

    if (!sentToPrimary && !sentToFallback) {
      return NextResponse.json({ message: 'Unable to send your message right now. Please try again later.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Thanks for reaching out. Our team will respond soon.' });
  } catch (error) {
    console.error('Contact form API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
}
