import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import global app styles
import './App.css';
import useAppLogic from './hooks/useAppLogic';
import MenuTree from './components/MenuTree';
import EditorPanel from './components/EditorPanel';
import CalculatorScreen from './components/CalculatorScreen';
import CodePreview from './components/CodePreview';
import ImportModal from './components/ImportModal';

function App() {
  // Theme state for light/dark mode, persisted in localStorage
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setTheme('dark');
    } else if (saved === 'light') {
      setTheme('light');
    } else {  // if not set, check system preference
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      setTheme(isDarkMode ? 'light' : 'dark');
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.classList.toggle('dark-mode', theme === 'dark');
  }, [theme]);
  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  
  const {
    appStructure,
    generatedCode,
    selectedItem,
    editingContent,
    importModalOpen,
    importCode,
    lineBreakInfo,
    onSelect,
    addItem,
    deleteItem,
    moveItem,
    updateItem,
    handleContentChange,
    handleImport,
    handleImportFile,
    handleExport,
    setImportModalOpen,
    setImportCode,
  } = useAppLogic();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <div className="app-header">
          <div className="header-content">
            <h1>TI-Basic App Composer</h1>
            <p className="app-description">A drag‑and‑drop web-application for assembling multi‑module TI‑Basic programs for Texas Instruments graphing calculators.</p>
          </div>
          <div className="settings">
            {/* TODO: add settings inputs for chars_per_line, lines_per_screen, max_items_per_menu */}
          </div>
          <div className="import-export">
            <button onClick={() => setImportModalOpen(true)}>Load File</button>
            <button onClick={handleExport}>Save As</button>
          </div>
        </div>

        <div className="main-content">
          <div className="app-structure">
            <h2>App Structure</h2>
            <MenuTree
              item={appStructure.root}
              onSelect={onSelect}
              onAddMenu={(id) => addItem(id, 'menu')}
              onAddNote={(id) => addItem(id, 'note')}
              onAddCode={(id) => addItem(id, 'code')}
              onDelete={deleteItem}
              onMove={moveItem}
              selected={selectedItem ? selectedItem.id : null}
              appStructure={appStructure}
            />
          </div>

          <EditorPanel
            selectedItem={selectedItem}
            editingContent={editingContent}
            onTitleChange={(title) => updateItem(selectedItem.id, { title })}
            onContentChange={handleContentChange}
            lineBreakInfo={lineBreakInfo}
          />

          <div className="screen-preview">
            <h2>Calculator Preview</h2>
            <CalculatorScreen
              selectedItem={selectedItem}
              appStructure={appStructure}
              content={editingContent}
              generatedCode={generatedCode}
            />
            {/* Token validation warning for unrecognized tokens in notes or code */}
            {selectedItem && (selectedItem.type === 'note' || selectedItem.type === 'code') &&
              appStructure.invalidTokensMap[selectedItem.id] &&
              appStructure.invalidTokensMap[selectedItem.id].length > 0 && (
              <div className="token-warning">
                <div className="warning-title">Unrecognized Tokens Detected</div>
                <div className="warning-message">
                  The following tokens are not recognized and may not render correctly in the calculator preview:
                </div>
                <ul className="invalid-token-list">
                  {appStructure.invalidTokensMap[selectedItem.id].map((tok, idx) => (
                    <li key={idx}><code>{tok}</code></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <CodePreview generatedCode={generatedCode} />
        </div>

        {importModalOpen && (
          <ImportModal
            importCode={importCode}
            onChangeCode={setImportCode}
            onFileChange={handleImportFile}
            onCancel={() => setImportModalOpen(false)}
            onImport={handleImport}
          />
        )}

        {/* Theme toggle button with icon */}
        <div className="theme-toggle">
          <button
            className="theme-toggle-button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <span className="theme-toggle-icon sun-icon"></span>
            ) : (
              <span className="theme-toggle-icon moon-icon"></span>
            )}
          </button>
        </div>

        <div className="source-link">
          Source code & documentation:
          <a href="https://github.com/jakedog228/tibasic-app-composer"
             target="_blank"
             rel="noopener noreferrer">
            https://github.com/jakedog228/tibasic-app-composer
          </a>
        </div>

      </div>
    </DndProvider>
  );
}

export default App;