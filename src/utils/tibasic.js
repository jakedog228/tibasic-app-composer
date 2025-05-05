/**
 * Utility functions for TI-Basic parsing and generation.
 */
// Text wrapping utility (simplified version of Python's textwrap)
export function wrapText(text, width) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word.length <= width ? word : word.substring(0, width);
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [''];
}

// Generate TI-Basic code from the app structure
export function generateTIBasicCode(appStructure) {
  // Adapted from App_old.js
  const app = {
    chars_per_line: appStructure.chars_per_line,
    lines_per_screen: appStructure.lines_per_screen,
    max_items_per_menu: appStructure.max_items_per_menu,
    pages: {},
    page_order: [],
    next_index: 0,
    max_pages: 26 * 26,
    root_label: null,
    quit_label: null,
    _generate_label: function() {
      if (this.next_index >= this.max_pages) {
        throw new Error(`Too many pages: exceeded ${this.max_pages} unique labels.`);
      }
      const idx = this.next_index;
      const first = String.fromCharCode(65 + Math.floor(idx / 26));
      const second = String.fromCharCode(65 + (idx % 26));
      const label = `${first}${second}`;
      this.next_index += 1;
      return label;
    },
    // Add a raw TI-Basic code block (direct injection)
    add_code: function(parent_label, name, content) {
      const parent = this.pages[parent_label];
      if (!parent || parent.type !== 'menu') {
        throw new Error(`Parent ${parent_label} is not a valid menu`);
      }
      const nav_count = 1;
      const potential_count = parent.entries.length + 1 + nav_count;
      if (potential_count > 9) {
        throw new Error("Menu cannot have more than 9 options (incl. navigation)");
      }
      const label = this._generate_label();
      this.pages[label] = { type: 'code', label, content, parent_label };
      parent.entries.push({ name, target_label: label });
      this.page_order.push(label);
      return label;
    },
    add_menu: function(title, parent_label = null) {
      const label = this._generate_label();
      const menu = { label, title, entries: [], parent_label };
      this.pages[label] = { type: 'menu', ...menu };
      this.page_order.push(label);
      if (parent_label === null && this.root_label === null) {
        this.root_label = label;
        const quit_label = this._generate_label();
        this.pages[quit_label] = { type: 'quit', label: quit_label };
        this.quit_label = quit_label;
        this.page_order.push(quit_label);
      }
      return label;
    },
    add_submenu: function(parent_label, name, submenu_title) {
      const parent = this.pages[parent_label];
      if (!parent || parent.type !== 'menu') {
        throw new Error(`Parent ${parent_label} is not a valid menu`);
      }
      const nav_count = 1;
      const potential_count = parent.entries.length + 1 + nav_count;
      if (potential_count > 9) {
        throw new Error("Menu cannot have more than 9 options (incl. navigation)");
      }
      const submenu_label = this.add_menu(submenu_title, parent_label);
      parent.entries.push({ name, target_label: submenu_label });
      return submenu_label;
    },
    add_note: function(parent_label, name, content) {
      const parent = this.pages[parent_label];
      if (!parent || parent.type !== 'menu') {
        throw new Error(`Parent ${parent_label} is not a valid menu`);
      }
      const nav_count = 1;
      const potential_count = parent.entries.length + 1 + nav_count;
      if (potential_count > 9) {
        throw new Error("Menu cannot have more than 9 options (incl. navigation)");
      }
      const label = this._generate_label();
      const paragraphs = [];
      // Split content into sections on triple line breaks (hard page breaks)
      const screenSections = content.split(/\n{3,}/);
      for (let i = 0; i < screenSections.length; i++) {
        const section = screenSections[i];
        // Within each section, split on double line breaks (pause markers)
        const pauseSections = section.split(/\n{2}/);
        for (let j = 0; j < pauseSections.length; j++) {
          const pauseSection = pauseSections[j];
          const lines = pauseSection.split(/\n/);
          const wrappedLines = [];
          for (const line of lines) {
            if (line.trim() === '') {
              wrappedLines.push('');
            } else {
              const wrapped = wrapText(line, this.chars_per_line);
              wrappedLines.push(...wrapped);
            }
          }
          // push paragraph lines
          paragraphs.push(wrappedLines);
          // between pauseSections, insert a pause marker
          if (j < pauseSections.length - 1) {
            paragraphs.push('__PAUSE__');
          }
        }
        // between screenSections, insert a hard break marker
        if (i < screenSections.length - 1) {
          paragraphs.push('__TRIPLE_BREAK__');
        }
      }
      // Register the note page with its parent for navigation
      this.pages[label] = { type: 'note', label, content: paragraphs, parent_label };
      // Add this note as a menu entry under its parent
      parent.entries.push({ name, target_label: label });
      // Record order for rendering
      this.page_order.push(label);
      return label;
    },
    render: function() {
      // Assume a Python-like rendering: build string
      let output = '';
      for (const label of this.page_order) {
        const page = this.pages[label];
        output += `Lbl ${label}\n`;
        if (page.type === 'menu') {
          output += `:ClrHome\n`;
          const parts = [`"${page.title}"`];
          for (const entry of page.entries) {
            parts.push(`"${entry.name}"`, entry.target_label);
          }
          if (page.label !== this.root_label) {
            parts.push(`"Back"`, page.parent_label);
          }
          if (page.label === this.root_label) {
            parts.push(`"Quit"`, this.quit_label);
          }
          output += `:Menu(${parts.join(',')})\n\n`;
        } else if (page.type === 'code') {
          // Inject raw TI-Basic code block
          const rawLines = page.content.replace(/\r\n?/g, '\n').split('\n');
          for (const line of rawLines) {
            if (line.trim() === '') continue;
            output += line.startsWith(':') ? `${line}\n` : `:${line}\n`;
          }
          // After code block, return to parent menu
          output += `:Goto ${page.parent_label}\n\n`;
        } else if (page.type === 'note') {
          output += `:ClrHome\n`;
          // Render note content with pauses and page breaks
          let lineCount = 0;
          const items = page.content;
          for (const item of items) {
            if (item === '__PAUSE__') {
              output += `:Pause ""\n`;
              lineCount = 0;
              continue;
            }
            if (item === '__TRIPLE_BREAK__') {
              output += `:Pause ""\n:ClrHome\n`;
              lineCount = 0;
              continue;
            }
            if (Array.isArray(item)) {
              for (const line of item) {
                // paginate overflow: pause only (no clear)
                if (lineCount >= this.lines_per_screen) {
                  output += `:Pause ""\n`;
                  lineCount = 0;
                }
                output += `:Disp "${line}"\n`;
                lineCount += 1;
              }
            }
          }
          // extra pause before returning to parent menu
          output += `:Pause ""\n`;
          output += `:Goto ${page.parent_label}\n\n`;
        } else if (page.type === 'quit') {
          output += `:Stop\n\n`;
        }
      }
      return output.trim();
    }
  };
  // Build pages recursively
  function buildAppRecursive(item, parentLabel = null) {
    try {
      if (item.type === 'menu') {
        const label = parentLabel === null ? app.add_menu(item.title) : app.add_submenu(parentLabel, item.title, item.title);
        if (item.children) {
          for (const child of item.children) {
            buildAppRecursive(child, label);
          }
        }
      } else if (item.type === 'note') {
        if (parentLabel !== null) {
          app.add_note(parentLabel, item.title, item.content || '');
        }
      } else if (item.type === 'code') {
        if (parentLabel !== null) {
          app.add_code(parentLabel, item.title, item.content || '');
        }
      }
    } catch (error) {
      console.error(`Error processing item "${item.title}":`, error);
    }
  }
  buildAppRecursive(appStructure.root);
  try {
    return app.render();
  } catch (error) {
    console.error("Error during code rendering:", error);
    return `Error generating code: ${error.message}`;
  }
}

