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

// ===== 댓글(방명록) =====
(function initComments() {
    let currentPage = 1;
    let editingId = null;
    let deletingId = null;
    const commentContents = new Map(); // id(string) -> raw content (서버에서 raw 저장, 여기서 escape)

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

    function renderComments(comments, total, page, totalPages) {
        const list = document.getElementById('commentsList');
        const pagination = document.getElementById('pagination');

        if (comments.length === 0 && page === 1) {
            list.innerHTML = '<p class="comments-empty">아직 방명록이 없습니다.<br>첫 번째 축하 메시지를 남겨주세요!</p>';
            pagination.innerHTML = '';
            return;
        }

        // raw content를 Map에 저장 — edit 시 DOM/attribute에서 꺼내지 않고 여기서 꺼냄
        commentContents.clear();
        comments.forEach(c => commentContents.set(String(c.id), c.content));

        list.innerHTML = comments.map(c => `
            <div class="comment-item" data-id="${c.id}">
                <div class="comment-header">
                    <span class="comment-name">${escapeHtml(c.name)}</span>
                    <span class="comment-date">${formatDate(c.created_at)}</span>
                </div>
                <p class="comment-content">${escapeHtml(c.content)}</p>
                <div class="comment-actions">
                    <button class="btn-action btn-edit" data-id="${c.id}">수정</button>
                    <button class="btn-action btn-delete" data-id="${c.id}">삭제</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
        list.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
        });

        const safeTotal = Math.max(1, totalPages);
        pagination.innerHTML = '';
        for (let i = 1; i <= safeTotal; i++) {
            const btn = document.createElement('button');
            btn.className = 'page-btn' + (i === page ? ' active' : '');
            btn.textContent = i;
            btn.addEventListener('click', () => loadComments(i));
            pagination.appendChild(btn);
        }
    }

    async function loadComments(page) {
        currentPage = page;
        try {
            const res = await fetch(`/api/comments?page=${page}`);
            const data = await res.json();
            renderComments(data.comments, data.total, data.page, data.totalPages);
        } catch {
            document.getElementById('commentsList').innerHTML =
                '<p class="comments-empty">댓글을 불러오지 못했습니다.</p>';
        }
    }

    document.getElementById('commentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        const name = document.getElementById('commentName').value.trim();
        const password = document.getElementById('commentPassword').value;
        const content = document.getElementById('commentContent').value.trim();

        btn.disabled = true;
        btn.textContent = '작성 중...';

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, content }),
            });
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 423) {
                    const form = document.getElementById('commentForm');
                    form.querySelectorAll('input, textarea, button').forEach(el => { el.disabled = true; });
                    const lockMsg = document.createElement('p');
                    lockMsg.className = 'comments-empty';
                    lockMsg.textContent = '현재 방명록이 잠겨 있습니다.';
                    form.after(lockMsg);
                } else {
                    alert(data.error || '작성에 실패했습니다.');
                }
                return;
            }

            e.target.reset();
            await loadComments(1);
            document.getElementById('commentsList').scrollIntoView({ behavior: 'smooth' });
        } catch {
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            btn.disabled = false;
            btn.textContent = '작성하기';
        }
    });

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
            await loadComments(currentPage);
        } catch {
            errEl.textContent = '네트워크 오류가 발생했습니다.';
        }
    });

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
            await loadComments(currentPage > 1 ? currentPage - 1 : 1);
        } catch {
            errEl.textContent = '네트워크 오류가 발생했습니다.';
        }
    });

    loadComments(1);
})();
