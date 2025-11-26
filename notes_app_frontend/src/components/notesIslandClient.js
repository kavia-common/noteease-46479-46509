import NotesIsland from './NotesIsland.jsx';

export function mountNotesIsland() {
  const el = document.getElementById('notes-island-root');
  if (!el) return;
  const island = new NotesIsland({ target: el });
  island.mount(el);
}
