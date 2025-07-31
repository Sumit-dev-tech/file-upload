import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || ''
);

export async function POST(req) {
  try {
    // Check if environment variables are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is missing. Please check your environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { fileName, fileData, fileType } = body;

    if (!fileName || !fileData) {
      return NextResponse.json({ error: 'fileName and fileData are required' }, { status: 400 });
    }

    // Generate a unique filename to prevent conflicts
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const filePath = `uploads/${uniqueFileName}`;

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData.split(',')[1], 'base64');

    // Upload file directly to Supabase storage (server-side)
    const { data, error } = await supabase.storage
      .from('myfile')
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('File uploaded successfully:', data);

    // Construct a clean public URL (no tokens)
    const cleanPublicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/myfile/${filePath}`;
    
    console.log('Clean public URL:', cleanPublicUrl);

    return NextResponse.json({
      success: true,
      path: data.path,
      publicUrl: cleanPublicUrl, // For storage (no token)
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
