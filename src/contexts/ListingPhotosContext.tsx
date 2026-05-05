import { createContext, useContext, useState, ReactNode } from "react";

interface ListingPhotosContextValue {
  files: File[];
  setFiles: (files: File[]) => void;
  previews: string[];
}

const ListingPhotosContext = createContext<ListingPhotosContextValue | undefined>(undefined);

export const ListingPhotosProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFilesState] = useState<File[]>([]);

  // Keep stable object URL previews — revoke old ones on update
  const [previews, setPreviews] = useState<string[]>([]);

  const setFiles = (nextFiles: File[]) => {
    // Revoke old object URLs to avoid memory leaks
    previews.forEach((p) => URL.revokeObjectURL(p));
    const nextPreviews = nextFiles.map((f) => URL.createObjectURL(f));
    setFilesState(nextFiles);
    setPreviews(nextPreviews);
  };

  return (
    <ListingPhotosContext.Provider value={{ files, setFiles, previews }}>
      {children}
    </ListingPhotosContext.Provider>
  );
};

export const useListingPhotos = () => {
  const ctx = useContext(ListingPhotosContext);
  if (!ctx) throw new Error("useListingPhotos must be used inside ListingPhotosProvider");
  return ctx;
};
