// ── 커버 오버레이 스크롤 페이드 ──
(function() {
    function updateOverlay() {
        const cover = document.getElementById('cover');
        const coverH = cover.offsetHeight;
        const progress = Math.min(window.scrollY / (coverH * 0.25), 1);
        document.documentElement.style.setProperty('--overlay-opacity', 1 - progress);
    }
    window.addEventListener('scroll', updateOverlay, { passive: true });
    updateOverlay();
})();

// ── 지도 탭 전환 ──
function switchTab(btn, panelId) {
    document.querySelectorAll('.map-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.map-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(panelId).classList.remove('hidden');
}

// ── D-Day 카운터 ──
(function() {
    const wedding = new Date(2027, 1, 14, 11, 20, 0);
    const el = document.getElementById('dday');
    const now = new Date();
    const diff = Math.ceil((wedding - now) / 86400000);
    el.textContent = diff > 0 ? `D - ${diff}` : diff === 0 ? 'D - Day' : `결혼 ${Math.abs(diff)}일째`;
})();

// ── 떠오르는 꽃잎 애니메이션 ──
(function() {
    const container = document.getElementById('petals');
    if (!container) return;
    const symbols = ['♥', '❤', '♥', '❤', '♥'];
    for (let i = 0; i < 18; i++) {
        const el = document.createElement('span');
        el.className = 'petal';
        el.textContent = symbols[i % symbols.length];
        const left = Math.random() * 100;
        const duration = 8 + Math.random() * 12;
        const delay = Math.random() * 10;
        const drift = (Math.random() - 0.5) * 80;
        const spin = (Math.random() - 0.5) * 360;
        el.style.cssText = `
            left: ${left}%;
            animation-duration: ${duration}s;
            animation-delay: -${delay}s;
            font-size: ${8 + Math.random() * 6}px;
            --drift: ${drift}px;
            --spin: ${spin}deg;
        `;
        container.appendChild(el);
    }
})();

// ── 얼굴 그리기 캔버스 ──
function initDrawCanvas(canvasId, undoBtnId, eraseBtnId, clearBtnId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return { getDrawingData: () => null, resetCanvas: () => {} };
    const ctx = canvas.getContext('2d');
    const W = 240, H = 240;
    const DPR = 2;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);

    let skinFill = '#FFE0C8';

    function drawTemplate() {
        const cx = W / 2, cy = H / 2;
        const rx = W * 0.30;
        const ry = H * 0.35;
        const er = W * 0.085;
        const ea = er / ry;
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1a1a1a';
        ctx.fillStyle = skinFill;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx + rx, cy, er, -Math.PI / 2, Math.PI / 2, false);
        ctx.ellipse(cx, cy, rx, ry, 0, ea, Math.PI - ea, false);
        ctx.arc(cx - rx, cy, er, Math.PI / 2, Math.PI * 1.5, false);
        ctx.ellipse(cx, cy, rx, ry, 0, Math.PI + ea, Math.PI * 2 - ea, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    drawTemplate();

    let drawing = false, strokes = [], currentStroke = null, eraseMode = false;

    const eraseBtn = document.getElementById(eraseBtnId);
    if (eraseBtn) {
        eraseBtn.addEventListener('click', () => {
            eraseMode = !eraseMode;
            eraseBtn.textContent = eraseMode ? '펜으로' : '지우개';
            eraseBtn.classList.toggle('erase-active', eraseMode);
            canvas.style.cursor = eraseMode ? 'cell' : 'crosshair';
        });
    }

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: (src.clientX - r.left) * (W / r.width), y: (src.clientY - r.top) * (H / r.height) };
    }

    function applyStyle(type) {
        if (type === 'erase') { ctx.strokeStyle = skinFill; ctx.lineWidth = 22; }
        else { ctx.strokeStyle = '#000'; ctx.lineWidth = 3; }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }

    function redrawAll() {
        ctx.clearRect(0, 0, W, H);
        drawTemplate();
        strokes.forEach(s => {
            if (s.pts.length < 2) return;
            applyStyle(s.type);
            ctx.beginPath(); ctx.moveTo(s.pts[0].x, s.pts[0].y);
            for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x, s.pts[i].y);
            ctx.stroke();
        });
        const btn = document.getElementById(undoBtnId);
        if (btn) btn.disabled = strokes.length === 0;
    }

    function finishStroke() {
        if (drawing && currentStroke && currentStroke.length > 0) {
            strokes.push({ type: eraseMode ? 'erase' : 'draw', pts: currentStroke });
            const btn = document.getElementById(undoBtnId);
            if (btn) btn.disabled = false;
        }
        drawing = false; currentStroke = null;
    }

    let _activePtrs = 0;
    canvas.addEventListener('pointerdown', e => {
        _activePtrs++;
        if (_activePtrs > 1) { drawing = false; e.preventDefault(); return; }
        drawing = true;
        const p = getPos(e);
        currentStroke = [p];
        applyStyle(eraseMode ? 'erase' : 'draw');
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        e.preventDefault();
    });
    canvas.addEventListener('pointermove', e => {
        if (!drawing || _activePtrs > 1) return;
        const p = getPos(e);
        currentStroke.push(p);
        ctx.lineTo(p.x, p.y); ctx.stroke();
        e.preventDefault();
    });
    function _decPtr() { _activePtrs = Math.max(0, _activePtrs - 1); finishStroke(); }
    canvas.addEventListener('pointerup', _decPtr);
    canvas.addEventListener('pointerleave', _decPtr);
    canvas.addEventListener('pointercancel', _decPtr);

    // 핀치 줌
    let _pinchD0 = null, _pinchW0 = 220, _cvW = 220;
    canvas.style.width = _cvW + 'px'; canvas.style.height = _cvW + 'px';
    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
            const t = e.touches;
            _pinchD0 = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
            _pinchW0 = _cvW;
            e.preventDefault();
        }
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
        if (e.touches.length !== 2 || _pinchD0 === null) return;
        const t = e.touches;
        const d = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
        _cvW = Math.max(100, Math.min(360, Math.round(_pinchW0 * d / _pinchD0)));
        canvas.style.width = _cvW + 'px'; canvas.style.height = _cvW + 'px';
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', e => { if (e.touches.length < 2) _pinchD0 = null; });

    const undoBtn = document.getElementById(undoBtnId);
    if (undoBtn) undoBtn.addEventListener('click', () => { strokes.pop(); redrawAll(); });
    const clearBtn = document.getElementById(clearBtnId);
    if (clearBtn) clearBtn.addEventListener('click', () => {
        strokes = [];
        if (eraseMode && eraseBtn) { eraseMode = false; eraseBtn.textContent = '지우개'; eraseBtn.classList.remove('erase-active'); canvas.style.cursor = 'crosshair'; }
        redrawAll();
    });

    document.querySelectorAll('#skinSwatches .skin-swatch').forEach(el => {
        el.addEventListener('click', () => {
            skinFill = el.dataset.color;
            document.querySelectorAll('#skinSwatches .skin-swatch').forEach(s => s.classList.remove('active'));
            el.classList.add('active');
            redrawAll();
        });
    });

    const hasDrawing = () => strokes.some(s => s.type === 'draw');
    return {
        getDrawingData: () => hasDrawing() ? canvas.toDataURL('image/png') : null,
        resetCanvas: () => {
            strokes = [];
            if (eraseMode && eraseBtn) { eraseMode = false; eraseBtn.textContent = '지우개'; eraseBtn.classList.remove('erase-active'); canvas.style.cursor = 'crosshair'; }
            redrawAll();
        },
    };
}

