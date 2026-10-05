class ImageLightboxGallery extends HTMLElement {
  connectedCallback() {
    this.grid = this.querySelector('.image-gallery-container');
    this.dialog = this.querySelector('.lightbox-modal');
    this.lightboxImg = this.querySelector('.lightbox-img');
    this.lightboxCaption = this.querySelector('.lightbox-caption');
    this.prevBtn = this.querySelector('.prev-btn');
    this.nextBtn = this.querySelector('.next-btn');

    this.items = [];
    this.currentIndex = 0;

    // Extract details mapping securely
    const triggers = this.grid.querySelectorAll('.gallery-trigger');
    triggers.forEach((btn, index) => {
      const liveImg = btn.querySelector('img');
      btn.setAttribute('data-index', index);
      // Change this line inside triggers.forEach loop:
      this.items.push({
        src: liveImg.getAttribute('src') || liveImg.src,
        alt: btn.getAttribute('data-alt'),
      });
    });

    this.grid.addEventListener('click', e => this.handleImageClick(e));
    this.prevBtn.addEventListener('click', () => this.navigate(-1));
    this.nextBtn.addEventListener('click', () => this.navigate(1));
    this.dialog.addEventListener('keydown', e => this.handleKeyDown(e));
  }

  updateLightbox(index) {
    this.currentIndex = index;
    const item = this.items[this.currentIndex];
    this.lightboxImg.src = item.src;
    this.lightboxImg.alt = item.alt;
    this.lightboxCaption.textContent = item.alt || 'Image View';
  }

  navigate(direction) {
    let newIndex = (this.currentIndex + direction + this.items.length) % this.items.length;
    this.updateLightbox(newIndex);
  }

  handleImageClick(e) {
    const trigger = e.target.closest('.gallery-trigger');
    if (!trigger) return;

    const index = parseInt(trigger.getAttribute('data-index'), 10);
    this.updateLightbox(index);
    this.dialog.showModal();
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowLeft') this.navigate(-1);
    if (e.key === 'ArrowRight') this.navigate(1);
  }
}

customElements.define('image-lightbox-gallery', ImageLightboxGallery);