// Parse TI-Basic code into the app structure
export function parseBasicCode(code) {
  // Adapted from App_old.js parseBasicCode
  try {
    const pages = code.split(/\n\s*\n/).filter(page => page.trim() !== '');
    const pageMap = {};
    const menuPages = [];
    let quitPage = null;
    pages.forEach(page => {
      const lines = page.split('\n');
      if (lines.length < 2) return;
      const labelMatch = lines[0].match(/Lbl\s+([A-Z]{2})/);
      if (!labelMatch) return;
      const label = labelMatch[1];
      if (lines[1].includes(':ClrHome') && lines[2] && lines[2].includes(':Menu(')) {
        const menuContent = lines[2].replace(':Menu(', '').replace(')', '');
        const menuParts = menuContent.split(',');
        const title = menuParts[0].replace(/^"(.+)"$/, '$1');
        const entries = [];
        let parentLabel = null;
        for (let i = 1; i < menuParts.length; i += 2) {
          const name = menuParts[i].replace(/^"(.+)"$/, '$1');
          const targetLabel = menuParts[i + 1];
          if (name === 'Back') { parentLabel = targetLabel; }
          if (name !== 'Back' && name !== 'Quit') {
            entries.push({ name, targetLabel });
          }
        }
        menuPages.push({ label, title, entries, parentLabel });
        pageMap[label] = { type: 'menu', label, title, entries, parentLabel };
      } else if (lines[1].includes(':ClrHome') && lines.some(l => l.includes(':Disp '))) {
        let parentLabel = null;
        for (const l of lines) {
          const m = l.match(/:Goto\s+([A-Z]{2})/);
          if (m) { parentLabel = m[1]; break; }
        }
        const displayLines = [];
        const sections = [];
        let isNewSection = false;
        for (let i = 2; i < lines.length; i++) {
          const l = lines[i];
          const dispMatch = l.match(/:Disp\s+"(.+)"/);
          if (dispMatch) {
            displayLines.push(dispMatch[1]);
          } else if (l.includes(':Pause ""')) {
            const nextIsClr = i + 1 < lines.length && lines[i + 1].trim() === ':ClrHome';
            if (displayLines.length) {
              sections.push(displayLines.join('\n') + (nextIsClr ? '\n' : ''));
              displayLines.length = 0;
            }
            if (nextIsClr) {
              i++;  // Skip the next line (ClrHome)
            }
          }
        }
        if (displayLines.length) { sections.push(displayLines.join('\n')); }
        const content = sections.join('\n\n');
        pageMap[label] = { type: 'note', label, content, parentLabel };
      } else if (lines[1].includes(':Stop')) {
        // Quit page
        quitPage = { label };
        pageMap[label] = { type: 'quit', label };
      } else {
        // Unrecognized page structure: treat as raw code block
        // Find parent via any Goto statement
        let parentLabel = null;
        for (const l of lines) {
          const m = l.match(/:Goto\s+([A-Z]{2})/);
          if (m) { parentLabel = m[1]; break; }
        }
        // Drop the label line and capture raw TI-Basic lines
        let rawLines = lines.slice(1);
        // If the final line is a navigation Goto, remove it
        if (rawLines.length > 0 && /^:Goto\s+[A-Z]{2}$/.test(rawLines[rawLines.length - 1].trim())) {
          rawLines.pop();
        }
        // Strip leading colons for editor consistency
        const stripped = rawLines.map(l => (l.startsWith(':') ? l.slice(1) : l));
        const content = stripped.join('\n');
        pageMap[label] = { type: 'code', label, content, parentLabel };
      }
    });
    const rootMenu = menuPages.find(p => !p.parentLabel);
    if (!rootMenu) throw new Error('Root menu not found');
    function buildTree(menuLabel) {
      const menu = pageMap[menuLabel]; if (!menu || menu.type !== 'menu') return null;
      const node = { id: `item-${menuLabel}`, title: menu.title, type: 'menu', children: [] };
      for (const e of menu.entries) {
        const tgt = pageMap[e.targetLabel];
        if (tgt) {
          if (tgt.type === 'menu') {
            const child = buildTree(e.targetLabel);
            if (child) node.children.push(child);
          } else if (tgt.type === 'note') {
            node.children.push({ id: `item-${e.targetLabel}`, title: e.name, type: 'note', content: tgt.content });
          } else if (tgt.type === 'code') {
            node.children.push({ id: `item-${e.targetLabel}`, title: e.name, type: 'code', content: tgt.content });
          }
        }
      }
      return node;
    }
    const root = buildTree(rootMenu.label);
    if (!root) throw new Error('Failed to build tree');
    root.id = 'root';
    let maxId = 0;
    function walk(n) { if (n.id!== 'root') { const m = n.id.match(/item-(\d+)/); if (m) maxId = Math.max(maxId, +m[1]); } n.children && n.children.forEach(walk); }
    walk(root);
    return { chars_per_line: 26, lines_per_screen: 9, max_items_per_menu: 8, root, nextId: maxId+1, validTokens: [], invalidTokensMap: {} };
  } catch (e) {
    console.error('Error parsing TI-Basic code:', e);
    return null;
  }
}

