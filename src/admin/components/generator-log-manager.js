import { GeneratorBase } from 'js/generator-base.js';

class GeneratorLogManager extends GeneratorBase {
  constructor() {
    super();
    this.activeDeleteId = null;
  }

  connectedCallback() {
    this.form = this.querySelector('.generator-form');
    this.formAccordion = this.querySelector('.form-accordion');
    this.modeTitle = this.querySelector('.form-mode-title');
    this.idField = this.querySelector('.log-id-field');
    this.errorBanner = this.querySelector('.form-error-banner');

    this.cancelBtn = this.querySelector('.cancel-edit-btn');
    this.createBtn = this.querySelector('.switch-to-create-btn');
    this.modal = this.querySelector('#delete-confirm-modal');

    // Wire component layout triggers
    this.form?.addEventListener('submit', e => this.handleFormSubmit(e));
    this.cancelBtn?.addEventListener('click', () => this.setFormMode('create'));
    this.createBtn?.addEventListener('click', () => this.setFormMode('create'));

    // Handle incoming row edit trigger requests via bubbles
    this.addEventListener('edit-log-request', e => {
      this.handleEditFill(e.detail.fields);
    });

    // Intercept native child deletion notifications to trigger the dialog
    this.addEventListener('click', event => {
      const deleteBtn = event.target.closest('.delete-log-btn');
      if (deleteBtn) {
        event.stopPropagation();
        this.activeDeleteId = deleteBtn.dataset.id;
        this.modal?.showModal();
      }
    });

    // Modal Confirmation Actions
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
    if (!this.form) return;
    this.setFormMode('edit');
    if (this.formAccordion) this.formAccordion.setAttribute('open', '');

    this.form.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.name) {
        input.value = fields[input.name] || '';
      }
    });
    this.form.querySelector('input[name="date"]')?.focus();
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

      this.setFormMode('create');
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
