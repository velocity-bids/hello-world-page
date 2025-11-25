import {
  FileUploaderInline,
  UploadCtxProvider,
} from "@uploadcare/react-uploader";
import React, { useRef, useState } from "react";
import "@uploadcare/react-uploader/core.css";
import { toast } from "sonner";

interface FileUploaderProps {
  onUploadComplete: (urls: string[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
}) => {
  const uploaderRef = useRef<UploadCtxProvider | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleChange = async (fileGroup: any) => {
    console.log("🚀 ~ handleChange ~ fileGroup:", fileGroup);
    
    if (!fileGroup) return;

    try {
      // Wait for all files to complete uploading
      const allFiles = fileGroup.files();
      console.log("🚀 ~ handleChange ~ allFiles:", allFiles);
      
      if (allFiles && allFiles.length > 0) {
        // Collect all successful upload URLs
        const urls: string[] = [];
        
        for (const file of allFiles) {
          // Wait for each file to complete if needed
          if (file.cdnUrl) {
            urls.push(file.cdnUrl);
          } else if (file.uuid) {
            // Construct URL from UUID
            urls.push(`https://ucarecdn.com/${file.uuid}/`);
          }
        }
        
        console.log("🚀 ~ handleChange ~ collected urls:", urls);
        
        if (urls.length > 0) {
          setUploadedUrls(urls);
          onUploadComplete(urls);
          toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded successfully`);
        }
      }
    } catch (error) {
      console.error("Error processing uploads:", error);
      toast.error("Failed to process uploaded images");
    }
  };

  return (
    <FileUploaderInline
      pubkey={"f6a66e6c2fd1eee14caf"}
      imgOnly
      multiple
      apiRef={uploaderRef}
      onChange={handleChange}
    />
  );
};
