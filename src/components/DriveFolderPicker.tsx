"use client";

import { useEffect, useState } from "react";
import useDrivePicker from "react-google-drive-picker";

interface DriveFolderPickerProps {
    accessToken: string;
    onFolderSelect: (folderId: string | null, folderName: string | null) => void;
    onClose: () => void;
}

export default function DriveFolderPicker({
    accessToken,
    onFolderSelect,
    onClose,
}: DriveFolderPickerProps) {
    const [openPicker] = useDrivePicker();
    const [hasOpened, setHasOpened] = useState(false);

    useEffect(() => {
        if (hasOpened) return;
        setHasOpened(true);

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY;

        if (!clientId || !apiKey) {
            console.error("Google client ID or API key not configured");
            onClose();
            return;
        }

        openPicker({
            clientId,
            developerKey: apiKey,
            token: accessToken,
            viewId: "FOLDERS",
            showUploadView: false,
            showUploadFolders: false,
            supportDrives: true,
            multiselect: false,
            setSelectFolderEnabled: true,
            callbackFunction: (data) => {
                if (data.action === "picked" && data.docs?.[0]) {
                    onFolderSelect(data.docs[0].id, data.docs[0].name);
                } else if (data.action === "cancel") {
                    onFolderSelect(null, null);
                }
                onClose();
            },
        });
    }, [accessToken, hasOpened, onClose, onFolderSelect, openPicker]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 animate-fade-in-scale">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Select a Folder
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Choose where to save your generated videos in Google Drive
                    </p>
                    <div className="animate-pulse text-purple-600">
                        Loading Google Drive Picker...
                    </div>
                </div>
            </div>
        </div>
    );
}
