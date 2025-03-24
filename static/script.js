document.addEventListener('DOMContentLoaded', async function () {
    const calendarEl = document.getElementById('calendar');
    const selectedDate = document.getElementById('selected-date');
    const todoInput = document.getElementById('daily-todo');
    const emojiBtns = document.querySelectorAll('.emoji-btn');

    const diaryTitle = document.getElementById('diary-title');
    const diaryContent = document.getElementById('diary-content');
    const diaryList = document.getElementById('diary-list');
    const diaryForm = document.getElementById('diary-form');
    const diarySaveBtn = document.getElementById('diary-save-btn');

    let currentDate = '';
    let selectedEmoji = '';
    let editDiaryId = null; // 🔥 수정 모드 상태 변수

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ko',
        selectable: true,
        dateClick: function (info) {
            currentDate = info.dateStr;
            selectedDate.textContent = `${currentDate} 오늘 하루는 어땠나요📌`;
            todoInput.value = '';
            selectedEmoji = '';
        }
    });
    calendar.render();

    // 일정 불러오기
    const scheduleRes = await fetch('/api/schedules');
    const schedules = await scheduleRes.json();
    schedules.forEach(event => {
        let title = '';
        if (event.emoji) title += event.emoji + ' ';
        if (event.content) title += event.content;
        calendar.addEvent({ title, start: event.date });
    });

    // 이모지 버튼
    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedEmoji = btn.textContent;
            emojiBtns.forEach(b => b.classList.remove('btn-info'));
            btn.classList.add('btn-info');
        });
    });

    // 일정 저장
    document.getElementById('save-btn').addEventListener('click', async () => {
        if (!currentDate) return alert("날짜를 먼저 선택하세요!");
        const content = todoInput.value.trim();
        if (!content && !selectedEmoji) return alert("내용 또는 이모지를 입력하세요!");

        const res = await fetch('/api/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: currentDate, content, emoji: selectedEmoji })
        });

        if (res.ok) {
            let title = '';
            if (selectedEmoji) title += selectedEmoji + ' ';
            if (content) title += content;
            calendar.addEvent({ title, start: currentDate });
            alert("저장되었습니다!");
            todoInput.value = '';
        }
    });

    // 일기 불러오기
    async function loadDiaries(keyword = '', type = 'all') {
        const res = await fetch(`/api/diary?keyword=${keyword}&type=${type}`);
        const diaries = await res.json();
        diaryList.innerHTML = diaries.map(d => `
            <div class="card mb-2">
                <div class="card-body">
                    <h5 class="card-title">${d.title} <small class="text-muted">(${d.created_at.slice(0, 10)})</small></h5>
                    <p class="card-text">${d.content}</p>
                    <button onclick="startEditDiary(${d.id}, '${d.title}', \`${d.content}\`)" class="btn btn-sm btn-outline-primary">수정</button>
                    <button onclick="deleteDiary(${d.id})" class="btn btn-sm btn-outline-danger">삭제</button>
                </div>
            </div>
        `).join('');
    }

    // 일기쓰기 버튼 클릭
    document.getElementById('diary-add-btn').addEventListener('click', () => {
        editDiaryId = null;  // ✨ 새로 쓰기 모드
        diaryTitle.value = '';
        diaryContent.value = '';
        diarySaveBtn.textContent = '일기 저장';
        diaryForm.style.display = 'block';
    });

    // 저장 버튼 클릭 (작성 or 수정 모두 처리)
    diarySaveBtn.addEventListener('click', async () => {
        const title = diaryTitle.value.trim();
        const content = diaryContent.value.trim();
        if (!title || !content) return alert("제목과 내용을 입력해주세요!");

        if (editDiaryId) {
            // 수정 모드
            await fetch(`/api/diary/${editDiaryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });
        } else {
            // 작성 모드
            await fetch('/api/diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });
        }

        editDiaryId = null;
        diaryForm.style.display = 'none';
        diaryTitle.value = '';
        diaryContent.value = '';
        loadDiaries();
    });

    // 수정 버튼 클릭 시 → 폼에 데이터 채워넣고 모드 전환
    window.startEditDiary = function (id, title, content) {
        editDiaryId = id;
        diaryTitle.value = title;
        diaryContent.value = content;
        diarySaveBtn.textContent = '수정 완료';
        diaryForm.style.display = 'block';
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    // 삭제
    window.deleteDiary = async (id) => {
        if (confirm("정말 삭제할까요?")) {
            await fetch(`/api/diary/${id}`, { method: 'DELETE' });
            loadDiaries();
        }
    }

    // 검색
    document.getElementById('diary-search-btn').addEventListener('click', () => {
        const keyword = document.getElementById('diary-search').value;
        const type = document.getElementById('diary-search-type').value;
        loadDiaries(keyword, type);
    });

    // 초기 일기 목록 불러오기
    loadDiaries();
});














