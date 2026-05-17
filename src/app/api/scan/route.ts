import { NextResponse } from 'next/server';
import { analyzeUrl } from '@/lib/engine';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Simulate network delay for real API calls to show loading state on frontend
    await new Promise(resolve => setTimeout(resolve, 2500));

    const result = await analyzeUrl(url);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
  }
}
