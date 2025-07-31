'use client';
import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e) => {
    const selectedFiles = e.target.files;
    handleFileSelect(selectedFiles);
  }, [handleFileSelect]);

  const removeFile = useCallback((fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to get secure file access URL
  const getSecureFileUrl = async (filePath, fileName) => {
    try {
      const response = await fetch(`/api/serve-file?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error('Failed to get secure file URL');
      }
      const { signedUrl } = await response.json();
      return signedUrl;
    } catch (error) {
      console.error('Error getting secure file URL:', error);
      return null;
    }
  };

  const simulateUpload = async (fileId) => {
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(prev => ({ ...prev, [fileId]: i }));
    }
  };

    const handleUpload = async () => {
    if (files.length === 0) return;
  
    setIsUploading(true);
  
    for (const file of files) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.id]: 10 }));
        
        // Get signed upload URL from Next.js API
        const res = await fetch('/api/upload-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to get upload URL' }));
          throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
        }

        const { signedUrl, publicUrl } = await res.json();

        console.log('Signed URL (for direct upload):', signedUrl);
        console.log('Public URL (for database storage):', publicUrl);
        
        setUploadProgress((prev) => ({ ...prev, [file.id]: 30 }));

        // Upload file directly to Supabase using the signed URL
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file.file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
        }

        setUploadProgress((prev) => ({ ...prev, [file.id]: 100 }));

        console.log('File uploaded successfully!');
        console.log('Storing clean URL in database:', publicUrl);

        // Save clean public URL to database (no tokens in this URL)
        try {
          const saveRes = await fetch('/api/file-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              file_url: publicUrl,
              file_name: file.name 
            }),
          });

          if (!saveRes.ok) {
            const errorText = await saveRes.text();
            console.warn('Failed to save file URL to database:', errorText);
            try {
              const errorData = JSON.parse(errorText);
              alert(`Database save failed: ${errorData.error}`);
            } catch {
              alert(`Database save failed: ${errorText}`);
            }
          } else {
            const result = await saveRes.json();
            console.log('File URL saved to database successfully:', result);
          }
        } catch (saveError) {
          console.warn('Error saving file URL to database:', saveError.message);
        }

      } catch (error) {
        console.error('Upload error:', error.message);
        setUploadProgress((prev) => ({ ...prev, [file.id]: 0 }));
        alert(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
  
    setIsUploading(false);
  };
  

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8 text-white">
          <h1 className="text-3xl font-bold mb-2">File Upload</h1>
          <p className="text-blue-100">Drag and drop your files here or click to browse</p>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop files here or{' '}
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="text-blue-600 hover:text-blue-500 font-semibold underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  All file types are supported
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Selected Files ({files.length})
              </h3>
              
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {/* File Preview/Icon */}
                    <div className="flex-shrink-0 mr-4">
                      {file.preview ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          <Image
                            src={file.preview}
                            alt={file.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      
                      {/* Upload Progress */}
                      {uploadProgress[file.id] !== undefined && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[file.id]}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {uploadProgress[file.id]}% uploaded
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="flex-shrink-0 ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                      disabled={isUploading}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Upload Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || files.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Upload Files
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;