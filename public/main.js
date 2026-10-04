// ===== D-Day 카운터 =====
(function initDday() {
    // TODO: 실제 결혼식 날짜로 수정 (year, month-1, day, hour, minute, second)
    // 월은 0부터 시작: 1월=0, 2월=1, ...
    const weddingDate = new Date(2027, 0, 1, 13, 0, 0); // 2027-01-01 오후 1시
    const el = document.getElementById('dday');
    if (!el) return;

    const now = new Date();
    const diffMs = weddingDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        el.textContent = `D-${diffDays}`;
    } else if (diffDays === 0) {
        el.textContent = 'D-Day';
    } else {
        el.textContent = `결혼 ${Math.abs(diffDays)}일째`;
    }
})();

// ===== 갤러리 =====
(function initGallery() {
    const gallery = document.getElementById('gallery');
    const dotsContainer = document.getElementById('galleryDots');
    if (!gallery || !dotsContainer) return;

    const items = gallery.querySelectorAll('.gallery-item');
    if (items.length <= 1) return;

    items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `${i + 1}번째 사진`);
        dot.addEventListener('click', () => {
            items[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        });
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.gallery-dot');

    let scrollTimeout;
    gallery.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const activeIndex = Math.round(gallery.scrollLeft / gallery.offsetWidth);
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === activeIndex);
            });
        }, 50);
    });
})();
