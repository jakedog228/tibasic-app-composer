import React from 'react';

// Panel for displaying generated TI-Basic code
export default function CodePreview({ generatedCode }) {
  return (
    <div className="code-preview">
      <h2>Generated TI-Basic Code</h2>
      <pre>{generatedCode}</pre>
    </div>
  );
}