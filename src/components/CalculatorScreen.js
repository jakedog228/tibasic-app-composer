import React from 'react';
import { parseMenuCode, parseNoteCode } from '../utils/tibasic';

// Preview of the calculator screen for menu or note
export default function CalculatorScreen({
  selectedItem,
  appStructure,
  content,
  generatedCode,
}) {
  // Calculate font size based on fixed TI screen dimensions
  const FIXED_CHARS_PER_LINE = appStructure.chars_per_line;
  const FIXED_LINES_PER_SCREEN = appStructure.lines_per_screen;
  const availableWidth = 320 - 16;
  const availableHeight = 240 - 16;
  const fontSizeByWidth = availableWidth / FIXED_CHARS_PER_LINE;
  const fontSizeByHeight = availableHeight / (FIXED_LINES_PER_SCREEN * 1.2);
  const fontSize = Math.min(fontSizeByWidth, fontSizeByHeight);
  const screenStyle = { fontSize: `${fontSize}px`, lineHeight: '1.2' };

  // Helper to find the TI-Basic code section for the selected item
  const findCodeSection = () => {
    if (!selectedItem || !generatedCode) return null;
    let itemLabel = null;
    const sections = generatedCode.split(/\n\s*\n/);
    if (selectedItem.id === 'root') {
      itemLabel = sections[0]?.match(/Lbl ([A-Z]{2})/)?.[1] || null;
    } else if (selectedItem.type === 'menu') {
      for (const sec of sections) {
        if (sec.includes(`:Menu("${selectedItem.title}",`)) {
          const m = sec.match(/Lbl ([A-Z]{2})/);
          if (m) { itemLabel = m[1]; break; }
        }
      }
    } else if (selectedItem.type === 'note') {
      for (const sec of sections) {
        if (sec.includes(':Menu(') && sec.includes(`"${selectedItem.title}"`)) {
          const mm = sec.match(/:Menu\(([^)]+)\)/);
          if (mm) {
            const parts = mm[1].split(',');
            for (let i = 1; i < parts.length; i += 2) {
              if (parts[i].replace(/^"|"$/g, '') === selectedItem.title) {
                itemLabel = parts[i+1].trim(); break;
              }
            }
          }
          if (itemLabel) break;
        }
      }
    }
    if (!itemLabel) return null;
    return sections.map(sec => sec.trim()).find(sec => sec.startsWith(`Lbl ${itemLabel}`));
  };

  let screenContent;
  if (!selectedItem) {
    screenContent = <div className="screen-message">Select a menu or note to preview</div>;
  } else if (selectedItem.type === 'code') {
    screenContent = <div className="screen-message">[Full code emulation not possible]</div>;
  } else {
    const section = findCodeSection();
    if (!section) {
      screenContent = <div className="screen-message">Error: Code section not found</div>;
    } else if (selectedItem.type === 'menu') {
      const parsed = parseMenuCode(section);
      if (!parsed) {
        screenContent = <div className="screen-message">Error parsing menu code</div>;
      } else {
          screenContent = (
          <>
            {/* Truncate title to chars_per_line */}
            <div className="menu-title">
              {parsed.title.slice(0, FIXED_CHARS_PER_LINE)}
            </div>
            <div className="menu-options">
              {parsed.options.map((opt, i) => (
                <div key={i} className="menu-option">
                  {i + 1}:
                  {opt.name.slice(0, FIXED_CHARS_PER_LINE-2)} {/* minus 2 to account for the index */}
                </div>
              ))}
            </div>
          </>
        );
      }
    } else {
      const parsed = parseNoteCode(section);
      if (!parsed) {
        screenContent = <div className="screen-message">Error parsing note code</div>;
      } else {
        const elements = [];
        for (let i = 0; i < parsed.length; i++) {
          const itm = parsed[i];
          if (itm.type === 'text') {
            elements.push(<div key={i} className="note-line">{itm.content}</div>);
          } else if (itm.type === 'pause') {
            elements.push(<div key={i} className="paragraph-break"><div className="pause-indicator">Pause...</div></div>);
          } else if (itm.type === 'pauseAndClear') {
            elements.push(<div key={i} className="paragraph-break"><div className="pause-indicator clear-screen">Pause... [Clear Screen]</div></div>);
          } else if (itm.type === 'clear') {
            elements.push(<div key={i} className="paragraph-break"><div className="pause-indicator clear-screen">[Clear Screen]</div></div>);
          }
        }
        screenContent = <div className="note-content-preview">{elements}</div>;
      }
    }
  }

  return (
    <div className="calculator-screen" style={screenStyle}>
      {screenContent}
    </div>
  );
}