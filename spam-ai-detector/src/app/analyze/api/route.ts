import SpamDetector from "@/index";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: 'Email content is required' },
        { status: 400 }
      );
    }

    if (email.length > 10000) {
      return NextResponse.json(
        { error: 'Email content too long (max 10,000 characters)' },
        { status: 400 }
      );
    }

    const detector = new SpamDetector();
    const result = await detector.checkSpam(email);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to analyze email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        isSpam: result.isSpam,
        reason: result.reason,
        confidence: result.confidence || 0.5,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('API Error...: ', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Spam AI Email Detector',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    description: 'This service analyzes email content to detect spam using GitHub Models and OpenAI.',
  });
}