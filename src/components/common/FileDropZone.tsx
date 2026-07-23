import { FileJson, RefreshCw, UploadCloud } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';

interface FileDropZoneProps {
  fileName: string;
  loading: boolean;
  error: string | null;
  onFile: (file: File) => Promise<void>;
  onReset: () => Promise<void>;
}

export function FileDropZone({
  fileName,
  loading,
  error,
  onFile,
  onReset,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = (file: File | undefined) => {
    if (file) void onFile(file);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="file-loader">
      <div
        className={`file-loader__drop ${dragActive ? 'is-dragging' : ''}`}
        onDragEnter={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <FileJson size={18} aria-hidden="true" />
        <div className="file-loader__meta">
          <span>DATASET ACTIVO</span>
          <strong title={fileName}>{fileName}</strong>
          {error && <small role="alert">{error}</small>}
        </div>
        <button
          className="tactical-button"
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud size={16} aria-hidden="true" />
          {loading ? 'PROCESANDO' : 'CARGAR JSON'}
        </button>
        <button
          className="icon-button"
          type="button"
          title="Restaurar JSON de muestra"
          aria-label="Restaurar JSON de muestra"
          disabled={loading}
          onClick={() => void onReset()}
        >
          <RefreshCw size={16} aria-hidden="true" />
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
