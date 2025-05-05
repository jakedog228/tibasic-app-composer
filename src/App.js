import React from 'react';
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
    updateSettings,
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
          <h1>TI-Basic App Generator</h1>
          <div className="settings">
            {/* TODO: add settings inputs for chars_per_line, lines_per_screen, max_items_per_menu */}
          </div>
          <div className="import-export">
            <button onClick={() => setImportModalOpen(true)}>Import</button>
            <button onClick={handleExport}>Export</button>
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
            {/* Token validation warning for unrecognized tokens in notes */}
            {selectedItem && selectedItem.type === 'note' &&
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
      </div>
    </DndProvider>
  );
}

export default App;