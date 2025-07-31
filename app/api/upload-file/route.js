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
    const { fileName } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    // Generate a unique filename to prevent conflicts
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const filePath = `uploads/${uniqueFileName}`;

    // Create signed upload URL for direct client upload (bypasses Vercel limits)
    const { data, error } = await supabase.storage
      .from('myfile')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Signed upload URL created for:', filePath);

    // Create clean public URL for database storage (no tokens)
    const cleanPublicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/myfile/${filePath}`;
    
    console.log('Clean public URL for storage:', cleanPublicUrl);

    return NextResponse.json({
      signedUrl: data.signedUrl, // For direct upload (has token, but temporary)
      path: data.path,
      publicUrl: cleanPublicUrl, // For database storage (no token)
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
