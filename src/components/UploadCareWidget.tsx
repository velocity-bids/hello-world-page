import {
  FileUploaderInline,
  FileUploaderMinimal,
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
    <FileUploaderInline
      pubkey={"f6a66e6c2fd1eee14caf"}
      
      // multiple
      // multipleMin={1}
      imgOnly
      multiple
      onFileUploadSuccess={(props) => {
        console.log("🚀 ~ FileUploader ~ props:", props);
      }}
      apiRef={uploaderRef}
      onChange={handleChange}
    />
  );
};
