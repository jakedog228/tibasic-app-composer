import { useState, useEffect } from 'react';
import {
  parseBasicCode,
  generateTIBasicCode,
  findInvalidTokens,
  wrapText,
} from '../utils/tibasic';

// Custom hook managing application logic and state
export default function useAppLogic() {
  const [appStructure, setAppStructure] = useState({
    chars_per_line: 26,
    lines_per_screen: 9,
    max_items_per_menu: 8,
    root: { id: 'root', title: 'Main Menu', type: 'menu', children: [] },
    nextId: 1,
    validTokens: [],
    invalidTokensMap: {},
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [lineBreakInfo, setLineBreakInfo] = useState({});

  // Regenerate TI-Basic code whenever the structure changes
  useEffect(() => {
    try {
      const code = generateTIBasicCode(appStructure);
      setGeneratedCode(code);
    } catch (error) {
      console.error('Error generating TI-Basic code:', error);
      setGeneratedCode(`Error: ${error.message}`);
    }
  }, [appStructure]);

  // Load valid tokens XML on mount
  useEffect(() => {
    async function loadTokens() {
      try {
        const response = await fetch('/Tokens.xml');
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const tokens = new Set();
        const tokenElements = xmlDoc.getElementsByTagName('Token');
        for (let i = 0; i < tokenElements.length; i++) {
          const t = tokenElements[i].getAttribute('string');
          if (t && t.trim()) tokens.add(t);
          const alts = tokenElements[i].getElementsByTagName('Alt');
          for (let j = 0; j < alts.length; j++) {
            const alt = alts[j].getAttribute('string');
            if (alt && alt.trim()) tokens.add(alt);
          }
        }
        setAppStructure(prev => ({ ...prev, validTokens: Array.from(tokens) }));
      } catch (error) {
        console.error('Error loading Tokens.xml:', error);
      }
    }
    loadTokens();
  }, []);

  // Validate all notes when valid tokens are loaded or structure resets
  useEffect(() => {
    function validateAllNotes() {
      if (!appStructure.validTokens || appStructure.validTokens.length === 0) return;
      const invalidMap = {};
      const checkItem = (item) => {
        if (item.type === 'note' && item.content) {
          const invalid = findInvalidTokens(item.content, appStructure.validTokens);
          if (invalid.length) invalidMap[item.id] = invalid;
        } else if (item.children) {
          item.children.forEach(checkItem);
        }
      };
      if (appStructure.root) checkItem(appStructure.root);
      setAppStructure(prev => ({ ...prev, invalidTokensMap: invalidMap }));
    }
    validateAllNotes();
  }, [appStructure.validTokens]);

  // Select an item
  const onSelect = (item) => {
    setSelectedItem(item);
    if (item.type === 'note' && item.content != null) {
      setEditingContent(item.content);
    }
  };
  // Add a submenu or a note under a parent menu
  const addItem = (parentId, type) => {
    // Generate new ID
    const newId = `item-${appStructure.nextId}`;
    const newItem = {
      id: newId,
      title: type === 'menu' ? 'New Submenu' : 'New Note',
      type: type,
      children: type === 'menu' ? [] : null,
      content: type === 'note' ? 'Enter note content here...' : null,
    };
    // Insert into tree
    const updateTree = (node) => {
      if (node.id === parentId && node.type === 'menu') {
        return { ...node, children: [...(node.children||[]), newItem] };
      } else if (node.children) {
        return { ...node, children: node.children.map(updateTree) };
      }
      return node;
    };
    setAppStructure(prev => ({
      ...prev,
      nextId: prev.nextId + 1,
      root: updateTree(prev.root),
    }));
    setSelectedItem(newItem);
    if (type === 'note') setEditingContent(newItem.content);
  };
  // Delete an item from the structure
  const deleteItem = (itemId) => {
    const remove = (node) => {
      if (!node.children) return node;
      return {
        ...node,
        children: node.children
          .filter(c => c.id !== itemId)
          .map(remove)
      };
    };
    setAppStructure(prev => ({ ...prev, root: remove(prev.root) }));
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem(null);
      setEditingContent('');
    }
  };
  // Move or reorder an item via drag-and-drop
  const moveItem = (itemId, targetId, position = 'inside') => {
    if (itemId === targetId) return;
    // Remove item and get it
    let moved = null;
    const removeAndExtract = (node) => {
      if (!node.children) return node;
      const newChildren = [];
      for (const c of node.children) {
        if (c.id === itemId) {
          moved = c;
        } else {
          newChildren.push(removeAndExtract(c));
        }
      }
      return { ...node, children: newChildren };
    };
    const without = removeAndExtract(appStructure.root);
    if (!moved) return;
    // Find insertion point
    const findTarget = (node) => {
      if (node.id === targetId && node.type === 'menu' && position === 'inside') {
        return { parent: node, index: node.children.length };
      }
      if (node.children) {
        for (let i=0;i<node.children.length;i++) {
          const c = node.children[i];
          if (c.id === targetId) {
            const idx = position === 'before' ? i : i+1;
            return { parent: node, index: idx };
          }
          const found = findTarget(c);
          if (found) return found;
        }
      }
      return null;
    };
    const targetInfo = findTarget(without);
    if (!targetInfo) return;
    const { parent, index } = targetInfo;
    // Insert moved
    const insert = (node) => {
      if (node.id === parent.id) {
        const ch = [...node.children]; ch.splice(index, 0, moved);
        return { ...node, children: ch };
      } else if (node.children) {
        return { ...node, children: node.children.map(insert) };
      }
      return node;
    };
    setAppStructure(prev => ({ ...prev, root: insert(without) }));
  };
  // Update an item's properties
  const updateItem = (itemId, updates) => {
    const recurse = (node) => {
      if (node.id === itemId) {
        return { ...node, ...updates };
      } else if (node.children) {
        return { ...node, children: node.children.map(recurse) };
      }
      return node;
    };
    setAppStructure(prev => ({ ...prev, root: recurse(prev.root) }));
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem(prev => ({ ...prev, ...updates }));
    }
  };
  // Handle content editing in note editor
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setEditingContent(newContent);
    if (selectedItem && selectedItem.type === 'note') {
      updateItem(selectedItem.id, { content: newContent });
      const invalid = findInvalidTokens(newContent, appStructure.validTokens);
      setAppStructure(prev => {
        // Update invalidTokensMap: add if invalid tokens exist, remove entry if none
        const newInvalidMap = { ...prev.invalidTokensMap };
        if (invalid.length) {
          newInvalidMap[selectedItem.id] = invalid;
        } else {
          delete newInvalidMap[selectedItem.id];
        }
        return {
          ...prev,
          invalidTokensMap: newInvalidMap
        };
      });
      // Analyze line breaks
      const info = { wrappedLines: [], screenBreaks: [] };
      const lines = newContent.split(/\n{3,}/).map(p =>
        p.split(/\n{2}/).map(sp => sp.split(/\n/)).flat()
      ).flat();
      let lineCount = 0;
      let lineIdx = 0;
      const contentLines = newContent.split("\n");
      let charCount = 0;
      for (const para of lines) {
        const wrapped = wrapText(para, appStructure.chars_per_line);
        if (wrapped.length > 1) info.wrappedLines.push(lineIdx);
        lineCount += wrapped.length;
        if (lineCount >= appStructure.lines_per_screen) {
          info.screenBreaks.push(lineIdx);
          lineCount = 0;
        }
        charCount += para.length + 1;
        while (lineIdx < contentLines.length && charCount > contentLines.slice(0, lineIdx+1).join("\n").length) {
          lineIdx++;
        }
      }
      setLineBreakInfo(prev => ({ ...prev, [selectedItem.id]: info }));
    }
  };
  // Update application settings
  const updateSettings = (settings) => {
    setAppStructure(prev => ({ ...prev, ...settings }));
  };
  // Import TI-Basic code to rebuild structure
  const handleImport = () => {
    const newStruct = parseBasicCode(importCode);
    if (newStruct) {
      setAppStructure(newStruct);
      setSelectedItem(null);
      setEditingContent('');
      setImportModalOpen(false);
      setImportCode('');
    } else {
      alert('Failed to parse the TI-Basic code.');
    }
  };
  // Handle selecting a file for import
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImportCode(ev.target.result);
      reader.readAsText(file);
    }
  };
  // Export generated TI-Basic code to file
  const handleExport = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tibasic-app.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
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
  };
}