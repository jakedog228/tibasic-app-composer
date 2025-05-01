import React from 'react';
import MenuItem from './MenuItem';

// Top-level menu tree component
export default function MenuTree({
  item,
  onSelect,
  onAddMenu,
  onAddNote,
  onDelete,
  onMove,
  selected,
  appStructure,
}) {
  return (
    <div className="menu-tree">
      <MenuItem
        item={item}
        onSelect={onSelect}
        onAddMenu={onAddMenu}
        onAddNote={onAddNote}
        onDelete={onDelete}
        onMove={onMove}
        selected={selected}
        isRootMenu={true}
        appStructure={appStructure}
      />
    </div>
  );
}