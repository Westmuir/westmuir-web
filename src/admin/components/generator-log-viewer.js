import { GeneratorBase } from 'js/generator-base.js';
import { html } from 'js/html.js';

class GeneratorLogViewer extends GeneratorBase {
  constructor() {
    super();
    this.allLogs = [];
    this.filteredLogs = [];
    this.isLoading = false;
    this.currentYear = '2026';
    this.searchQuery = '';
  }

  get isAdmin() {
    return this.hasAttribute('admin') || document.body.getAttribute('data-user-role') === 'admin';
  }

  connectedCallback() {
    this.tableBody = this.querySelector('.logs-table-body');
    this.counterBadge = document.querySelector('.log-count-badge');

    if (this.allLogs.length === 0 && !this.isLoading) {
      this.loadLogs();
    }

    this.setupFilterListeners();
    this.setupSyncListeners();

    this.addEventListener('click', event => {
      const editBtn = event.target.closest('.edit-log-btn');
      if (!editBtn) return;

      event.stopPropagation();
      const logId = editBtn.dataset.id;

      // 1. Locate the exact raw log entry from our local memory model
      const rawLogObject = this.filteredLogs.find(l => l.id === logId);
      if (!rawLogObject) return;

      // 2. Dispatch it upwards with zero DOM scraping overhead
      this.dispatchEvent(
        new CustomEvent('edit-log-request', {
          bubbles: true,
          composed: true,
          detail: {
            id: logId,
            fields: rawLogObject, // The clean, flat database object goes straight to the form manager
          },
        }),
      );
    });
  }

  async loadLogs() {
    this.isLoading = true;
    try {
      const response = await fetch('/api/generator');
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      this.allLogs = Array.isArray(data) ? data : [data];
      this.applyFiltersAndRender();
    } catch (error) {
      if (this.tableBody) {
        this.tableBody.innerHTML = `<div class="error-state">⚠️ Failed to load records: ${error.message}</div>`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  setupFilterListeners() {
    this.querySelector('.search-box')?.addEventListener('input', e => {
      this.searchQuery = e.target.value;
      this.applyFiltersAndRender();
    });

    this.querySelector('.year-select')?.addEventListener('change', e => {
      this.currentYear = e.target.value;
      this.applyFiltersAndRender();
    });
  }

  setupSyncListeners() {
    // Sync across structural components via bubble triggers
    document.addEventListener('generator-log-saved', e => {
      const savedLog = e.detail.log;
      const index = this.allLogs.findIndex(l => l.id === savedLog.id);
      if (index !== -1) {
        this.allLogs[index] = savedLog;
      } else {
        this.allLogs.unshift(savedLog);
      }
      this.applyFiltersAndRender();
    });

    document.addEventListener('generator-log-deleted', e => {
      this.allLogs = this.allLogs.filter(l => l.id !== e.detail.id);
      this.applyFiltersAndRender();
    });

    // Handle standard internal Edit click mechanics
    this.addEventListener('click', event => {
      const editBtn = event.target.closest('.edit-log-btn');
      if (!editBtn) return;

      event.stopPropagation();
      const logId = editBtn.dataset.id;
      const row = this.querySelector(`.log-row[data-id="${logId}"]`);
      if (!row) return;

      this.dispatchEvent(
        new CustomEvent('edit-log-request', {
          bubbles: true,
          composed: true,
          detail: { id: logId, fields: { ...row.dataset } },
        }),
      );
    });
  }

  applyFiltersAndRender() {
    this.filteredLogs = this.allLogs.filter(log => {
      const matchesYear = log.date && log.date.startsWith(this.currentYear);
      const tokens = this.searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      return (
        matchesYear &&
        tokens.every(
          token =>
            log.notes?.toLowerCase().includes(token) ||
            log.initials?.toLowerCase().includes(token) ||
            log.reason?.toLowerCase().includes(token),
        )
      );
    });

    if (this.tableBody) {
      if (this.filteredLogs.length === 0) {
        this.tableBody.innerHTML = '<div class="empty-state">No matching log records found.</div>';
      } else {
        this.tableBody.innerHTML = this.filteredLogs.map(log => this.buildRowHTML(log)).join('');
      }
    }
    if (this.counterBadge) this.counterBadge.textContent = this.filteredLogs.length;
  }

  buildRowHTML(log) {
    const batteryDisplay =
      log.battery_start || log.battery_end ? `${log.battery_start ?? '-'}V → ${log.battery_end ?? '-'}V` : '-';
    const fuelDisplay = log.fuel_start || log.fuel_end ? `${log.fuel_start ?? '-'}% → ${log.fuel_end ?? '-'}%` : '-';

    // Map codes to user-friendly text badges
    const reasonLabels = { M: 'Maint', A: 'Alert', R: 'Resilience', S: 'Service' };
    const reasonText = reasonLabels[log.reason] || log.reason;

    return html`
      <div class="log-row" data-id="${log.id}">
        <!-- Column 1: The Reason Status Badge -->
        <div class="log-cell cell-reason">
          <span class="cell-label">Reason:</span>
          <span class="status-badge state-${log.reason.toLowerCase()}">${reasonText}</span>
        </div>

        <!-- Remaining Columns shifted along -->
        <div class="log-cell"><span class="cell-label">Date:</span>${log.date}</div>
        <div class="log-cell"><span class="cell-label">Run:</span>${log.time_start} - ${log.time_end}</div>
        <div class="log-cell"><span class="cell-label">Battery:</span>${batteryDisplay}</div>
        <div class="log-cell"><span class="cell-label">Fuel:</span>${fuelDisplay}</div>
        <div class="log-cell"><span class="cell-label">Operator:</span>${log.initials}</div>

        <div class="log-cell actions-cell">
          <button type="button" class="edit-log-btn ui-button" data-id="${log.id}">✏️ Edit</button>
          <button type="button" class="delete-log-btn ui-button" data-id="${log.id}">🗑️</button>
        </div>
      </div>
    `;
  }
}
customElements.define('generator-log-viewer', GeneratorLogViewer);
