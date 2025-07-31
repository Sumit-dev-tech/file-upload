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

    // Check file size (base64 is ~33% larger than original)
    const base64Size = fileData.length;
    const estimatedOriginalSize = Math.floor(base64Size * 0.75);
    const maxSize = 45 * 1024 * 1024; // 45MB limit for Vercel

    if (estimatedOriginalSize > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${Math.floor(maxSize / 1024 / 1024)}MB. Your file is approximately ${Math.floor(estimatedOriginalSize / 1024 / 1024)}MB.`,
        fileSize: estimatedOriginalSize,
        maxSize: maxSize
      }, { status: 413 });
    }

    // Generate a unique filename to prevent conflicts
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const filePath = `uploads/${uniqueFileName}`;

    // Create signed upload URL (server-side, not exposed to client)
    const { data, error } = await supabase.storage
      .from('myfile')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Signed upload URL created for:', filePath);

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData.split(',')[1], 'base64');

    // Upload file using the signed URL (server-side, URL never exposed to client)
    const uploadResponse = await fetch(data.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': fileType },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      console.error('Upload failed:', uploadResponse.status, uploadResponse.statusText);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    console.log('File uploaded successfully via server proxy');

    // Create clean public URL for database storage (no tokens)
    const cleanPublicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/myfile/${filePath}`;
    
    console.log('Clean public URL for storage:', cleanPublicUrl);

    return NextResponse.json({
      success: true,
      path: data.path,
      publicUrl: cleanPublicUrl, // For database storage (no token)
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
