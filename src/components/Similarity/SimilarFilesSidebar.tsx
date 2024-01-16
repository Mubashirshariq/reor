import { useEffect, useState } from "react";
import { DBEntry, DBResult } from "electron/main/database/LanceTableWrapper";
import ReactMarkdown from "react-markdown";
import DBResultPreview from "../File/DBResultPreview";
// import { DatabaseFields } from "electron/main/database/Schema";
// import { DatabaseFields } from "electron/main/database/Schema";

interface SimilarEntriesComponentProps {
  filePath: string;
  onFileSelect: (path: string) => void;
}

const SimilarEntriesComponent: React.FC<SimilarEntriesComponentProps> = ({
  filePath,
  onFileSelect,
}) => {
  const [similarEntries, setSimilarEntries] = useState<DBResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleNewFileOpen = async (path: string) => {
    setLoading(true);
    try {
      const searchResults = await performSearch(path);
      setSimilarEntries(searchResults);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (filePath: string): Promise<DBResult[]> => {
    const fileContent: string = await window.files.readFile(filePath);
    if (!fileContent) {
      console.error("File content is empty");
      return [];
    }
    const databaseFields = await window.database.getDatabaseFields();
    console.log("database fields: ", databaseFields);
    const searchResults: DBResult[] = await window.database.search(
      fileContent,
      20,
      `${databaseFields.NOTE_PATH} != ${filePath}`
    );
    // filter out the current file:
    console.log("NUMBER OF RESULTS: ", searchResults.length);
    // const filteredSearchResults = searchResults.filter(
    //   (result) => result.notepath !== path
    // );
    // console.log("NUMBER OF FILTERED RESULTS: ", filteredSearchResults.length);
    return searchResults;
  };

  useEffect(() => {
    if (filePath) {
      handleNewFileOpen(filePath);
    }
  }, [filePath]);

  useEffect(() => {
    const listener = async () => {
      console.log("received vector-database-update event");
      const searchResults = await performSearch(filePath);
      setSimilarEntries(searchResults);
    };

    window.ipcRenderer.receive("vector-database-update", listener);
    return () => {
      window.ipcRenderer.removeListener("vector-database-update", listener);
    };
  }, [filePath]);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden mt-0">
      {similarEntries.map((dbResult, index) => (
        <DBResultPreview
          key={index}
          dbResult={dbResult}
          onSelect={onFileSelect}
        />
      ))}
    </div>
  );
};

export default SimilarEntriesComponent;
