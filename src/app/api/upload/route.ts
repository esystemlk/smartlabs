import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
  const storageApiKey = process.env.BUNNY_STORAGE_API_KEY;
  const storageHostname = process.env.BUNNY_STORAGE_HOSTNAME;
  const cdnHostname = process.env.NEXT_PUBLIC_BUNNY_HOSTNAME;

  console.log("--- [Bunny.net Upload Debug] ---");
  console.log("Storage Zone Name:", storageZoneName ? `"${storageZoneName}"` : "NOT FOUND in .env");
  console.log("Storage Hostname:", storageHostname ? `"${storageHostname}"` : "NOT FOUND in .env");
  console.log("CDN Hostname:", cdnHostname ? `"${cdnHostname}"` : "NOT FOUND in .env");
  console.log("Storage API Key:", storageApiKey ? `Loaded (${storageApiKey.length} chars)` : "NOT FOUND in .env");
  
  if (!storageZoneName || !storageApiKey || !cdnHostname || !storageHostname) {
    console.error("[Bunny.net Upload Debug] Error: Credentials are not fully configured in the .env file.");
    return NextResponse.json({ error: 'Server configuration error: Bunny.net credentials are not set.' }, { status: 500 });
  }

  try {
    const { fileBase64, fileName, folder } = await request.json();

    if (!fileBase64 || !fileName || !folder) {
      console.error("[Bunny.net Upload Debug] Error: Request body missing fileBase64, fileName, or folder.");
      return NextResponse.json({ error: 'File data, name, or folder missing from request.' }, { status: 400 });
    }

    const validFolders = ['videos', 'documents', 'images'];
    if (!validFolders.includes(folder)) {
        console.error(`[Bunny.net Upload Debug] Error: Invalid folder specified: ${folder}`);
        return NextResponse.json({ error: 'Invalid folder specified.' }, { status: 400 });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    
    // Use the storage region hostname for the API endpoint
    const bunnyPath = `${folder}/${fileName}`;
    const apiUrl = `https://${storageHostname}/${storageZoneName}/${bunnyPath}`;
    console.log(`[Bunny.net Upload Debug] Attempting to upload to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': storageApiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Bunny.net Upload Debug] Upload failed with status: ${response.status}`);
      console.error(`[Bunny.net Upload Debug] Response from Bunny: ${errorText}`);
      throw new Error(`Failed to upload file to Bunny.net. Status: ${response.status}`);
    }

    // Use the public CDN hostname for the accessible URL
    const fileUrl = `https://${cdnHostname}/${bunnyPath}`;
    console.log(`[Bunny.net Upload Debug] Upload successful! Public URL: ${fileUrl}`);
    console.log("--- [Bunny.net Upload Debug End] ---");

    return NextResponse.json({ success: true, url: fileUrl });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[Bunny.net Upload Debug] Final catch block error: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
