/**
 * Sidebar → canvas drag-and-drop, driven by pointer events.
 *
 * The browser's built-in HTML5 drag-and-drop behaves differently across
 * browsers, Linux display servers and touch devices (drops that silently
 * never fire, custom data types stripped, no touch support). Pointer events
 * behave the same everywhere, so the sidebar starts a drag here, a ghost
 * follows the pointer, and the canvas — which registers itself as the drop
 * target — receives the component id and screen position on release.
 */

export interface DragState {
  componentId: string;
  label: string;
  x: number;
  y: number;
  overCanvas: boolean;
}

interface DropTarget {
  contains: (x: number, y: number) => boolean;
  drop: (componentId: string, x: number, y: number) => void;
  addAtCenter: (componentId: string) => void;
}

let state: DragState | null = null;
let target: DropTarget | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function subscribeDrag(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getDragState = () => state;

/** Called by the canvas on mount; returns an unregister function. */
export function registerDropTarget(t: DropTarget) {
  target = t;
  return () => {
    if (target === t) target = null;
  };
}

export function moveDrag(componentId: string, label: string, x: number, y: number) {
  state = { componentId, label, x, y, overCanvas: target?.contains(x, y) ?? false };
  emit();
}

/** Ends the drag; drops onto the canvas if released over it. Returns true if dropped. */
export function endDrag(x: number, y: number): boolean {
  const current = state;
  state = null;
  emit();
  if (!current || !target?.contains(x, y)) return false;
  target.drop(current.componentId, x, y);
  return true;
}

export function cancelDrag() {
  state = null;
  emit();
}

/** Click / keyboard fallback: place the component in the middle of the visible canvas. */
export function addComponentAtCenter(componentId: string) {
  target?.addAtCenter(componentId);
}
