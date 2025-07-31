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

    const { data, error } = await supabase.storage
      .from('myfile')
      .createSignedUploadUrl(`uploads/${uniqueFileName}`);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Construct the public URL correctly
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/myfile/uploads/${uniqueFileName}`;

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      publicUrl,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
