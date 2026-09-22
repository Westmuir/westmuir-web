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
  }

  updateActionButtonsVisibility() {
    // The Cancel button is HIDDEN when the form is clean (NOT dirty)
    if (this.cancelButton) this.cancelButton.classList.toggle('hidden', !this.isFormDirty);

    // The Create button is HIDDEN when the form is dirty
    if (this.createButton) this.createButton.classList.toggle('hidden', this.isFormDirty);

    if (this.modeTitle) this.modeTitle.textContent = 'Modify Existing record';

    const idEl = this.querySelector('input[type="hidden"]');
    const deleteBtn = this.querySelector('.delete-competition-btn');

    if (deleteBtn) {
      // Only show or enable the delete action if an ID exists (meaning it's an Edit, not a Create)
      const hasId = !!(idEl && idEl.value);
      deleteBtn.classList.toggle('hidden', !hasId);
    }
  }

  setupFormListeners() {
    const form = this.form;

    // Wire component layout triggers
    form.addEventListener('submit', e => this.handleFormSubmit(e));

    // Any input event anywhere signals a change
    form.addEventListener('input', () => {
      // ⚡️ PERFORMANCE GUARD: If we already know the form is dirty,
      // stop immediately and skip costly DOM style updates!
      if (this.isFormDirty) return;

      this.isFormDirty = true;
      this.updateActionButtonsVisibility();
    });

    // 3. Simple escape hatch execution
    const cancelButton = form.querySelector('.cancel-edit-btn');
    if (cancelButton) {
      cancelButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (this.startingModel) {
          // Rollback straight to our starting state data object
          this.hydrateForm(this.startingModel, form);
        } else {
          this.clearForm();
          this.isFormDirty = false;
          this.updateActionButtonsVisibility();
        }
      });
    } // Handle explicit Switch to Create Click (Wipe and Reset Mode)

    const createButton = this.querySelector('.switch-to-create-btn');

    if (createButton) {
      createButton.addEventListener('click', e => {
        if (this.isFormDirty) return;

        this.clearForm();
      });
    }

    // Handle incoming row edit trigger requests via bubbles
    document.addEventListener('edit-log-request', e => {
      this.hydrateForm(e.detail.fields);
    });

    // Intercept native child deletion notifications to trigger the dialog
    this.addEventListener('click', event => {
      const deleteBtn = event.target.closest('.delete-log-btn');
      if (deleteBtn) {
        event.stopPropagation();
        this.activeDeleteId = deleteBtn.dataset.id;
        this.modal?.showModal();
      }
    }); // Modal Confirmation Actions
    this.modal?.querySelector('.close-modal-btn')?.addEventListener('click', () => this.modal.close());
    this.modal?.querySelector('.confirm-delete-btn')?.addEventListener('click', () => this.executeDeletion());
  }

  setFormMode(mode) {
    if (mode === 'edit') {
      this.modeTitle.textContent = '✏️ Editing Log Entry';
      this.cancelBtn?.classList.remove('hidden');
      this.createBtn?.classList.remove('hidden');
    } else {
      this.modeTitle.textContent = '➕ New Log Entry';
      this.idField.value = '';
      this.form.reset();
      this.cancelBtn?.classList.add('hidden');
      this.createBtn?.classList.add('hidden');
    }
    if (this.errorBanner) this.errorBanner.hidden = true;
  }

  handleEditFill(fields) {
    const form = this.form;
    if (!form) return;
    // this.setFormMode(form, 'edit');
    if (this.formAccordion) this.formAccordion.setAttribute('open', '');

    form.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.name) {
        input.value = fields[input.name] || '';
      }
    });
    form.querySelector('input[name="date"]')?.focus();
  }

  hydrate(data) {
    // 1. Only fallback to {} if data or data.competition is genuinely null/undefined
    const record = data ?? {};
    if (this.formAccordion) this.formAccordion.setAttribute('open', '');

    // 2. Handle the hidden ID element
    const idEl = this.querySelector('input[type="hidden"]');
    idEl.value = record.id ?? this.generateId();

    this.form.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.name) {
        input.value = record[input.name] || '';
      }
    });
    this.form.querySelector('input[name="date"]')?.focus(); //

    // // 3. Loop through the standard inputs
    // ['name', 'kind', 'reserves'].forEach(field => {
    //   const el = this.querySelector(`[name="competition[${field}]"]`);
    //   if (!el) return; // Defensive check in case the HTML changes
    //
    //   if (field === 'kind') {
    //     // If competition.kind is null/undefined, default to 'local'
    //     el.value = competition.kind ?? 'league';
    //
    //     // Warning for stale database values
    //     if (el.value === '' && competition.kind) {
    //       console.warn(`Old database value "${competition.kind}" is no longer valid for kind.`);
    //     }
    //   } else {
    //     // Using ?? ensures that 0 or false isn't wiped out into an empty string
    //     el.value = competition[field] ?? '';
    //   }
    // });
  }

  hydrateForm(data) {
    this.startingModel = data;
    this.isFormDirty = false;

    this.hydrate(data);

    // 3. Sync up the view layout states
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

      // Dispatch event to dynamically sync your child layout array model view instantly
      this.dispatchEvent(
        new CustomEvent('generator-log-saved', {
          bubbles: true,
          detail: { log: result.log },
        }),
      );

      // this.setFormMode('create');
    } catch (err) {
      if (this.errorBanner) {
        this.errorBanner.textContent = err.message;
        this.errorBanner.hidden = false;
      }
    }
  }

  async executeDeletion() {
    if (!this.activeDeleteId) return;
    try {
      const response = await fetch(`/admin/generator/${this.activeDeleteId}`, { method: 'DELETE' });

      if (!response.ok) throw new Error('Wipe operation rejected by server.');

      const result = await response.json();

      if (result.success) {
        this.dispatchEvent(
          new CustomEvent('generator-log-deleted', { bubbles: true, detail: { id: this.activeDeleteId } }),
        );

        this.modal.close();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      this.activeDeleteId = null;
    }
  }
}
customElements.define('generator-log-manager', GeneratorLogManager);