// ── 스크롤 reveal ──
(function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

// ── 갤러리 dots ──
(function() {
    const gallery = document.getElementById('gallery');
    const dotsContainer = document.getElementById('galleryDots');
    const items = gallery.querySelectorAll('.gallery-item');

    items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => {
            items[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.gallery-dot');

    let t;
    gallery.addEventListener('scroll', () => {
        clearTimeout(t);
        t = setTimeout(() => {
            const idx = Math.round(gallery.scrollLeft / (gallery.offsetWidth * 0.72));
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }, 50);
    });
})();

// ── RSVP 팝업 ──
(function() {
    const skip = localStorage.getItem('rsvpSkipDate');
    const today = new Date().toDateString();
    if (skip === today) return;
    setTimeout(() => {
        document.getElementById('rsvpOverlay').classList.remove('hidden');
        document.body.classList.add('rsvp-open');
    }, 800);
})();

function closeRsvp() {
    document.getElementById('rsvpOverlay').classList.add('hidden');
    document.getElementById('rsvpOverlay').classList.remove('rsvp-fullscreen');
    document.body.classList.remove('rsvp-open');
}
function skipRsvpToday() {
    localStorage.setItem('rsvpSkipDate', new Date().toDateString());
    document.getElementById('rsvpOverlay').classList.add('hidden');
    document.body.classList.remove('rsvp-open');
}
function showRsvpForm() {
    document.getElementById('rsvpStep1').classList.add('hidden');
    document.getElementById('rsvpStep2').classList.remove('hidden');
    document.getElementById('rsvpOverlay').classList.add('rsvp-fullscreen');
    document.getElementById('rsvpCard').scrollTop = 0;
}

let rsvpAgreeChecked = false;
function toggleAgree() {
    rsvpAgreeChecked = !rsvpAgreeChecked;
    const box = document.getElementById('rsvpAgreeBox');
    box.classList.toggle('checked', rsvpAgreeChecked);
    box.textContent = rsvpAgreeChecked ? '✓' : '';
}

let guestCount = 0;
function changeCount(delta) {
    guestCount = Math.max(0, guestCount + delta);
    document.getElementById('rsvpCount').textContent = guestCount;
}

function selectRsvpChoice(btn) {
    const group = btn.dataset.group;
    document.querySelectorAll('.rsvp-choice[data-group="' + group + '"]').forEach(b => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.querySelector('.rsvp-choice-check').textContent = active ? '✓' : '○';
    });
    if (group === 'attend') {
        const attending = btn.dataset.val === '가능';
        const mealField = document.getElementById('mealField');
        if (mealField) mealField.style.display = attending ? '' : 'none';
    }
}

async function submitRsvp() {
    if (!rsvpAgreeChecked) {
        alert('개인정보 수집 및 이용에 동의해주세요.');
        return;
    }

    const submitBtn = document.querySelector('.rsvp-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '전달 중...'; }

    const attendActive = document.querySelector('.rsvp-choice[data-group="attend"].active');
    const sideActive   = document.querySelector('.rsvp-choice[data-group="side"].active');
    const mealActive   = document.querySelector('.rsvp-choice[data-group="meal"].active');

    const payload = {
        attend:       attendActive?.dataset.val || '가능',
        name:         document.getElementById('rsvpName')?.value.trim() || null,
        side:         sideActive?.dataset.val || null,
        phone:        document.getElementById('rsvpPhone')?.value.trim() || null,
        extra_guests: guestCount,
        meal:         mealActive?.dataset.val || null,
        message:      document.getElementById('rsvpMessage')?.value.trim() || null,
    };

    try {
        const res = await fetch('/api/rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.error || '전달에 실패했습니다. 다시 시도해 주세요.');
            return;
        }
        document.getElementById('rsvpStep2').classList.add('hidden');
        document.getElementById('rsvpStep3').classList.remove('hidden');
        document.getElementById('rsvpCard').scrollTop = 0;
    } catch {
        alert('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '전달하기'; }
    }
}

// ── 계좌 토글 ──
function toggleAccount(id) {
    document.getElementById(id).classList.toggle('open');
}

// ── 계좌번호 복사 ──
function copyAccount(btn, number) {
    const orig = btn.textContent;
    const done = () => {
        btn.textContent = '복사됨';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
    };
    if (navigator.clipboard) {
        navigator.clipboard.writeText(number).then(done).catch(done);
    } else {
        const ta = document.createElement('textarea');
        ta.value = number;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
    }
}

// ── RSVP CTA 버튼: 폼 바로 열기 ──
function openRsvpPopup() {
    document.getElementById('rsvpStep1').classList.add('hidden');
    document.getElementById('rsvpStep2').classList.remove('hidden');
    document.getElementById('rsvpStep3').classList.add('hidden');
    document.getElementById('rsvpOverlay').classList.remove('hidden');
    document.getElementById('rsvpOverlay').classList.add('rsvp-fullscreen');
    document.body.classList.add('rsvp-open');
    document.getElementById('rsvpCard').scrollTop = 0;
}

// ===== D-Day 카운터 =====
(function initDday() {
    const weddingDate = new Date(2027, 1, 14, 11, 20, 0); // 2027-02-14 오전 11:20
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

// ===== 방명록 =====
(function initGuestbook() {
    let editingId = null;
    let deletingId = null;
    const commentContents = new Map();

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    function formatDate(isoStr) {
        const d = new Date(isoStr);
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
    }

    const PLACEHOLDER = `<div class="face-placeholder"><svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="55" rx="10" ry="12" fill="#fff" stroke="#b89098" stroke-width="1.5"/><ellipse cx="87" cy="55" rx="10" ry="12" fill="#fff" stroke="#b89098" stroke-width="1.5"/><ellipse cx="50" cy="55" rx="37" ry="43" fill="#fff" stroke="#b89098" stroke-width="1.5"/></svg></div>`;

    function _scatterCell(el) {
        const dx = (Math.random() - 0.5) * 8;
        const dy = (Math.random() - 0.5) * 14;
        const r  = (Math.random() - 0.5) * 10;
        el.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${r.toFixed(1)}deg)`;
    }

    // ── 슬라이더 ──
    let _sliderPages = [];
    let _sliderTotalPages = 1;
    let _sliderScrollTimer = null;
    let _sliderObserver = null;

    function _buildSliderPage(comments) {
        const page = document.createElement('div');
        page.className = 'face-page';
        const grid = document.createElement('div');
        grid.className = 'face-grid';
        comments.forEach(c => {
            commentContents.set(String(c.id), c.content);
            const cell = document.createElement('div');
            cell.className = 'face-cell';
            cell.dataset.id = String(c.id);
            cell.innerHTML = (c.drawing ? `<img class="face-img" src="${c.drawing}" alt="">` : PLACEHOLDER)
                + `<span class="face-name-label">${escapeHtml(c.name)}</span>`;
            cell.addEventListener('click', () => showBubble(cell, c));
            _scatterCell(cell);
            grid.appendChild(cell);
        });
        page.appendChild(grid);
        return page;
    }

    function _syncPageBtn(slider, pagesContainer, idx) {
        pagesContainer.querySelectorAll('.slider-page-btn').forEach((b, i) => {
            b.classList.toggle('active', i === idx);
        });
    }

    function _setupSliderScroll(slider, pagesContainer) {
        slider.addEventListener('scroll', () => {
            _hideBubble();
            clearTimeout(_sliderScrollTimer);
            _sliderScrollTimer = setTimeout(() => {
                const sp = parseFloat(getComputedStyle(slider).scrollPaddingLeft) || 0;
                const pageW = slider.children.length > 1
                    ? slider.children[1].offsetLeft - slider.children[0].offsetLeft
                    : (slider.children[0]?.offsetWidth || slider.clientWidth);
                _syncPageBtn(slider, pagesContainer, Math.round((slider.scrollLeft + sp) / pageW));
            }, 80);
        }, { passive: true });
    }

    async function gbInitSlider() {
        const slider = document.getElementById('faceSlider');
        const pagesContainer = document.getElementById('faceSliderPages');
        if (!slider || !pagesContainer) return;

        slider.innerHTML = '';
        pagesContainer.innerHTML = '';
        _sliderPages = [];
        commentContents.clear();
        if (_sliderObserver) { _sliderObserver.disconnect(); _sliderObserver = null; }

        try {
            const res = await fetch('/api/comments?page=1');
            const data = await res.json();
            _sliderTotalPages = data.totalPages || 1;

            if (data.comments.length === 0) {
                slider.innerHTML = '<div class="face-grid-empty" style="padding:1.2rem 0">첫 번째 방명록을 남겨주세요!</div>';
                return;
            }

            // 슬롯 생성
            for (let p = 0; p < _sliderTotalPages; p++) {
                const slot = { loaded: false, el: null };
                const pageEl = p === 0
                    ? _buildSliderPage(data.comments)
                    : (() => { const ph = document.createElement('div'); ph.className = 'face-page'; return ph; })();
                slot.loaded = p === 0;
                slot.el = pageEl;
                slider.appendChild(pageEl);
                _sliderPages.push(slot);
            }
            const spacer = document.createElement('div');
            spacer.style.cssText = 'flex-shrink:0;width:calc(10% - 0.24rem)';
            slider.appendChild(spacer);

            // 페이지 버튼
            for (let p = 0; p < _sliderTotalPages; p++) {
                const btn = document.createElement('button');
                btn.className = 'slider-page-btn' + (p === 0 ? ' active' : '');
                btn.textContent = p + 1;
                btn.addEventListener('click', () => {
                    const pageEl = slider.children[p];
                    if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                    _syncPageBtn(slider, pagesContainer, p);
                    if (!_sliderPages[p].loaded) _loadSliderPage(p + 1, p);
                });
                pagesContainer.appendChild(btn);
            }

            _setupSliderScroll(slider, pagesContainer);

            // 미로드 페이지 lazy load
            if (_sliderTotalPages > 1) {
                _sliderObserver = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) return;
                        const idx = _sliderPages.findIndex(p => p.el === entry.target);
                        if (idx >= 0 && !_sliderPages[idx].loaded) _loadSliderPage(idx + 1, idx);
                    });
                }, { root: slider, threshold: 0.1 });
                _sliderPages.slice(1).forEach(p => _sliderObserver.observe(p.el));
            }
        } catch {
            slider.innerHTML = '<div class="face-grid-empty" style="padding:1.2rem 0">댓글을 불러오지 못했습니다.</div>';
        }
    }

    async function _loadSliderPage(apiPage, slotIdx) {
        const slot = _sliderPages[slotIdx];
        if (!slot || slot.loaded) return;
        slot.loaded = true;
        try {
            const res = await fetch(`/api/comments?page=${apiPage}`);
            const data = await res.json();
            const pageEl = _buildSliderPage(data.comments);
            slot.el.replaceWith(pageEl);
            slot.el = pageEl;
            if (_sliderObserver) { _sliderObserver.unobserve(slot.el); }
        } catch { slot.loaded = false; }
    }

    // ── 말풍선 ──
    const BUBBLE_W = 220;
    let _activeCellEl = null;
    let _bubbleScrollFn = null;

    function _placeBubble() {
        if (!_activeCellEl) return;
        const bubble = document.getElementById('faceBubble');
        const cellRect = _activeCellEl.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const bubbleH = bubble.offsetHeight || 130;
        const margin = 8;
        const topPx = cellRect.top - bubbleH - 10;
        const areaLeft = Math.max(0, bodyRect.left) + margin;
        const areaRight = Math.min(window.innerWidth, bodyRect.right) - margin;
        let left = cellRect.left + cellRect.width / 2 - BUBBLE_W / 2;
        left = Math.max(areaLeft, Math.min(areaRight - BUBBLE_W, left));
        const cellCenterX = cellRect.left + cellRect.width / 2;
        const arrowOff = Math.max(12, Math.min(BUBBLE_W - 12, cellCenterX - left));
        bubble.style.setProperty('--arrow-offset', arrowOff + 'px');
        bubble.style.left = left + 'px';
        bubble.style.top = topPx + 'px';
    }

    function _hideBubble() {
        const bubble = document.getElementById('faceBubble');
        if (bubble) bubble.classList.add('hidden');
        _activeCellEl = null;
        if (_bubbleScrollFn) { window.removeEventListener('scroll', _bubbleScrollFn); _bubbleScrollFn = null; }
    }

    function showBubble(cellEl, cmt) {
        const bubble = document.getElementById('faceBubble');
        if (!bubble) return;
        document.getElementById('bubbleName').textContent = cmt.name;
        document.getElementById('bubbleDate').textContent = formatDate(cmt.created_at);
        document.getElementById('bubbleMsg').textContent = cmt.content;
        document.getElementById('bubbleEditBtn').onclick = () => { _hideBubble(); openEditModal(String(cmt.id)); };
        document.getElementById('bubbleDeleteBtn').onclick = () => { _hideBubble(); openDeleteModal(String(cmt.id)); };
        _activeCellEl = cellEl;
        bubble.classList.remove('hidden');
        if (!_bubbleScrollFn) {
            _bubbleScrollFn = _placeBubble;
            window.addEventListener('scroll', _bubbleScrollFn, { passive: true });
        }
        requestAnimationFrame(_placeBubble);
    }

    document.addEventListener('click', e => {
        const bubble = document.getElementById('faceBubble');
        if (!bubble || bubble.classList.contains('hidden')) return;
        if (!bubble.contains(e.target) && !e.target.closest('.face-cell')) _hideBubble();
    });

    // ── gbOverlay ──
    let _drawCtrl = null;

    function openGuestbookForm() {
        document.getElementById('gbOverlay').classList.remove('hidden');
        document.body.classList.add('rsvp-open');
        if (!_drawCtrl) {
            _drawCtrl = initDrawCanvas('drawCanvas', 'drawUndoBtn', 'drawEraseBtn', 'drawClearBtn');
        }
    }

    function closeGuestbookForm() {
        document.getElementById('gbOverlay').classList.add('hidden');
        document.body.classList.remove('rsvp-open');
    }

    document.addEventListener('DOMContentLoaded', () => {
        const gbBackdrop = document.getElementById('gbBackdrop');
        if (gbBackdrop) gbBackdrop.addEventListener('click', closeGuestbookForm);
        const gbCloseBtn = document.getElementById('gbCloseBtn');
        if (gbCloseBtn) gbCloseBtn.addEventListener('click', closeGuestbookForm);
        const gbWriteBtn = document.getElementById('gbWriteBtn');
        if (gbWriteBtn) gbWriteBtn.addEventListener('click', openGuestbookForm);
    });

    document.getElementById('gbSubmitBtn').addEventListener('click', async () => {
        const btn = document.getElementById('gbSubmitBtn');
        const name = document.getElementById('gbName').value.trim();
        const password = document.getElementById('gbPassword').value;
        const content = document.getElementById('gbContent').value.trim();
        if (!name) { alert('이름을 입력해주세요.'); return; }
        if (!password) { alert('비밀번호를 입력해주세요.'); return; }
        if (!content) { alert('메시지를 입력해주세요.'); return; }
        btn.disabled = true; btn.textContent = '작성 중...';
        try {
            const drawing = _drawCtrl ? _drawCtrl.getDrawingData() : null;
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, content, drawing }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(res.status === 423 ? '현재 방명록이 잠겨 있습니다.' : (data.error || '작성에 실패했습니다.'));
                return;
            }
            document.getElementById('gbName').value = '';
            document.getElementById('gbPassword').value = '';
            document.getElementById('gbContent').value = '';
            if (_drawCtrl) _drawCtrl.resetCanvas();
            closeGuestbookForm();
            await gbInitSlider();
        } catch {
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            btn.disabled = false; btn.textContent = '작성하기';
        }
    });

    // ── 수정 모달 ──
    function openEditModal(id) {
        editingId = id;
        document.getElementById('editContent').value = commentContents.get(id) || '';
        document.getElementById('editPassword').value = '';
        document.getElementById('editError').textContent = '';
        document.getElementById('editModal').classList.add('open');
        document.getElementById('editPassword').focus();
    }
    function closeEditModal() {
        editingId = null;
        document.getElementById('editModal').classList.remove('open');
    }
    document.getElementById('editCancel').addEventListener('click', closeEditModal);
    document.getElementById('editBackdrop').addEventListener('click', closeEditModal);
    document.getElementById('editConfirm').addEventListener('click', async () => {
        const password = document.getElementById('editPassword').value;
        const content = document.getElementById('editContent').value.trim();
        const errEl = document.getElementById('editError');
        if (!password) { errEl.textContent = '비밀번호를 입력해주세요.'; return; }
        if (!content) { errEl.textContent = '내용을 입력해주세요.'; return; }
        try {
            const res = await fetch(`/api/comments/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, content }),
            });
            const data = await res.json();
            if (!res.ok) { errEl.textContent = data.error || '수정에 실패했습니다.'; return; }
            closeEditModal();
            await gbInitSlider();
        } catch {
            errEl.textContent = '네트워크 오류가 발생했습니다.';
        }
    });

    // ── 삭제 모달 ──
    function openDeleteModal(id) {
        deletingId = id;
        document.getElementById('deletePassword').value = '';
        document.getElementById('deleteError').textContent = '';
        document.getElementById('deleteModal').classList.add('open');
        document.getElementById('deletePassword').focus();
    }
    function closeDeleteModal() {
        deletingId = null;
        document.getElementById('deleteModal').classList.remove('open');
    }
    document.getElementById('deleteCancel').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteBackdrop').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteConfirm').addEventListener('click', async () => {
        const password = document.getElementById('deletePassword').value;
        const errEl = document.getElementById('deleteError');
        if (!password) { errEl.textContent = '비밀번호를 입력해주세요.'; return; }
        try {
            const res = await fetch(`/api/comments/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) { errEl.textContent = data.error || '삭제에 실패했습니다.'; return; }
            closeDeleteModal();
            await gbInitSlider();
        } catch {
            errEl.textContent = '네트워크 오류가 발생했습니다.';
        }
    });

    gbInitSlider();
})();


// ── 이미지 보호 ──
document.addEventListener('contextmenu', e => {
    if (e.target.closest('.gallery-item, .venue-diagram, .cover-photo')) e.preventDefault();
});

document.querySelectorAll('img').forEach(img => {
    img.draggable = false;
    img.addEventListener('dragstart', e => e.preventDefault());
});

document.querySelectorAll('.gallery-item').forEach(item => {
    const shield = document.createElement('div');
    shield.style.cssText = 'position:absolute;inset:0;z-index:3;cursor:default;-webkit-touch-callout:none;';
    shield.addEventListener('click', e => e.stopPropagation());
    shield.addEventListener('dblclick', e => { e.stopPropagation(); e.preventDefault(); });
    item.appendChild(shield);
});

const venueDiagram = document.querySelector('.venue-diagram');
if (venueDiagram) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;display:block;';
    venueDiagram.parentNode.insertBefore(wrap, venueDiagram);
    wrap.appendChild(venueDiagram);
    const shield = document.createElement('div');
    shield.style.cssText = 'position:absolute;inset:0;z-index:2;-webkit-touch-callout:none;pointer-events:none;';
    wrap.appendChild(shield);
}

if (window.visualViewport) {
    let zoomTimer = null;
    window.visualViewport.addEventListener('resize', () => {
        if (window.visualViewport.scale > 1.05) {
            document.body.classList.add('is-zoomed');
            clearTimeout(zoomTimer);
        } else {
            zoomTimer = setTimeout(() => document.body.classList.remove('is-zoomed'), 300);
        }
    });
}

/* ── 폰트 스위처 ── */
const FONTS = {
    1: { ko: "'KimNamYun', cursive",          en: "'Rock Salt', cursive"     },
    2: { ko: "'Nanum Brush Script', cursive",  en: "'Rock Salt', cursive"     },
    3: { ko: "'Nanum Pen Script', cursive",    en: "'Pinyon Script', cursive" },
    4: { ko: "'Single Day', cursive",          en: "'Alex Brush', cursive"    },
    5: { ko: "'Sunflower', cursive",           en: "'Italianno', cursive"     },
};

function applyFont(n) {
    const f = FONTS[n];
    const root = document.documentElement;
    root.style.setProperty('--font-ko', f.ko);
    root.style.setProperty('--font-en', f.en);
    document.querySelectorAll('.font-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.font) === n);
    });
}

applyFont(1);
