/**
 * Remove the node whose id === targetId from a tree and return
 *   { tree: <newRoot>, extracted: <removedNode | null> }.
 *
 * Both the returned tree and every modified branch are NEW objects
 * (no in‑place mutation) so React state updates stay predictable.
 */
export function removeAndExtract(node, targetId) {
  let extracted = null;

  const strip = (current) => {
    if (!current.children) return current;               // leaf

    const newChildren = [];
    for (const child of current.children) {
      if (child.id === targetId) {
        extracted = child;                               // pull it out
      } else {
        newChildren.push(strip(child));                  // recurse
      }
    }
    // Only recreate the object if something actually changed
    return newChildren === current.children
      ? current
      : { ...current, children: newChildren };
  };

  const newRoot = strip(node);
  return { tree: newRoot, extracted };
}

/**
 * Insert `item` as a child of the node whose id === parentId
 * at position `index` and return the NEW root.
 *
 * index === 0   -> first child
 * index === N   -> after the last existing child
 */
export function insertNode(node, parentId, index, item) {
  const add = (current) => {
    if (current.id === parentId) {
      const children = [...(current.children || [])];
      children.splice(index, 0, item);                   // immutable insert
      return { ...current, children };
    }
    if (current.children && current.children.length) {
      const newChildren = current.children.map(add);
      // only recreate the branch if any child changed
      if (newChildren !== current.children) {
        return { ...current, children: newChildren };
      }
    }
    return current;                                      // untouched branch
  };

  return add(node);
}

/**
 * Locate the parent menu and index where `itemId` should be inserted.
 * Returns { parent, index }  OR  null  when the move is illegal.
 */
export function findTarget(node, {
  draggedId,
  targetId,
  position,                     // 'before' | 'after' | 'inside'
  maxItemsPerMenu
}) {
  // 1. dropping directly *onto* the node
  if (node.id === targetId) {
    // 1a. inside the node itself
    if (position === 'inside') {
      if (node.type !== 'menu') return null;
      // Full menu? allow re‑ordering but no new children
      const alreadyThere = node.children?.some(c => c.id === draggedId);
      if (!alreadyThere && node.children.length >= maxItemsPerMenu) return null;

      return { parent: node, index: node.children.length };
    }
    // 1b. before/after the node → handled by the parent branch below
  }

  // 2. walk children
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // 2a. target is one of the direct children
      if (child.id === targetId) {
        if (position === 'inside' && child.type === 'menu') {
          // same logic as 1a but for the child
          const alreadyThere = child.children?.some(c => c.id === draggedId);
          if (!alreadyThere && child.children.length >= maxItemsPerMenu) return null;

          return { parent: child, index: child.children.length };
        }

        // before / after => insert in *node* at i / i+1
        const alreadyThere = node.children.some(c => c.id === draggedId);
        if (!alreadyThere && node.children.length >= maxItemsPerMenu) {
          return null; // would overflow sibling list
        }
        const idx = position === 'before' ? i : i + 1;
        return { parent: node, index: idx };
      }

      // 2b. deeper in the tree
      const found = findTarget(child, { draggedId, targetId, position, maxItemsPerMenu });
      if (found) return found;
    }
  }
  return null; // not found / illegal
}