import { google } from "googleapis";

interface UploadToDriveOptions {
    videoData: string; // Base64 data URL or raw base64
    accessToken: string;
    folderId?: string;
    fileName?: string;
}

interface DriveUploadResult {
    fileId: string;
    driveLink: string;
}

export async function uploadToDrive(
    options: UploadToDriveOptions
): Promise<DriveUploadResult> {
    const { videoData, accessToken, folderId, fileName } = options;

    // Create OAuth2 client with user's access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Extract base64 data from data URL if necessary
    let base64Data = videoData;
    if (videoData.startsWith("data:")) {
        const matches = videoData.match(/^data:[^;]+;base64,(.+)$/);
        if (matches) {
            base64Data = matches[1];
        }
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalFileName = fileName || `lumina-video-${timestamp}.mp4`;

    // Upload to Google Drive
    const fileMetadata: { name: string; parents?: string[] } = {
        name: finalFileName,
    };

    if (folderId) {
        fileMetadata.parents = [folderId];
    }

    const media = {
        mimeType: "video/mp4",
        body: require("stream").Readable.from(buffer),
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id, webViewLink",
    });

    const fileId = response.data.id!;
    const driveLink = response.data.webViewLink!;

    // Make the file accessible to anyone with the link
    await drive.permissions.create({
        fileId: fileId,
        requestBody: {
            role: "reader",
            type: "anyone",
        },
    });

    return {
        fileId,
        driveLink,
    };
}
