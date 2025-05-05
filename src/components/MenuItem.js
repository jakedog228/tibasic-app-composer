import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {findTarget} from "../utils/treeUtils";

// Draggable and droppable menu/note item component
export default function MenuItem({ item, onSelect, onAddMenu, onAddNote, onAddCode, onDelete, onMove, selected, isRootMenu = false, appStructure }) {
  const [dropPosition, setDropPosition] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoveringInsideDisallowed, setIsHoveringInsideDisallowed] = useState(false);
  const itemRef = useRef(null);

  const currentItemCount = item.type === 'menu' && item.children ? item.children.length : 0;
  const maxItems = appStructure.max_items_per_menu;
  const isLimitReached = item.type === 'menu' && currentItemCount >= maxItems;
  const limitReachedTitle = `Maximum items (${maxItems}) reached for this menu`;

  const [{ isDragging }, drag] = useDrag({
    type: 'MENU_ITEM',
    item: isRootMenu ? null : { id: item.id, type: item.type },
    canDrag: !isRootMenu,
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
  });

  const [{ isOver, canDrop: canDropItem }, drop] = useDrop({
    accept: 'MENU_ITEM',
    canDrop: (draggedItem, monitor) => {
      if (!draggedItem || draggedItem.id === item.id) return false;
      if (monitor.isOver({ shallow: true })) {
        const rect = itemRef.current?.getBoundingClientRect();
        if (!rect) return false;
        const offset = monitor.getClientOffset();
        if (!offset) return false;
        const y = offset.y - rect.top;
        let pos = 'after';
        if (y < rect.height * 0.25) pos = 'before';
        else if (y > rect.height * 0.75) pos = 'after';
        else pos = item.type === 'menu' ? 'inside' : 'after';

        const isValidDrop = findTarget(appStructure.root, {
          draggedId: draggedItem.id,
          targetId: item.id,
          position: pos,
          maxItemsPerMenu: appStructure.max_items_per_menu
        });

        console.log(`canDrop: ${draggedItem.id} -> ${item.id} (${pos})`, isValidDrop);
        return !!isValidDrop;
      }
      return true;
    },
    hover: (draggedItem, monitor) => {
      const currPos = dropPosition;
      const currDisallowed = isHoveringInsideDisallowed;
      if (!monitor.isOver({ shallow: true }) || !itemRef.current) {
        if (currPos !== null) setDropPosition(null);
        if (currDisallowed) setIsHoveringInsideDisallowed(false);
        return;
      }
      const rect = itemRef.current.getBoundingClientRect();
      const offset = monitor.getClientOffset();
      if (!offset) {
        if (currPos !== null) setDropPosition(null);
        if (currDisallowed) setIsHoveringInsideDisallowed(false);
        return;
      }
      const y = offset.y - rect.top;
      let potential = 'after';
      let inside = false;
      if (y < rect.height * 0.25) potential = 'before';
      else if (y > rect.height * 0.75) potential = 'after';
      else if (item.type === 'menu') { potential = 'inside'; inside = true; }
      let targetPos = potential;
      // let targetDisallowed = false;
      // if (inside && isLimitReached) {
      //   targetPos = 'after';
      //   targetDisallowed = true;
      // }
      // if (targetPos !== currPos) setDropPosition(targetPos);
      // if (targetDisallowed !== currDisallowed) setIsHoveringInsideDisallowed(targetDisallowed);
      const isValidDrop = findTarget(appStructure.root, {
        draggedId: draggedItem.id,
        targetId: item.id,
        position: targetPos,
        maxItemsPerMenu: appStructure.max_items_per_menu
      });

      setDropPosition(p => (p === targetPos ? p : targetPos));
      setIsHoveringInsideDisallowed(inside && !isValidDrop);
    },
    drop: (draggedItem, monitor) => {
      if (monitor.didDrop() || !itemRef.current || !draggedItem) return;
      const rect = itemRef.current.getBoundingClientRect();
      const offset = monitor.getClientOffset();
      let finalPos = 'after';
      if (offset) {
        const y = offset.y - rect.top;
        if (y < rect.height * 0.25) finalPos = 'before';
        else if (y > rect.height * 0.75) finalPos = 'after';
        else finalPos = (item.type === 'menu' && !isLimitReached) ? 'inside' : 'after';
      }
      if (finalPos === 'inside' && isLimitReached) {
        setDropPosition(null);
        return;
      }
      onMove(draggedItem.id, item.id, finalPos);
      setDropPosition(null);
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver({ shallow: true }), canDrop: monitor.canDrop() })
  });

  useEffect(() => { if (!isOver) setDropPosition(null); }, [isOver]);

  const toggleCollapse = (e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); };
  const setRefs = (el) => { itemRef.current = el; drag(el); drop(el); };
  const isActive = selected === item.id;
  const hasChildren = item.type === 'menu' && item.children && item.children.length > 0;
  const dropClass = isOver && canDropItem && !isHoveringInsideDisallowed ? `drop-${dropPosition}` : '';

  return (
    <div
      ref={setRefs}
      className={`menu-item ${item.type} ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${dropClass} ${isHoveringInsideDisallowed ? 'cannot-drop-inside' : ''} ${isRootMenu ? 'root-menu' : ''} ${appStructure.invalidTokensMap[item.id] ? 'invalid-tokens' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect(item); }}
    >
      <div className="item-header">
        <span className="item-title">
          {!isRootMenu && hasChildren && (
            <span className={`collapse-toggle ${isCollapsed ? 'collapsed' : 'expanded'}`} onClick={toggleCollapse}>
              {isCollapsed ? '▶' : '▼'}
            </span>
          )}
          {item.title}
        </span>
        <div className="item-actions">
          {item.type === 'menu' && (
            <>
              <button className={`icon-button add-menu ${isLimitReached ? 'limit-reached' : ''}`} title={isLimitReached ? limitReachedTitle : 'Add Submenu'} onClick={(e) => { e.stopPropagation(); onAddMenu(item.id); }} disabled={isLimitReached}>
                📁+
              </button>
              <button className={`icon-button add-note ${isLimitReached ? 'limit-reached' : ''}`} title={isLimitReached ? limitReachedTitle : 'Add Note'} onClick={(e) => { e.stopPropagation(); onAddNote(item.id); }} disabled={isLimitReached}>
                📝+
              </button>
              <button className={`icon-button add-code ${isLimitReached ? 'limit-reached' : ''}`} title={isLimitReached ? limitReachedTitle : 'Add Code Block'} onClick={(e) => { e.stopPropagation(); onAddCode(item.id); }} disabled={isLimitReached}>
                💻+
              </button>
            </>
          )}
          {!isRootMenu && (
            <button className="icon-button delete" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
              🗑️
            </button>
          )}
        </div>
      </div>
      {hasChildren && !isCollapsed && (
        <div className={`item-children ${isRootMenu ? 'root-children' : ''}`} onClick={(e) => e.stopPropagation()}>
          {item.children.map(child => (
            <MenuItem
              key={child.id}
              item={child}
              onSelect={onSelect}
              onAddMenu={onAddMenu}
              onAddNote={onAddNote}
              onAddCode={onAddCode}
              onDelete={onDelete}
              onMove={onMove}
              selected={selected}
              isRootMenu={false}
              appStructure={appStructure}
            />
          ))}
        </div>
      )}
    </div>
  );
}