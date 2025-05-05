import React from 'react';

// Panel for editing selected menu or note
export default function EditorPanel({
  selectedItem,
  editingContent,
  onTitleChange,
  onContentChange,
  lineBreakInfo,
}) {
  return (
    <div className="item-editor">
      <h2>Editor</h2>
      {selectedItem ? (
        <div className="editor-form">
          <label>
            Title:
            <input
              type="text"
              value={selectedItem.title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </label>
          {selectedItem.type === 'note' && (
            <div className="note-content">
              <label>Content:</label>
              <textarea
                value={editingContent}
                onChange={onContentChange}
                rows="10"
              />
              {lineBreakInfo[selectedItem.id] && (
                <div className="line-break-info">
                  <div className="info-title">ℹ️ Line Break Information</div>
                  <ul className="info-list">
                    {lineBreakInfo[selectedItem.id].wrappedLines.length > 0 && (
                      <li>Text wrapped at {lineBreakInfo[selectedItem.id].wrappedLines.length} location(s).</li>
                    )}
                    {lineBreakInfo[selectedItem.id].screenBreaks.length > 0 && (
                      <li>Screen pauses at {lineBreakInfo[selectedItem.id].screenBreaks.length} location(s).</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          {selectedItem.type === 'code' && (
            <div className="code-content">
              <label>TI-Basic Code:</label>
              <textarea
                value={editingContent}
                onChange={onContentChange}
                rows="10"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="no-selection">
          <p>Select an item to edit or add a new one</p>
        </div>
      )}
    </div>
  );
}