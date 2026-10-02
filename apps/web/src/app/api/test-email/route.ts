import { NextResponse } from 'next/server';
import { EmailService } from '@/services/email-service';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to') || 'emcrelao05@gmail.com';

    try {
        const result = await EmailService.sendEmail({
            to,
            subject: 'COG App - Test Email Verification',
            html: `
                <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #2563eb; margin-top: 0;">Church of God Dasmariñas</h2>
                    <p style="font-size: 15px; line-height: 1.5;">
                        Hello! If you are reading this email, the <strong>Gmail SMTP email service is 100% active and working</strong>!
                    </p>
                    <p style="font-size: 14px; color: #64748b;">
                        All newly registered workers will now automatically receive their credentials and welcome notice.
                    </p>
                </div>
            `,
            text: 'Hello! Gmail SMTP email service is active and working!',
        });

        return NextResponse.json({
            success: true,
            message: `Email successfully sent to ${to}! Please check your Inbox and Spam folder.`,
            result,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.message || String(error),
        }, { status: 500 });
    }
}
