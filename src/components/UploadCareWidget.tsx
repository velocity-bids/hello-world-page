import {
  FileUploaderRegular,
  UploadCtxProvider,
} from "@uploadcare/react-uploader";
import React, { useRef } from "react";
import "@uploadcare/react-uploader/core.css";

interface FileUploaderProps {
  onUploadComplete: (urls: string[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
}) => {
  const uploaderRef = useRef<UploadCtxProvider | null>(null);

  const handleChange = (fileGroup: any) => {
    console.log("🚀 ~ handleChange ~ fileGroup:", fileGroup);
    if (fileGroup?.cdnUrl) {
      const urls = fileGroup
        .files()
        .map((f: any) => `https://ucarecdn.com/${f.id}/`);
      console.log("🚀 ~ handleChange ~ urls:", urls);
      onUploadComplete(urls);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border">
      <h2 className="text-xl font-semibold mb-4">Vehicle Images</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Upload multiple images of your vehicle
      </p>
      <FileUploaderRegular
        pubkey="f6a66e6c2fd1eee14caf"
        imgOnly
        multiple
        onFileUploadSuccess={(props) => {
          console.log("🚀 ~ FileUploader ~ props:", props);
        }}
        apiRef={uploaderRef}
        onChange={handleChange}
      />
    </div>
  );
};
