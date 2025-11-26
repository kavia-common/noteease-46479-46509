import { getNotes, saveNotes, nowISO, formatTimeAgo } from "../utils/storage.js";

/**
 PUBLIC_INTERFACE
 Renders interactive notes UI. Intended to be mounted as an island via client:load.
*/
export default class NotesIsland {
  /** Root element container assigned by Astro via custom element usage. */
  constructor({ target, props = {} } = {}) {
    this.root = target || document.createElement('div');
    this.props = props;
    this.state = {
      notes: [],
      loading: true,
      query: '',
      sort: 'updated_desc', // or updated_asc, title_asc
      editing: null, // note object or null
      showModal: false,
    };

    // Read PUBLIC_* env vars if available for conditional UX flags (non-blocking)
    this.flags = {};
    try {
      // Astro exposes import.meta.env for PUBLIC_*
      this.flags.env = {
        nodeEnv: import.meta.env?.PUBLIC_NODE_ENV,
        features: import.meta.env?.PUBLIC_FEATURE_FLAGS,
      };
    } catch {
      this.flags.env = {};
    }

    this.init();
  }

  // PUBLIC_INTERFACE
  mount(container) {
    /** Mount the island into a provided container */
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.root);
    }
    this.render();
  }

  init() {
    // Load notes and render
    this.state.notes = getNotes();
    this.state.loading = false;

    // Initial render
    this.render();

    // Handle basic hash routes for creating new
    if (location.hash === '#new') {
      this.openEditor();
    }

    // Keyboard accessibility: "n" to add
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const input = this.root.querySelector('#search-input');
        if (input) {
          input.focus();
          input.select();
          e.preventDefault();
        }
      } else if (e.key.toLowerCase() === 'n' && !this.state.showModal) {
        this.openEditor();
      }
    });
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.render();
  }

  persist() {
    saveNotes(this.state.notes);
  }

  createId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  openEditor(note = null) {
    const isNew = !note;
    const now = nowISO();
    this.setState({
      editing: note ?? { id: this.createId(), title: '', content: '', createdAt: now, updatedAt: now },
      showModal: true,
    });
    setTimeout(() => {
      const titleEl = this.root.querySelector('#note-title');
      if (titleEl) titleEl.focus();
    }, 0);
    if (isNew) location.hash = '#new';
  }

  closeEditor() {
    this.setState({ showModal: false, editing: null });
    if (location.hash === '#new') history.replaceState(null, '', ' ');
  }

  saveEditing() {
    const titleEl = this.root.querySelector('#note-title');
    const contentEl = this.root.querySelector('#note-content');
    if (!titleEl || !contentEl) return;

    const title = titleEl.value.trim();
    const content = contentEl.value.trim();

    // Validate
    if (!title && !content) {
      this.closeEditor();
      return;
    }

    const now = nowISO();
    const { editing } = this.state;
    const updated = { ...editing, title, content, updatedAt: now };

    const existsIdx = this.state.notes.findIndex(n => n.id === updated.id);
    let notes;
    if (existsIdx >= 0) {
      notes = [...this.state.notes];
      notes[existsIdx] = updated;
    } else {
      notes = [updated, ...this.state.notes];
    }

    this.setState({ notes });
    this.persist();
    this.closeEditor();
  }

  deleteNote(id) {
    // Confirmation
    if (!confirm('Delete this note? This cannot be undone.')) return;
    const notes = this.state.notes.filter(n => n.id !== id);
    this.setState({ notes });
    this.persist();
  }

  filteredSortedNotes() {
    const { notes, query, sort } = this.state;
    const q = query.toLowerCase().trim();
    let list = !q
      ? notes.slice()
      : notes.filter(n =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q)
        );

    switch (sort) {
      case 'updated_asc':
        list.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        break;
      case 'title_asc':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return list;
  }

  noteItem(note) {
    const preview = (note.content || '').replace(/\n+/g, ' ').slice(0, 160);
    const el = document.createElement('div');
    el.className = 'card note-item';
    el.setAttribute('role', 'article');
    el.innerHTML = `
      <div>
        <h3 class="note-title">${note.title ? this.escape(note.title) : '(Untitled)'}</h3>
        <div class="note-meta">Updated ${this.escape(formatTimeAgo(note.updatedAt))}</div>
      </div>
      <div class="note-actions">
        <button class="btn btn-secondary" aria-label="Edit note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 21h4l11-11-4-4L4 17v4Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.08"></path>
          </svg>
          Edit
        </button>
        <button class="btn btn-danger" aria-label="Delete note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2m-9 3h10l-1 11H8L7 9Z" stroke="currentColor" stroke-width="2"></path>
          </svg>
          Delete
        </button>
      </div>
      <p class="note-preview">${this.escape(preview)}</p>
    `;
    const [editBtn, delBtn] = el.querySelectorAll('button');
    editBtn.addEventListener('click', () => this.openEditor(note));
    delBtn.addEventListener('click', () => this.deleteNote(note.id));
    return el;
  }

  escape(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  renderList(container) {
    const wrap = document.createElement('div');
    wrap.className = 'notes-list';
    const list = this.filteredSortedNotes();
    if (this.state.loading) {
      for (let i = 0; i < 4; i++) {
        const sk = document.createElement('div');
        sk.className = 'skeleton';
        wrap.appendChild(sk);
      }
    } else if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;">No notes yet</div>
        <div style="color:var(--color-muted);">Click the + button to create your first note.</div>
      `;
      wrap.appendChild(empty);
    } else {
      list.forEach(n => wrap.appendChild(this.noteItem(n)));
    }
    container.appendChild(wrap);
  }

  renderModal(container) {
    if (!this.state.showModal) return;

    const note = this.state.editing;
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.setAttribute('role', 'dialog');
    modalBackdrop.setAttribute('aria-modal', 'true');
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) this.closeEditor();
    });

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">${note?.id ? 'Edit Note' : 'New Note'}</div>
        <div class="modal-actions">
          <button class="btn" id="close-modal" aria-label="Close editor">Cancel</button>
          <button class="btn btn-primary" id="save-note" aria-label="Save note">Save</button>
        </div>
      </div>
      <div class="modal-body">
        <div>
          <label class="label" for="note-title">Title</label>
          <input id="note-title" class="input" type="text" placeholder="Note title" value="${this.escape(note?.title || '')}" />
        </div>
        <div>
          <label class="label" for="note-content">Content</label>
          <textarea id="note-content" class="input textarea" placeholder="Write your note (markdown/plain text supported)">${this.escape(note?.content || '')}</textarea>
        </div>
      </div>
    `;

    modalBackdrop.appendChild(modal);
    container.appendChild(modalBackdrop);

    modal.querySelector('#close-modal')?.addEventListener('click', () => this.closeEditor());
    modal.querySelector('#save-note')?.addEventListener('click', () => this.saveEditing());

    // trap focus basic
    const focusable = modal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeEditor();
      } else if (e.key === 'Tab' && focusable.length) {
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.saveEditing();
      }
    });
  }

  renderHeader(container) {
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="header-inner">
        <div class="brand" aria-label="Noteease">
          <div class="brand-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 6a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"></path>
            </svg>
          </div>
          <div class="brand-title">Noteease</div>
          <span class="badge">Ocean Professional</span>
        </div>
      </div>
    `;

    const searchWrap = document.createElement('div');
    searchWrap.className = 'header-inner';
    searchWrap.innerHTML = `
      <div class="search-row" style="width:100%;">
        <div style="position:relative;">
          <input id="search-input" class="input" type="search" placeholder="Search notes (Ctrl/Cmd+K)" aria-label="Search notes" />
          <div style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--color-muted);" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" stroke-width="2"></path>
            </svg>
          </div>
        </div>
        <select id="sort-select" class="input select" aria-label="Sort notes">
          <option value="updated_desc">Updated (newest)</option>
          <option value="updated_asc">Updated (oldest)</option>
          <option value="title_asc">Title (A–Z)</option>
        </select>
      </div>
    `;

    container.appendChild(header);
    container.appendChild(searchWrap);

    searchWrap.querySelector('#search-input')?.addEventListener('input', (e) => {
      this.setState({ query: e.target.value });
    });

    searchWrap.querySelector('#sort-select')?.addEventListener('change', (e) => {
      this.setState({ sort: e.target.value });
    });
  }

  renderFAB(container) {
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.setAttribute('aria-label', 'Add new note');
    fab.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2"></path>
      </svg>
    `;
    fab.addEventListener('click', () => this.openEditor());
    container.appendChild(fab);
  }

  render() {
    // Root structure
    this.root.className = 'app-root';
    this.root.innerHTML = '';

    // Header
    this.renderHeader(this.root);

    // Main container
    const main = document.createElement('main');
    main.className = 'container';
    main.setAttribute('role', 'main');

    // List area
    this.renderList(main);

    this.root.appendChild(main);

    // Floating action button
    this.renderFAB(this.root);

    // Modal if open
    this.renderModal(this.root);
  }
}
