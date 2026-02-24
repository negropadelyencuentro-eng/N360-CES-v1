import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker de pdfjs — usar CDN para no agregar peso al bundle
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function PDFViewer({ url, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors active:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm">Volver</span>
        </button>

        {numPages && (
          <span className="text-zinc-400 text-sm">
            {pageNumber} / {numPages}
          </span>
        )}

        {/* Descargar */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-white transition-colors active:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center py-4 px-2">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Cargando PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-zinc-400 text-sm">No se pudo cargar el PDF.</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
              Abrir en Safari
            </a>
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          className="w-full"
        >
          {Array.from({ length: numPages || 0 }, (_, i) => (
            <Page
              key={`page_${i + 1}`}
              pageNumber={i + 1}
              width={Math.min(window.innerWidth - 16, 600)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="mb-3 rounded-lg overflow-hidden shadow-lg"
              loading=""
            />
          ))}
        </Document>
      </div>

      {/* Navegación por páginas — solo si hay más de 1 */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-6 py-3 border-t border-zinc-800 bg-black flex-shrink-0" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 disabled:opacity-30 active:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-sm text-zinc-400">{pageNumber} de {numPages}</span>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 disabled:opacity-30 active:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
