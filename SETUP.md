# File Upload Setup Guide

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18 or higher

## Setup Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be set up (this may take a few minutes)

### 2. Configure Storage

1. In your Supabase dashboard, go to **Storage** in the left sidebar
2. Create a new bucket called `myfile`
3. Set the bucket to **Public** (so files can be accessed via URL)
4. Go to **Policies** and add the following policy for the `myfile` bucket:

```sql
-- Allow public access to read files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'myfile');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'myfile' AND auth.role() = 'authenticated');

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (bucket_id = 'myfile' AND auth.uid() = owner);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'myfile' AND auth.uid() = owner);
```

### 3. Get Environment Variables

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
3. Copy the **service_role** key (this is your `SUPABASE_SERVICE_ROLE_KEY`)

### 4. Configure Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

Replace the placeholder values with your actual Supabase credentials.

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the Development Server

```bash
npm run dev
```

## Usage

1. Open your browser to `http://localhost:3000`
2. Drag and drop files or click "browse" to select files
3. Click "Upload Files" to upload them to Supabase storage
4. Check the browser console to see the public URLs of uploaded files

## Troubleshooting

### "Unexpected token '<'" Error
This usually means the API endpoint is returning an HTML error page instead of JSON. Check that:
- Your environment variables are correctly set in `.env.local`
- The `.env.local` file is in the project root
- You've restarted the development server after adding environment variables

### "Supabase configuration is missing" Error
Make sure you've:
1. Created the `.env.local` file
2. Added both required environment variables
3. Restarted the development server

### Upload Fails
Check that:
1. The `myfile` bucket exists in your Supabase project
2. The bucket is set to public
3. The storage policies are correctly configured

## File Types Supported

The upload component supports:
- Images: `image/*`
- Documents: `.pdf`, `.doc`, `.docx`, `.txt`
- Videos: `.mp4`, `.mov`, `.avi`

## Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` should never be exposed to the client
- Only the `NEXT_PUBLIC_SUPABASE_URL` should be prefixed with `NEXT_PUBLIC_`
- Consider implementing authentication for production use 