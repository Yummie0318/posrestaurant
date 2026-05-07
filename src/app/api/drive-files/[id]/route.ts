import { NextRequest } from 'next/server';
import { streamDriveFile } from '@/lib/google-drive';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { stream, mimeType, fileName } = await streamDriveFile(id);
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
