import React from 'react';

// Modal dialog for importing TI-Basic code
export default function ImportModal({
  importCode,
  onChangeCode,
  onFileChange,
  onCancel,
  onImport,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Import TI-Basic Code</h2>
        <p>Paste your TI-Basic code below or select a file:</p>
        <div className="file-input">
          <input type="file" accept=".tibasic" onChange={onFileChange} />
        </div>
        <textarea
          value={importCode}
          onChange={(e) => onChangeCode(e.target.value)}
          rows="15"
          placeholder="Paste TI-Basic code here..."
        />
        <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onImport}>Import</button>
        </div>
      </div>
    </div>
  );
}