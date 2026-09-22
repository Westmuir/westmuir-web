import { GeneratorBase } from 'js/generator-base.js';

class GeneratorLogManager extends GeneratorBase {
  constructor() {
    super();

    this.isFormDirty = false;
    this.activeDeleteId = null;
  }

  connectedCallback() {
    this.form = this.querySelector('.generator-form');
    this.formAccordion = this.querySelector('.form-accordion');
    this.modeTitle = this.querySelector('.form-mode-title');
    this.idField = this.querySelector('.log-id-field');
    this.errorBanner = this.querySelector('.form-error-banner');

    this.cancelButton = this.querySelector('.cancel-edit-btn');
    this.createButton = this.querySelector('.switch-to-create-btn');
    this.modal = this.querySelector('#delete-confirm-modal');
    this.setupFormListeners();
    this.setupClickListener();
  }

  updateActionButtonsVisibility() {
    // The Cancel button is HIDDEN when the form is clean (NOT dirty)
    if (this.cancelButton) this.cancelButton.classList.toggle('hidden', !this.isFormDirty);
    if (this.createButton) this.createButton.classList.toggle('hidden', this.isFormDirty);

    const idEl = this.querySelector('input[type="hidden"]');
    const title = idEl?.value ? 'Modify Existing record' : 'New Log Entry';

    if (this.modeTitle) this.modeTitle.textContent = title;

    const deleteBtn = this.querySelector('.delete-competition-btn');

    if (deleteBtn) {
      // Only show or enable the delete action if an ID exists (meaning it's an Edit, not a Create)
      const hasId = !!(idEl && idEl.value);
      deleteBtn.classList.toggle('hidden', !hasId);
    }
  }

  setupClickListener() {
    this.addEventListener('click', event => {
      const cancelButton = event.target.closest('.cancel-edit-btn');

      if (cancelButton) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (this.startingModel) {
          this.hydrateForm(this.startingModel);
        } else {
          this.clearForm();
          this.isFormDirty = false;
          this.updateActionButtonsVisibility();
        }
        return;
      }
      const createButton = event.target.closest('.switch-to-create-btn');

      if (createButton) {
        if (this.isFormDirty) return;

        this.clearForm();
        return;
      }

      const deleteBtn = event.target.closest('.delete-log-btn');
      if (deleteBtn) {
        event.stopPropagation();
        this.activeDeleteId = deleteBtn.dataset.id;
        this.modal?.showModal();
        return;
      }
    });
  }

  setupFormListeners() {
    const form = this.form;

    form.addEventListener('submit', event => this.handleFormSubmit(event));
    form.addEventListener('input', () => {
      // ⚡️ PERFORMANCE GUARD: If we already know the form is dirty,
      // stop immediately and skip costly DOM style updates!
      if (this.isFormDirty) return;

      this.isFormDirty = true;
      this.updateActionButtonsVisibility();
    });

    document.addEventListener('edit-log-request', event => {
      this.hydrateForm(event.detail.fields);
    });

    const modal = document.getElementById('delete-confirm-modal');

    if (modal) {
      modal.addEventListener('close', async event => {
        if (modal.returnValue === 'confirm') {
          const compId = form.querySelector('input[type="hidden"]')?.value;
          if (!compId) return;

          try {
            const response = await fetch(`/admin/generator/${compId}`, { method: 'DELETE' });

            if (!response.ok) throw new Error('Wipe operation rejected by server.');

            const result = await response.json();

            if (result.success) {
              this.clearForm();
              this.dispatchEvent(new CustomEvent('generator-log-deleted', { bubbles: true, detail: { id: compId } }));

              this.modal.close();
            }
          } catch (err) {
            alert(err.message);
          }
        }
      });
    }
  }
  clearForm() {
    const form = this.querySelector('form');
    if (!form) return;

    form.reset();

    // 2. Erase the top-level hidden competition ID so the next save starts fresh
    const idEl = this.querySelector('input[type="hidden"]');
    if (idEl) idEl.value = '';

    this.isFormDirty = false;
    this.updateActionButtonsVisibility();
  }

  hydrate(data) {
    const record = data ?? {};
    if (this.formAccordion) this.formAccordion.setAttribute('open', '');

    const idEl = this.querySelector('input[type="hidden"]');
    idEl.value = record.id ?? this.generateId();

    this.form.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.name) {
        input.value = record[input.name] || '';
      }
    });
    this.form.querySelector('input[name="date"]')?.focus(); //
  }

  hydrateForm(data) {
    this.startingModel = data;
    this.isFormDirty = false;

    this.hydrate(data);

    this.updateActionButtonsVisibility();
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(this.form);

    // If it's a new record creation, generate a 12-character ID using your base class routine
    if (!formData.get('id')) {
      const shortId = this.generateId(12);
      formData.set('id', shortId);
      this.idField.value = shortId;
    }

    try {
      const response = await fetch('/admin/generator', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update maintenance record.');

      const result = await response.json();

      // 1. Snapshot the newly saved data as the clean baseline model
      this.startingModel = result.log;
      this.isFormDirty = false;
      this.updateActionButtonsVisibility();

      // 2. Sync the log viewer table layout instantly
      this.dispatchEvent(
        new CustomEvent('generator-log-saved', {
          bubbles: true,
          detail: { log: result.log },
        }),
      );
    } catch (err) {
      if (this.errorBanner) {
        this.errorBanner.textContent = err.message;
        this.errorBanner.hidden = false;
      }
    }
  }
}

customElements.define('generator-log-manager', GeneratorLogManager);
