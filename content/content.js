/**
 * ZapFilter CRM Pro - Fullscreen Kanban + Modal de Conversa + Observações Visuais + Colunas Dinâmicas
 * Permite Criar, Editar, Excluir e Restaurar Colunas no Kanban com Persistência Total.
 */

(function () {
  'use strict';

  console.log('[ZapFilter CRM Pro] 🚀 Inicializado com Colunas Dinâmicas e Gestão Completa.');

  let currentFilter = 'all';
  let observer = null;
  let isFiltering = false;
  let searchQuery = '';
  let filterDebounceTimer = null;
  let isKeydownBound = false;

  // 5 Colunas Padrão do Sistema
  const DEFAULT_COLUMNS = [
    { id: 'normal', name: 'Normal', color: '#53bdeb', isDefault: true },
    { id: 'unread', name: 'Não Lido', color: '#25d366', isDefault: true },
    { id: 'waiting', name: 'Falta responder', color: '#f7a23b', isDefault: true },
    { id: 'groups', name: 'Grupo', color: '#a855f7', isDefault: true },
    { id: 'replied', name: 'Respondido', color: '#00a884', isDefault: true }
  ];

  // Paleta de Cores para Novas Colunas
  const COLOR_PALETTE = [
    { name: 'Azul Claro', hex: '#53bdeb' },
    { name: 'Verde Zap', hex: '#25d366' },
    { name: 'Esmeralda', hex: '#00a884' },
    { name: 'Laranja', hex: '#f7a23b' },
    { name: 'Roxo', hex: '#a855f7' },
    { name: 'Rosa Choque', hex: '#ec4899' },
    { name: 'Ciano', hex: '#06b6d4' },
    { name: 'Amarelo Ouro', hex: '#eab308' },
    { name: 'Vermelho Coral', hex: '#ef4444' },
    { name: 'Índigo', hex: '#6366f1' }
  ];

  // Ícones SVG
  const ICONS = {
    kanban: `<svg viewBox="0 0 24 24"><path d="M4 4h4v16H4zm6 0h4v10h-4zm6 0h4v14h-4z"/></svg>`,
    normal: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`,
    unread: `<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
    waiting: `<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
    groups: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    replied: `<svg viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>`,
    sync: `<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`,
    note: `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    edit: `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
    restore: `<svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>`,
    arrowLeft: `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`,
    arrowRight: `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`
  };

  /* --------------------------------------------------------------------------
     Persistência Blindada de Colunas, Contatos e Observações
     -------------------------------------------------------------------------- */
  function getLocalData(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }

  function setLocalData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[ZapFilter] Erro ao salvar no localStorage:', e);
    }
  }

  // Obter Lista de Colunas (com fallback para Padrão)
  function getKanbanColumns(callback) {
    const localCols = getLocalData('zap_kanban_columns');
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['zap_kanban_columns'], (res) => {
        const cols = res.zap_kanban_columns || localCols || DEFAULT_COLUMNS;
        setLocalData('zap_kanban_columns', cols);
        callback(cols);
      });
    } else {
      const cols = localCols || DEFAULT_COLUMNS;
      callback(cols);
    }
  }

  function saveKanbanColumns(columns, callback) {
    setLocalData('zap_kanban_columns', columns);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ zap_kanban_columns: columns }, () => {
        if (callback) callback(columns);
      });
    } else {
      if (callback) callback(columns);
    }
  }

  function addKanbanColumn(name, color, callback) {
    getKanbanColumns((cols) => {
      const newId = 'col_' + Date.now();
      const newCol = {
        id: newId,
        name: name.trim(),
        color: color || '#53bdeb',
        isDefault: false
      };
      const updated = [...cols, newCol];
      saveKanbanColumns(updated, callback);
    });
  }

  function updateKanbanColumn(id, name, color, callback) {
    getKanbanColumns((cols) => {
      const updated = cols.map(col => {
        if (col.id === id) {
          return {
            ...col,
            name: name.trim() || col.name,
            color: color || col.color
          };
        }
        return col;
      });
      saveKanbanColumns(updated, callback);
    });
  }

  function deleteKanbanColumn(id, callback) {
    getKanbanColumns((cols) => {
      // Impede remoção das colunas essenciais padrão se necessário, ou remove se customizada
      const updated = cols.filter(c => c.id !== id);
      
      // Se houver contatos associados a essa coluna, move-os de volta para 'normal'
      getContactColumnMap((map, notes, archived) => {
        let changed = false;
        Object.keys(map).forEach(contactName => {
          if (map[contactName] === id) {
            map[contactName] = 'normal';
            changed = true;
          }
        });
        if (changed) {
          setLocalData('zap_contact_columns', map);
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ zap_contact_columns: map });
          }
        }
        saveKanbanColumns(updated, callback);
      });
    });
  }

  function moveColumn(columnId, direction, callback) {
    getKanbanColumns((cols) => {
      const idx = cols.findIndex(c => c.id === columnId);
      if (idx === -1) return;
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= cols.length) return;

      const temp = cols[idx];
      cols[idx] = cols[targetIdx];
      cols[targetIdx] = temp;

      saveKanbanColumns(cols, callback);
    });
  }

  function resetKanbanColumns(callback) {
    saveKanbanColumns(DEFAULT_COLUMNS, callback);
  }

  function getContactColumnMap(callback) {
    const localCols = getLocalData('zap_contact_columns') || {};
    const localNotes = getLocalData('zap_contact_notes') || {};
    const localArchived = getLocalData('zap_archived_replied') || [];

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['zap_contact_columns', 'zap_contact_notes', 'zap_archived_replied'], (res) => {
        const mergedCols = { ...localCols, ...(res.zap_contact_columns || {}) };
        const mergedNotes = { ...localNotes, ...(res.zap_contact_notes || {}) };
        const mergedArchived = Array.from(new Set([...localArchived, ...(res.zap_archived_replied || [])]));
        
        setLocalData('zap_contact_columns', mergedCols);
        setLocalData('zap_contact_notes', mergedNotes);
        setLocalData('zap_archived_replied', mergedArchived);
        callback(mergedCols, mergedNotes, mergedArchived);
      });
    } else {
      callback(localCols, localNotes, localArchived);
    }
  }

  function setContactColumn(contactName, columnId, callback) {
    getContactColumnMap((map, notes, archived) => {
      map[contactName] = columnId;
      const updatedArchived = archived.filter(name => name !== contactName);
      
      setLocalData('zap_contact_columns', map);
      setLocalData('zap_archived_replied', updatedArchived);

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ zap_contact_columns: map, zap_archived_replied: updatedArchived }, () => {
          if (callback) callback();
        });
      } else {
        if (callback) callback();
      }
    });
  }

  function clearRepliedContacts(repliedNames, callback) {
    getContactColumnMap((cols, notes, archived) => {
      const updatedArchived = Array.from(new Set([...archived, ...repliedNames]));
      setLocalData('zap_archived_replied', updatedArchived);

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ zap_archived_replied: updatedArchived }, () => {
          if (callback) callback();
        });
      } else {
        if (callback) callback();
      }
    });
  }

  function saveContactNote(contactName, noteText, callback) {
    getContactColumnMap((cols, notes, archived) => {
      if (noteText && noteText.trim()) {
        notes[contactName] = noteText.trim();
      } else {
        delete notes[contactName];
      }
      setLocalData('zap_contact_notes', notes);

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ zap_contact_notes: notes }, () => {
          if (callback) callback();
        });
      } else {
        if (callback) callback();
      }
    });
  }

  /* --------------------------------------------------------------------------
     Análise Rápida de Conversas do WhatsApp
     -------------------------------------------------------------------------- */
  function inspectChatItem(element) {
    const aria = (element.getAttribute('aria-label') || '').toLowerCase();

    // 1. Grupo
    const hasGroupIcon = !!element.querySelector(
      'span[data-icon="default-group"], span[data-icon="group"], span[data-icon="community"], span[data-icon="newsletter"]'
    );
    const isGroup = hasGroupIcon || aria.includes('grupo') || aria.includes('group') || aria.includes('comunidade');

    // 2. Não Lido
    const unreadEl = element.querySelector(
      'span[aria-label*="não lida"], span[aria-label*="unread"], [aria-label*="mensagem não lida"], span[data-icon="unread-count"]'
    );
    let isUnread = !isGroup && (!!unreadEl || aria.includes('não lida') || aria.includes('unread'));

    if (!isUnread && !isGroup) {
      const badges = element.querySelectorAll('span');
      for (let i = 0; i < badges.length; i++) {
        const badge = badges[i];
        const val = badge.textContent.trim();
        if (/^\d{1,4}$/.test(val) && badge.children.length === 0) {
          const parentAria = (badge.parentElement?.getAttribute('aria-label') || '').toLowerCase();
          if (parentAria.includes('não lida') || parentAria.includes('unread') || badge.closest('[aria-label*="não lida"]')) {
            isUnread = true;
            break;
          }
        }
      }
    }

    // 3. Respondido
    const hasSentCheck = !!element.querySelector(
      'span[data-icon="msg-dblcheck"], span[data-icon="msg-check"], span[data-icon="status-v3"], span[data-icon="msg-time"]'
    );
    const isReplied = !isGroup && hasSentCheck;

    let defaultCol = 'normal';
    if (isGroup) {
      defaultCol = 'groups';
    } else if (isUnread) {
      defaultCol = 'unread';
    } else if (isReplied) {
      defaultCol = 'replied';
    } else {
      defaultCol = 'normal';
    }

    return { isUnread, isGroup, isReplied, defaultCol };
  }

  function extractRealWhatsAppChats() {
    const paneSide = document.querySelector('#pane-side') || 
                     document.querySelector('div[data-testid="chat-list"]') || 
                     document.querySelector('div[role="grid"]');
    
    if (!paneSide) return [];

    let rows = paneSide.querySelectorAll('div[role="listitem"]');
    if (!rows || rows.length === 0) {
      rows = paneSide.querySelectorAll('div[role="row"]');
    }
    if (!rows || rows.length === 0) {
      rows = paneSide.querySelectorAll('div[data-testid="cell-frame-container"]');
    }

    const realChats = [];
    const seenNames = new Set();

    rows.forEach((row) => {
      const titleEl = row.querySelector('span[title], div[title], [data-testid="cell-frame-title"] span');
      const name = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent.trim()) : null;
      if (!name || name.length < 1) return;

      const normalizedName = name.trim().toLowerCase();
      if (seenNames.has(normalizedName)) return;
      seenNames.add(normalizedName);

      const imgEl = row.querySelector('img[src*="whatsapp.net"], img[data-testid="avatar-image"], img[src*="blob:"]');
      const avatarSrc = imgEl ? imgEl.getAttribute('src') : null;

      const timeEl = row.querySelector('div[data-testid="cell-frame-title"] + div, span[aria-label*=":"]');
      const time = timeEl ? timeEl.textContent.trim() : '';

      const lines = row.innerText.split('\n').filter(l => l.trim() && l !== name && l !== time);
      const lastMessage = lines[0] || 'Conversa ativa';

      const info = inspectChatItem(row);

      realChats.push({
        name: name,
        avatar: avatarSrc,
        lastMessage: lastMessage,
        time: time,
        isUnread: info.isUnread,
        isGroup: info.isGroup,
        isReplied: info.isReplied,
        defaultCol: info.defaultCol,
        domElement: row
      });
    });

    return realChats;
  }

  /* --------------------------------------------------------------------------
     Filtros Rápidos na Barra Superior
     -------------------------------------------------------------------------- */
  function getChatListContainer() {
    return document.querySelector('#pane-side') ||
           document.querySelector('div[data-testid="chat-list"]') ||
           document.querySelector('div[role="grid"]');
  }

  function debouncedApplyFilter(delay = 120) {
    if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
    filterDebounceTimer = setTimeout(() => {
      applyActiveFilter();
    }, delay);
  }

  function applyActiveFilter() {
    if (isFiltering) return;
    isFiltering = true;

    try {
      const container = getChatListContainer();
      if (!container) return;

      let chatRows = container.querySelectorAll('div[role="listitem"], div[role="row"], div[data-testid="cell-frame-container"]');
      if (!chatRows || chatRows.length === 0) {
        const inner = container.querySelector('div > div > div') || container;
        chatRows = inner.children;
      }

      let unreadCount = 0;

      if (currentFilter === 'all') {
        for (let i = 0; i < chatRows.length; i++) {
          const row = chatRows[i];
          if (row.classList && row.classList.contains('zapfilter-hidden-chat')) {
            row.classList.remove('zapfilter-hidden-chat');
          }
          const info = inspectChatItem(row);
          if (info.isUnread) unreadCount++;
        }
      } else {
        for (let i = 0; i < chatRows.length; i++) {
          const row = chatRows[i];
          if (row.id === 'zapfilter-container' || (row.closest && row.closest('#zapfilter-container'))) continue;

          const info = inspectChatItem(row);
          if (info.isUnread) unreadCount++;

          let show = true;
          if (currentFilter === 'groups') {
            show = info.isGroup;
          } else if (currentFilter === 'unread') {
            show = info.isUnread;
          } else if (currentFilter === 'waiting') {
            show = false;
          } else if (currentFilter === 'replied') {
            show = info.isReplied;
          } else if (currentFilter === 'normal') {
            show = !info.isGroup;
          }

          if (show) {
            if (row.classList && row.classList.contains('zapfilter-hidden-chat')) {
              row.classList.remove('zapfilter-hidden-chat');
            }
          } else {
            if (row.classList && !row.classList.contains('zapfilter-hidden-chat')) {
              row.classList.add('zapfilter-hidden-chat');
            }
          }
        }
      }

      const badge = document.querySelector('#zapfilter-btn-unread .zapfilter-badge');
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (err) {
      console.warn('[ZapFilter] Aviso ao filtrar:', err);
    } finally {
      isFiltering = false;
    }
  }

  /* --------------------------------------------------------------------------
     Abertura e Foco no WhatsApp Web
     -------------------------------------------------------------------------- */
  function openWhatsAppDirectly(contactName) {
    closeKanban();

    currentFilter = 'all';
    document.querySelectorAll('.zapfilter-btn').forEach(b => {
      if (b.getAttribute('data-filter') === 'all') b.classList.add('active');
      else b.classList.remove('active');
    });
    document.querySelectorAll('.zapfilter-hidden-chat').forEach(el => el.classList.remove('zapfilter-hidden-chat'));

    setTimeout(() => {
      const paneSide = document.querySelector('#pane-side') || document.querySelector('div[role="grid"]');
      if (!paneSide) return;

      const rows = paneSide.querySelectorAll('div[role="listitem"], div[role="row"], div[data-testid="cell-frame-container"]');
      let targetRow = null;

      for (const row of rows) {
        const titleEl = row.querySelector('span[title], div[title], [data-testid="cell-frame-title"] span');
        const name = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent.trim()) : '';
        if (name === contactName || (row.innerText && row.innerText.includes(contactName))) {
          targetRow = row;
          break;
        }
      }

      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const clickTarget = targetRow.querySelector('div[role="button"]') || targetRow.querySelector('span[title]') || targetRow;
        const rect = clickTarget.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;

        const eventOptions = {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1,
          clientX: clientX,
          clientY: clientY,
          screenX: clientX,
          screenY: clientY
        };

        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(evt => {
          clickTarget.dispatchEvent(new MouseEvent(evt, eventOptions));
        });
      } else {
        const searchInput = document.querySelector('div[contenteditable="true"][data-tab="3"]') ||
                            document.querySelector('#side div[contenteditable="true"]') ||
                            document.querySelector('div[data-testid="chat-list-search"] div[contenteditable="true"]');
        if (searchInput) {
          searchInput.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, contactName);
          
          searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: contactName }));

          setTimeout(() => {
            const firstResult = document.querySelector('#pane-side div[role="listitem"], #pane-side div[role="row"]');
            if (firstResult) {
              const rect = firstResult.getBoundingClientRect();
              const clickTarget = firstResult.querySelector('div[role="button"]') || firstResult;
              ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(evt => {
                clickTarget.dispatchEvent(new MouseEvent(evt, {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2
                }));
              });
            }
          }, 350);
        }
      }
    }, 100);
  }

  /* --------------------------------------------------------------------------
     Modal de Conversa com Observação Visual e Seletor de Colunas Dinâmicas
     -------------------------------------------------------------------------- */
  function openChatModal(chat) {
    let modal = document.querySelector('#zap-chat-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'zap-chat-modal';
      document.body.appendChild(modal);
    }

    getKanbanColumns((currentColumns) => {
      getContactColumnMap((columnMap, notesMap) => {
        const currentCol = columnMap[chat.name] || chat.defaultCol;
        const currentNote = notesMap[chat.name] || '';

        modal.innerHTML = `
          <div class="zap-modal-chatbox">
            <header class="zap-modal-header">
              <div class="zap-modal-user">
                ${chat.avatar ? `
                  <img class="zap-modal-avatar" src="${chat.avatar}" alt="Avatar">
                ` : `
                  <div class="zap-modal-avatar-fallback">${(chat.name || 'C')[0]}</div>
                `}
                <div class="zap-modal-title">
                  <h3>${escapeHtml(chat.name)}</h3>
                  <p>${chat.isGroup ? 'Grupo' : 'Contato'} • ${chat.time || 'Recente'}</p>
                </div>
              </div>
              <button class="zap-modal-close-btn" id="zap-modal-close-btn" title="Fechar">&times;</button>
            </header>

            <div class="zap-modal-body">
              <div class="zap-chat-bubble">
                <div class="zap-chat-bubble-label">Última Mensagem</div>
                <div>${escapeHtml(chat.lastMessage)}</div>
              </div>

              <!-- Caixa de Observação / Pendência Visual -->
              <div class="zap-modal-note-box">
                <div class="zap-modal-note-header">
                  <span class="zap-modal-note-title">
                    ${ICONS.note}
                    <span>Observação / Pendência</span>
                  </span>
                  <div style="display: flex; gap: 6px;">
                    <button class="zap-btn-clear-note" id="zap-btn-clear-note" title="Apagar observação">Limpar Nota</button>
                    <button class="zap-btn-save-note" id="zap-btn-save-note">Salvar Nota</button>
                  </div>
                </div>
                <textarea id="zap-input-contact-note" placeholder="Ex: Aguardando envio de comprovante...">${escapeHtml(currentNote)}</textarea>
              </div>

              <div class="zap-modal-crm-box">
                <span class="zap-modal-crm-title">Etapa no Kanban</span>
                <div class="zap-modal-select-stage">
                  <label>Mover para:</label>
                  <select id="zap-modal-col-select">
                    ${currentColumns.map(col => `
                      <option value="${col.id}" ${currentCol === col.id ? 'selected' : ''}>${col.name}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>

            <footer class="zap-modal-footer">
              <button class="zap-btn-direct-wa" id="zap-modal-btn-open-wa">
                ${ICONS.chat}
                <span>Abrir Conversa no WhatsApp</span>
              </button>
            </footer>
          </div>
        `;

        modal.style.setProperty('display', 'flex', 'important');

        modal.querySelector('#zap-modal-close-btn').onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          modal.style.setProperty('display', 'none', 'important');
        };

        modal.onclick = function(e) {
          if (e.target === modal) {
            modal.style.setProperty('display', 'none', 'important');
          }
        };

        const saveBtn = modal.querySelector('#zap-btn-save-note');
        const clearBtn = modal.querySelector('#zap-btn-clear-note');
        const noteInput = modal.querySelector('#zap-input-contact-note');

        saveBtn.onclick = function() {
          saveContactNote(chat.name, noteInput.value, () => {
            saveBtn.textContent = 'Salvo! ✓';
            setTimeout(() => saveBtn.textContent = 'Salvar Nota', 1500);
            refreshKanban();
          });
        };

        clearBtn.onclick = function() {
          noteInput.value = '';
          saveContactNote(chat.name, '', () => {
            clearBtn.textContent = 'Limpo! ✓';
            setTimeout(() => clearBtn.textContent = 'Limpar Nota', 1500);
            refreshKanban();
          });
        };

        modal.querySelector('#zap-modal-col-select').onchange = function(e) {
          const newCol = e.target.value;
          setContactColumn(chat.name, newCol, () => {
            refreshKanban();
          });
        };

        modal.querySelector('#zap-modal-btn-open-wa').onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          openWhatsAppDirectly(chat.name);
        };
      });
    });
  }

  /* --------------------------------------------------------------------------
     Modal de Criação / Edição de Colunas
     -------------------------------------------------------------------------- */
  function openColumnEditorModal(columnToEdit = null) {
    let colModal = document.querySelector('#zap-col-modal');
    if (!colModal) {
      colModal = document.createElement('div');
      colModal.id = 'zap-col-modal';
      document.body.appendChild(colModal);
    }

    const isEdit = !!columnToEdit;
    let selectedColor = columnToEdit ? columnToEdit.color : COLOR_PALETTE[0].hex;

    colModal.innerHTML = `
      <div class="zap-col-modal-box">
        <header class="zap-col-modal-header">
          <h3>${isEdit ? 'Editar Coluna' : 'Nova Coluna do CRM'}</h3>
          <button class="zap-col-modal-close" id="zap-col-modal-close">&times;</button>
        </header>

        <div class="zap-col-modal-body">
          <div class="zap-col-form-group">
            <label>Nome da Coluna:</label>
            <input type="text" id="zap-col-name-input" placeholder="Ex: Proposta Enviada, VIP, Fechado..." value="${isEdit ? escapeHtml(columnToEdit.name) : ''}">
          </div>

          <div class="zap-col-form-group">
            <label>Cor de Destaque:</label>
            <div class="zap-color-picker-palette">
              ${COLOR_PALETTE.map(c => `
                <div class="zap-color-swatch ${c.hex === selectedColor ? 'active' : ''}" data-hex="${c.hex}" style="background-color: ${c.hex};" title="${c.name}"></div>
              `).join('')}
            </div>
          </div>
        </div>

        <footer class="zap-col-modal-footer">
          <button class="zap-btn-modal-cancel" id="zap-col-btn-cancel">Cancelar</button>
          <button class="zap-btn-modal-save" id="zap-col-btn-save">${isEdit ? 'Salvar Alterações' : 'Criar Coluna'}</button>
        </footer>
      </div>
    `;

    colModal.style.setProperty('display', 'flex', 'important');

    const inputName = colModal.querySelector('#zap-col-name-input');
    setTimeout(() => {
      inputName.focus();
      inputName.select();
    }, 100);

    // Seletor de cores
    colModal.querySelectorAll('.zap-color-swatch').forEach(swatch => {
      swatch.onclick = function() {
        colModal.querySelectorAll('.zap-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        selectedColor = swatch.getAttribute('data-hex');
      };
    });

    // Fechar
    const closeModal = () => {
      colModal.style.setProperty('display', 'none', 'important');
    };

    colModal.querySelector('#zap-col-modal-close').onclick = closeModal;
    colModal.querySelector('#zap-col-btn-cancel').onclick = closeModal;

    colModal.onclick = (e) => {
      if (e.target === colModal) closeModal();
    };

    // Salvar
    colModal.querySelector('#zap-col-btn-save').onclick = () => {
      const nameVal = inputName.value.trim();
      if (!nameVal) {
        inputName.style.borderColor = '#ef4444';
        return;
      }

      if (isEdit) {
        updateKanbanColumn(columnToEdit.id, nameVal, selectedColor, () => {
          closeModal();
          refreshKanban();
        });
      } else {
        addKanbanColumn(nameVal, selectedColor, () => {
          closeModal();
          refreshKanban();
        });
      }
    };
  }

  /* --------------------------------------------------------------------------
     Quadro Kanban Fullscreen com Colunas Dinâmicas
     -------------------------------------------------------------------------- */
  function openKanban() {
    let overlay = document.querySelector('#zap-kanban-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'zap-kanban-overlay';
      document.body.appendChild(overlay);
    }
    overlay.style.setProperty('display', 'flex', 'important');
    refreshKanban();
  }

  function closeKanban() {
    const overlay = document.querySelector('#zap-kanban-overlay');
    if (overlay) {
      overlay.style.setProperty('display', 'none', 'important');
    }
    const modal = document.querySelector('#zap-chat-modal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
    }
    const colModal = document.querySelector('#zap-col-modal');
    if (colModal) {
      colModal.style.setProperty('display', 'none', 'important');
    }
  }

  function refreshKanban() {
    const overlay = document.querySelector('#zap-kanban-overlay');
    if (!overlay || overlay.style.display === 'none') return;

    getKanbanColumns((columns) => {
      const realChats = extractRealWhatsAppChats();

      getContactColumnMap((columnMap, notesMap, archivedList) => {
        const archivedSet = new Set(archivedList || []);
        
        const cards = realChats
          .map(chat => ({
            ...chat,
            columnId: columnMap[chat.name] || chat.defaultCol,
            note: notesMap[chat.name] || ''
          }))
          .filter(card => {
            if (card.columnId === 'replied' && archivedSet.has(card.name)) {
              return false;
            }
            return true;
          });

        renderKanbanBoard(overlay, cards, columns);
      });
    });
  }

  function renderKanbanBoard(overlay, cards, columns) {
    const filteredCards = searchQuery
      ? cards.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.note && c.note.toLowerCase().includes(searchQuery.toLowerCase())))
      : cards;

    const repliedCardsCount = cards.filter(c => c.columnId === 'replied').length;

    overlay.innerHTML = `
      <header class="zap-kanban-header">
        <div class="zap-kanban-brand">
          <div class="zap-brand-icon">
            ${ICONS.kanban}
          </div>
          <div class="zap-brand-text">
            <h2>Quadro Kanban • WhatsApp CRM</h2>
            <p>${cards.length} conversas ativas • ${columns.length} etapas no funil</p>
          </div>
        </div>

        <div class="zap-kanban-controls">
          <div class="zap-search-box">
            ${ICONS.search}
            <input type="text" id="zap-kb-search" placeholder="Buscar nas conversas ou notas..." value="${escapeHtml(searchQuery)}">
          </div>

          <button class="zap-btn-ctrl zap-btn-add-col" id="zap-kb-btn-add-col" title="Adicionar nova etapa/coluna">
            ${ICONS.plus}
            <span>+ Nova Coluna</span>
          </button>

          <button class="zap-btn-ctrl" id="zap-kb-btn-refresh" title="Atualizar">
            ${ICONS.sync}
            <span>Sincronizar</span>
          </button>

          <button class="zap-btn-ctrl zap-btn-restore" id="zap-kb-btn-restore" title="Restaurar para as 5 colunas padrão">
            ${ICONS.restore}
            <span>Padrão</span>
          </button>

          ${repliedCardsCount > 0 ? `
            <button class="zap-btn-ctrl zap-btn-clear-replied" id="zap-kb-btn-clear-replied" title="Limpar conversas já respondidas do quadro">
              <span>🧹 Limpar Respondidos (${repliedCardsCount})</span>
            </button>
          ` : ''}

          <button class="zap-btn-ctrl zap-btn-close-main" id="zap-kb-btn-close" title="Fechar Kanban">
            <span>&times; Fechar Kanban</span>
          </button>
        </div>
      </header>

      <div class="zap-kanban-board">
        ${columns.map((col, idx) => {
          const colCards = filteredCards.filter(c => c.columnId === col.id);
          const isDefault = !!col.isDefault;

          return `
            <div class="zap-kanban-col" data-col-id="${col.id}">
              <div class="zap-col-head" draggable="true" data-col-id="${col.id}">
                <div class="zap-col-left">
                  <span class="zap-col-drag-handle" title="Segure e arraste para reordenar a coluna">⋮⋮</span>
                  <span class="zap-col-pill" style="background-color: ${col.color};"></span>
                  <span class="zap-col-title" title="${escapeHtml(col.name)}">${escapeHtml(col.name)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 3px;">
                  ${idx > 0 ? `
                    <button class="zap-col-action-btn zap-col-btn-move-left" data-col-id="${col.id}" title="Mover para a esquerda">
                      ${ICONS.arrowLeft}
                    </button>
                  ` : ''}
                  ${idx < columns.length - 1 ? `
                    <button class="zap-col-action-btn zap-col-btn-move-right" data-col-id="${col.id}" title="Mover para a direita">
                      ${ICONS.arrowRight}
                    </button>
                  ` : ''}
                  <button class="zap-col-action-btn zap-col-btn-edit" data-col-id="${col.id}" title="Renomear ou mudar cor da coluna">
                    ${ICONS.edit}
                  </button>
                  ${!isDefault ? `
                    <button class="zap-col-action-btn zap-col-btn-delete" data-col-id="${col.id}" title="Excluir coluna">
                      ${ICONS.trash}
                    </button>
                  ` : ''}
                  ${col.id === 'replied' && colCards.length > 0 ? `
                    <button class="zap-btn-col-clear" id="zap-col-clear-replied" title="Limpar esta coluna">🧹 Limpar</button>
                  ` : ''}
                  <span class="zap-col-counter">${colCards.length}</span>
                </div>
              </div>

              <div class="zap-col-cardlist" data-col-id="${col.id}">
                ${colCards.length === 0 ? `
                  <div class="zap-empty-col">Nenhum chat aqui.<br>Arraste uma conversa para cá.</div>
                ` : colCards.map(c => `
                  <div class="zap-contact-card" draggable="true" data-contact-name="${escapeHtml(c.name)}">
                    <div class="zap-card-profile">
                      ${c.avatar ? `
                        <img class="zap-card-avatar" src="${c.avatar}" alt="Avatar">
                      ` : `
                        <div class="zap-card-avatar-fallback">${(c.name || 'C')[0]}</div>
                      `}
                      <div class="zap-card-info">
                        <span class="zap-card-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
                        <span class="zap-card-time">${c.time || ''}</span>
                      </div>
                    </div>

                    <!-- Exibição Visual da Observação / Pendência -->
                    ${c.note ? `
                      <div class="zap-card-note-badge" title="${escapeHtml(c.note)}">
                        ${ICONS.note}
                        <span>${escapeHtml(c.note)}</span>
                      </div>
                    ` : ''}

                    ${c.lastMessage ? `
                      <div class="zap-card-message" title="${escapeHtml(c.lastMessage)}">${escapeHtml(c.lastMessage)}</div>
                    ` : ''}

                    <div class="zap-card-bottom">
                      ${c.isUnread ? `
                        <span class="zap-card-badge-unread">Não lida</span>
                      ` : `<span></span>`}

                      <button class="zap-card-open-btn" data-contact-name="${escapeHtml(c.name)}">
                        ${ICONS.chat}
                        <span>Ver Conversa</span>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}

        <!-- Card Especial de Adicionar Coluna no final do Board -->
        <div class="zap-add-col-card" id="zap-board-btn-add-col" title="Criar nova etapa">
          <div class="zap-add-col-inner">
            ${ICONS.plus}
            <span>Adicionar Coluna</span>
          </div>
        </div>
      </div>
    `;

    // Fechar Kanban
    const closeBtn = overlay.querySelector('#zap-kb-btn-close');
    if (closeBtn) {
      closeBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeKanban();
      };
    }

    // Botão Adicionar Coluna (+ Nova Coluna)
    const addColBtns = [
      overlay.querySelector('#zap-kb-btn-add-col'),
      overlay.querySelector('#zap-board-btn-add-col')
    ];
    addColBtns.forEach(btn => {
      if (btn) {
        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          openColumnEditorModal();
        };
      }
    });

    // Botões Mover Coluna (Esquerda / Direita)
    overlay.querySelectorAll('.zap-col-btn-move-left').forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const colId = btn.getAttribute('data-col-id');
        moveColumn(colId, 'left', () => {
          refreshKanban();
        });
      };
    });

    overlay.querySelectorAll('.zap-col-btn-move-right').forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const colId = btn.getAttribute('data-col-id');
        moveColumn(colId, 'right', () => {
          refreshKanban();
        });
      };
    });

    // Botão Editar Coluna
    overlay.querySelectorAll('.zap-col-btn-edit').forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const colId = btn.getAttribute('data-col-id');
        const col = columns.find(c => c.id === colId);
        if (col) openColumnEditorModal(col);
      };
    });

    // Botão Excluir Coluna
    overlay.querySelectorAll('.zap-col-btn-delete').forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const colId = btn.getAttribute('data-col-id');
        const col = columns.find(c => c.id === colId);
        if (col && confirm(`Deseja realmente excluir a coluna "${col.name}"?\nOs contatos serão movidos com segurança para a coluna Normal.`)) {
          deleteKanbanColumn(colId, () => {
            refreshKanban();
          });
        }
      };
    });

    // Botão Restaurar Padrão
    const restoreBtn = overlay.querySelector('#zap-kb-btn-restore');
    if (restoreBtn) {
      restoreBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Deseja restaurar as colunas originais do CRM (Normal, Não Lido, Falta responder, Grupo, Respondido)?')) {
          resetKanbanColumns(() => {
            refreshKanban();
          });
        }
      };
    }

    // Sincronizar
    const refreshBtn = overlay.querySelector('#zap-kb-btn-refresh');
    if (refreshBtn) {
      refreshBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        refreshKanban();
      };
    }

    // Limpar Respondidos
    const clearRepliedAction = function(e) {
      e.preventDefault();
      e.stopPropagation();
      const repliedNames = cards.filter(c => c.columnId === 'replied').map(c => c.name);
      if (repliedNames.length > 0) {
        clearRepliedContacts(repliedNames, () => {
          refreshKanban();
        });
      }
    };

    const clearRepliedHeaderBtn = overlay.querySelector('#zap-kb-btn-clear-replied');
    if (clearRepliedHeaderBtn) clearRepliedHeaderBtn.onclick = clearRepliedAction;

    const clearRepliedColBtn = overlay.querySelector('#zap-col-clear-replied');
    if (clearRepliedColBtn) clearRepliedColBtn.onclick = clearRepliedAction;

    // Busca
    const searchInput = overlay.querySelector('#zap-kb-search');
    if (searchInput) {
      searchInput.oninput = function(e) {
        searchQuery = e.target.value;
        renderKanbanBoard(overlay, cards, columns);
        const newSearch = overlay.querySelector('#zap-kb-search');
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      };
    }

    // Modal de Detalhes do Card
    overlay.querySelectorAll('.zap-contact-card').forEach(card => {
      card.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const name = card.getAttribute('data-contact-name');
        const chat = cards.find(c => c.name === name);
        if (chat) openChatModal(chat);
      };
    });

    setupKanbanDragAndDrop(overlay);
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  let activeDragType = null; // 'column' | 'card'
  let activeDragColId = null;
  let activeDragContactName = null;

  function setupKanbanDragAndDrop(overlay) {
    // 1. Drag & Drop de Colunas Inteiras
    overlay.querySelectorAll('.zap-col-head').forEach(headEl => {
      const colEl = headEl.closest('.zap-kanban-col');
      const colId = headEl.getAttribute('data-col-id');

      headEl.addEventListener('dragstart', (e) => {
        if (e.target.closest('.zap-col-action-btn') || e.target.closest('.zap-btn-col-clear')) {
          e.preventDefault();
          return;
        }
        activeDragType = 'column';
        activeDragColId = colId;
        activeDragContactName = null;

        if (colEl) colEl.classList.add('is-col-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'column:' + colId);
      });

      headEl.addEventListener('dragend', () => {
        activeDragType = null;
        activeDragColId = null;
        if (colEl) colEl.classList.remove('is-col-dragging');
        overlay.querySelectorAll('.zap-kanban-col').forEach(c => c.classList.remove('is-col-dragover'));
      });
    });

    // Zona de Drop de Colunas
    overlay.querySelectorAll('.zap-kanban-col').forEach(targetColEl => {
      const targetColId = targetColEl.getAttribute('data-col-id');

      targetColEl.addEventListener('dragover', (e) => {
        if (activeDragType === 'column') {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (activeDragColId && activeDragColId !== targetColId) {
            targetColEl.classList.add('is-col-dragover');
          }
        }
      });

      targetColEl.addEventListener('dragleave', (e) => {
        if (!targetColEl.contains(e.relatedTarget)) {
          targetColEl.classList.remove('is-col-dragover');
        }
      });

      targetColEl.addEventListener('drop', (e) => {
        if (activeDragType === 'column' && activeDragColId && targetColId) {
          e.preventDefault();
          e.stopPropagation();
          targetColEl.classList.remove('is-col-dragover');

          const sourceId = activeDragColId;
          activeDragType = null;
          activeDragColId = null;

          if (sourceId !== targetColId) {
            getKanbanColumns((cols) => {
              const fromIdx = cols.findIndex(c => c.id === sourceId);
              const toIdx = cols.findIndex(c => c.id === targetColId);
              if (fromIdx !== -1 && toIdx !== -1) {
                const [movedCol] = cols.splice(fromIdx, 1);
                cols.splice(toIdx, 0, movedCol);
                saveKanbanColumns(cols, () => {
                  refreshKanban();
                });
              }
            });
          }
        }
      });
    });

    // 2. Drag & Drop de Cards de Contatos
    overlay.querySelectorAll('.zap-contact-card').forEach(cardEl => {
      cardEl.addEventListener('dragstart', (e) => {
        activeDragType = 'card';
        activeDragContactName = cardEl.getAttribute('data-contact-name');
        activeDragColId = null;

        cardEl.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'contact:' + activeDragContactName);
      });

      cardEl.addEventListener('dragend', () => {
        activeDragType = null;
        activeDragContactName = null;
        cardEl.classList.remove('is-dragging');
        overlay.querySelectorAll('.zap-col-cardlist').forEach(cl => cl.classList.remove('is-dragover'));
      });
    });

    overlay.querySelectorAll('.zap-col-cardlist').forEach(colListEl => {
      const targetColId = colListEl.getAttribute('data-col-id');

      colListEl.addEventListener('dragover', (e) => {
        if (activeDragType === 'card') {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          colListEl.classList.add('is-dragover');
        } else if (activeDragType === 'column') {
          // Permite que o drag da coluna passe por cima da lista sem travar
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      });

      colListEl.addEventListener('dragleave', (e) => {
        if (!colListEl.contains(e.relatedTarget)) {
          colListEl.classList.remove('is-dragover');
        }
      });

      colListEl.addEventListener('drop', (e) => {
        if (activeDragType === 'card' && activeDragContactName && targetColId) {
          e.preventDefault();
          e.stopPropagation();
          colListEl.classList.remove('is-dragover');

          const contactName = activeDragContactName;
          activeDragType = null;
          activeDragContactName = null;

          setContactColumn(contactName, targetColId, () => {
            refreshKanban();
          });
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     Header de Filtros Rápidos
     -------------------------------------------------------------------------- */
  function injectMainHeader() {
    if (document.querySelector('#zapfilter-container')) return;

    const side = document.querySelector('#side');
    const paneSide = document.querySelector('#pane-side');
    const searchContainer = side ? side.querySelector('div[tabindex="-1"], div._aigs, div._ai01, div[data-testid="chat-list-search"]') : null;

    let targetParent = null;
    let insertBeforeEl = null;

    if (searchContainer && searchContainer.parentNode) {
      targetParent = searchContainer.parentNode;
      insertBeforeEl = searchContainer.nextSibling;
    } else if (paneSide && paneSide.parentNode) {
      targetParent = paneSide.parentNode;
      insertBeforeEl = paneSide;
    } else if (side) {
      targetParent = side;
      insertBeforeEl = side.firstChild;
    }

    if (!targetParent) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'zapfilter-container';
    toolbar.innerHTML = `
      <button class="zapfilter-kanban-toggle" id="zapfilter-btn-open-kanban" title="Abrir Quadro Kanban">
        ${ICONS.kanban}
        <span>Quadro Kanban</span>
      </button>

      <button class="zapfilter-btn active" data-filter="all">
        ${ICONS.normal}
        <span>Normal</span>
      </button>

      <button class="zapfilter-btn" id="zapfilter-btn-unread" data-filter="unread">
        ${ICONS.unread}
        <span>Não Lido</span>
        <span class="zapfilter-badge" style="display: none;">0</span>
      </button>

      <button class="zapfilter-btn" data-filter="waiting">
        ${ICONS.waiting}
        <span>Falta responder</span>
      </button>

      <button class="zapfilter-btn" data-filter="groups">
        ${ICONS.groups}
        <span>Grupo</span>
      </button>

      <button class="zapfilter-btn" data-filter="replied">
        ${ICONS.replied}
        <span>Respondido</span>
      </button>

      <button class="zapfilter-sync-btn" id="zapfilter-btn-sync" title="Atualizar conversas">
        ${ICONS.sync}
      </button>
    `;

    if (insertBeforeEl) {
      targetParent.insertBefore(toolbar, insertBeforeEl);
    } else {
      targetParent.appendChild(toolbar);
    }

    toolbar.querySelector('#zapfilter-btn-open-kanban').onclick = function(e) {
      e.preventDefault();
      openKanban();
    };

    toolbar.querySelectorAll('.zapfilter-btn').forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        toolbar.querySelectorAll('.zapfilter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        applyActiveFilter();
      };
    });

    const syncBtn = toolbar.querySelector('#zapfilter-btn-sync');
    if (syncBtn) {
      syncBtn.onclick = function(e) {
        e.preventDefault();
        applyActiveFilter();
      };
    }

    if (!isKeydownBound) {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeKanban();
        }
      });
      isKeydownBound = true;
    }

    debouncedApplyFilter(50);
  }

  /* --------------------------------------------------------------------------
     Observador Inteligente de DOM (Alvo Específico + Anti-Freeze)
     -------------------------------------------------------------------------- */
  function startWatcher() {
    if (observer) observer.disconnect();

    const targetNode = document.querySelector('#side') || document.querySelector('#pane-side') || document.body;

    observer = new MutationObserver((mutations) => {
      let shouldFilter = false;
      let shouldInject = false;

      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.target && m.target.id && (m.target.id === 'zap-kanban-overlay' || m.target.id === 'zap-chat-modal' || m.target.id === 'zap-col-modal' || m.target.id === 'zapfilter-container')) {
          continue;
        }

        if (!document.querySelector('#zapfilter-container')) {
          shouldInject = true;
        }
        shouldFilter = true;
      }

      if (shouldInject) {
        injectMainHeader();
      }
      if (shouldFilter) {
        debouncedApplyFilter(200);
      }
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }

  const initInterval = setInterval(() => {
    const side = document.querySelector('#side') || document.querySelector('#pane-side');
    if (side) {
      injectMainHeader();
      startWatcher();
      clearInterval(initInterval);
    }
  }, 400);

  setTimeout(() => clearInterval(initInterval), 20000);

})();