// Parse a Menu(...) code snippet
export function parseMenuCode(code) {
  const menuMatch = code.match(/:Menu\(([^)]+)\)/);
  if (!menuMatch) return null;
  const menuParams = menuMatch[1].split(',');
  const title = menuParams[0].replace(/^"(.+)"$/, '$1');
  const options = [];
  for (let i = 1; i < menuParams.length; i += 2) {
    if (i + 1 < menuParams.length) {
      const name = menuParams[i].replace(/^"(.+)"$/, '$1');
      const label = menuParams[i+1].trim();
      options.push({ name, label });
    }
  }
  return { title, options };
}

// Parse a note code snippet (Disp, Pause, etc.)
export function parseNoteCode(code) {
  const lines = code.split('\n');
  const displayItems = [];
  let skipNextClrHome = true;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('Lbl ') || (skipNextClrHome && line === ':ClrHome')) {
      skipNextClrHome = false;
      continue;
    }
    const dispMatch = line.match(/:Disp\s+"(.+)"/);
    if (dispMatch) { displayItems.push({ type: 'text', content: dispMatch[1] }); continue; }
    if (line === ':Pause ""') {
      let hasClrHome = false;
      if (i+1 < lines.length && lines[i+1].trim() === ':ClrHome') { hasClrHome = true; i++; }
      displayItems.push({ type: hasClrHome ? 'pauseAndClear' : 'pause' });
      continue;
    }
    if (line === ':ClrHome') { displayItems.push({ type: 'clear' }); continue; }
    if (line.startsWith(':Goto ')) { break; }
  }
  return displayItems;
}

// Identify invalid tokens within note content given a list of valid tokens
export function findInvalidTokens(content, validTokens, forbidSpecial = true) {
  if (!validTokens || validTokens.length === 0) { return []; }
  const validSet = new Set(validTokens);
  const tokenRegex = /[^\w\s]+|->|>[A-Za-z]+/g;
  const matches = content.match(tokenRegex) || [];
  const invalid = [];
  for (const tok of matches) {
    if (!tok.trim()) continue;
    if (validSet.has(tok)) continue;
    let isValidCombo = true;
    let rem = tok;
    while (rem.length > 0 && isValidCombo) {
      let found = false;
      for (const vt of validSet) {
        if (rem.startsWith(vt)) { rem = rem.slice(vt.length); found = true; break; }
      }
      if (!found) { isValidCombo = false; }
    }
    if (!isValidCombo) invalid.push(tok);
  }
  // Optionally forbid raw quotes/backslashes (only when forbidSpecial=true)
  if (forbidSpecial) {
    const special = Array.from(new Set((content.match(/["\\]/g) || [])));
    invalid.push(...special);
  }
  // Deduplicate and return
  return Array.from(new Set(invalid));
}