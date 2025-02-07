import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Create new FormData with correct field name for SM.MS
    const smmsFormData = new FormData();
    smmsFormData.append('smfile', file);

    const response = await fetch("https://sm.ms/api/v2/upload", {
      method: "POST",
      headers: {
        'Authorization': process.env.SMMS_TOKEN || '',
      },
      body: smmsFormData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('SM.MS upload error:', data);
      throw new Error(data.message || 'Upload failed');
    }

    return NextResponse.json({
      success: true,
      data: {
        url: data.data.url,
        delete: data.data.delete,
        page: data.data.page,
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload image'
      },
      { status: 500 }
    );
  }
}