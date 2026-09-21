/*
 * 活動專區渲染程式
 * 讀取 events-data.js 的 window.EVENTS_DATA，產生「即將舉行」與「活動回顧」。
 * 一般情況下不需修改本檔，新增活動請編輯 events-data.js。
 */
(function () {
    "use strict";

    const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
    const TYPE_CLASS = {
        "大師講座": "is-lecture",
        "推廣說明會": "is-briefing"
    };

    // ---------- 工具函式 ----------

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // "2026-10-01" 解析為當地時間的午夜，避免時區造成日期偏移
    function parseDate(str) {
        const [y, m, d] = str.split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    function todayMidnight() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    function formatDate(str) {
        const date = parseDate(str);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${date.getFullYear()}/${mm}/${dd}（${WEEKDAYS[date.getDay()]}）`;
    }

    function daysUntil(str) {
        const diff = parseDate(str) - todayMidnight();
        return Math.round(diff / 86400000);
    }

    function typeBadge(type) {
        const cls = TYPE_CLASS[type] || "is-lecture";
        return `<span class="event-type ${cls}">${escapeHtml(type)}</span>`;
    }

    function metaList(event) {
        const rows = [
            ["bi-calendar-event", "日期", formatDate(event.date)],
            ["bi-clock", "時間", event.time],
            ["bi-geo-alt", "地點", event.location]
        ].filter(([, , value]) => value);

        return `
            <ul class="event-meta">
                ${rows.map(([icon, label, value]) => `
                    <li>
                        <i class="bi ${icon}" aria-hidden="true"></i>
                        <span><span class="visually-hidden">${label}：</span>${escapeHtml(value)}</span>
                    </li>`).join("")}
            </ul>`;
    }

    function agendaList(agenda) {
        if (!agenda || !agenda.length) return "";
        return `
            <ol class="agenda" aria-label="活動議程">
                ${agenda.map(row => `
                    <li><time>${escapeHtml(row.time)}</time><span>${escapeHtml(row.item)}</span></li>
                `).join("")}
            </ol>`;
    }

    // 圖片載入失敗時保留灰色底框，不顯示破圖
    function attachImageFallback(root) {
        root.querySelectorAll("img[data-fallback]").forEach(img => {
            img.addEventListener("error", () => {
                img.style.visibility = "hidden";
            }, { once: true });
        });
    }

    // 封面若是直式圖片（例如海報），改為對齊上緣，保留標題區
    function markPortraitCovers(root) {
        root.querySelectorAll(".past-cover img").forEach(img => {
            const check = () => {
                if (img.naturalHeight > img.naturalWidth) {
                    img.closest(".past-cover").classList.add("is-portrait");
                }
            };
            if (img.complete && img.naturalWidth) check();
            else img.addEventListener("load", check, { once: true });
        });
    }

    // 活動開始時間（以台灣時間 UTC+8 計算），取 time 欄位開頭的 HH:MM
    function startDateTime(event) {
        const match = /(\d{1,2}):(\d{2})/.exec(event.time || "");
        const hh = match ? match[1].padStart(2, "0") : "00";
        const mm = match ? match[2] : "00";
        return new Date(`${event.date}T${hh}:${mm}:00+08:00`);
    }

    // ---------- 即將舉行 ----------

    function countdownText(days) {
        if (days === 0) return `<span class="upcoming-countdown">今天舉行</span>`;
        return `<span class="upcoming-countdown">還有 ${days} 天</span>`;
    }

    function registrationBlock(reg) {
        if (reg && reg.url) {
            return `
                <a class="events-cta-btn" href="${escapeHtml(reg.url)}" target="_blank" rel="noopener noreferrer">
                    立即報名 <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                </a>`;
        }
        const note = (reg && reg.note) || "報名連結開放後將於本頁公告";
        return `
            <button type="button" class="events-cta-btn" disabled aria-describedby="reg-note">報名即將開放</button>
            <p class="note" id="reg-note">${escapeHtml(note)}</p>`;
    }

    function renderUpcoming(event) {
        const days = daysUntil(event.date);
        return `
            <article class="upcoming-card" id="event-${escapeHtml(event.id)}">
                <figure class="upcoming-poster">
                    <img src="${escapeHtml(event.cover)}" alt="${escapeHtml(event.title)} 活動海報"
                         width="600" height="800" data-fallback>
                </figure>
                <div class="upcoming-body">
                    <div class="upcoming-top">
                        ${typeBadge(event.type)}
                        ${countdownText(days)}
                    </div>
                    <div>
                        ${event.series ? `<p class="upcoming-series">${escapeHtml(event.series)}</p>` : ""}
                        <h3>${escapeHtml(event.title)}</h3>
                    </div>
                    ${event.speaker ? `<p class="upcoming-speaker">主講：${escapeHtml(event.speaker)}</p>` : ""}
                    ${metaList(event)}
                    ${event.summary ? `<p class="upcoming-desc">${escapeHtml(event.summary)}</p>` : ""}
                    ${agendaList(event.agenda)}
                    <div class="upcoming-actions">
                        ${registrationBlock(event.registration)}
                    </div>
                </div>
            </article>`;
    }

    // ---------- 活動回顧 ----------

    function renderPast(event) {
        return `
            <article class="past-card" id="event-${escapeHtml(event.id)}">
                <figure class="past-cover">
                    <img src="${escapeHtml(event.cover)}" alt="" loading="lazy"
                         width="800" height="500" data-fallback>
                </figure>
                <div class="past-body">
                    <div class="past-date">
                        <time datetime="${escapeHtml(event.date)}">${formatDate(event.date)}</time>
                        ${typeBadge(event.type)}
                    </div>
                    <h3>${escapeHtml(event.title)}</h3>
                    <p class="past-excerpt">${escapeHtml(event.summary)}</p>
                    <button type="button" class="past-more"
                            data-bs-toggle="modal" data-bs-target="#eventModal"
                            data-event-id="${escapeHtml(event.id)}"
                            aria-label="查看活動紀錄：${escapeHtml(event.title)}">
                        查看活動紀錄
                    </button>
                </div>
            </article>`;
    }

    // ---------- Modal ----------

    function renderCarousel(event) {
        const photos = event.photos || [];
        if (!photos.length) return "";

        const multiple = photos.length > 1;
        const id = "eventCarousel";

        const indicators = multiple ? `
            <div class="carousel-indicators">
                ${photos.map((_, i) => `
                    <button type="button" data-bs-target="#${id}" data-bs-slide-to="${i}"
                            ${i === 0 ? 'class="active" aria-current="true"' : ""}
                            aria-label="第 ${i + 1} 張照片"></button>`).join("")}
            </div>` : "";

        const controls = multiple ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">上一張</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">下一張</span>
            </button>` : "";

        return `
            <div id="${id}" class="carousel slide" aria-label="活動照片">
                ${indicators}
                <div class="carousel-inner">
                    ${photos.map((p, i) => `
                        <div class="carousel-item ${i === 0 ? "active" : ""}">
                            <img src="${escapeHtml(p.src)}" alt="${escapeHtml(p.alt || event.title)}"
                                 loading="lazy" width="1200" height="800">
                        </div>`).join("")}
                </div>
                ${controls}
            </div>
            ${multiple ? `<p class="photo-count">共 ${photos.length} 張照片</p>` : ""}`;
    }

    function renderLinks(links) {
        if (!links || !links.length) return "";
        return `
            <h3>相關報導</h3>
            <ul class="event-links">
                ${links.map(link => `
                    <li>
                        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(link.text)}
                            <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i>
                            <span class="visually-hidden">（另開新視窗）</span>
                        </a>
                    </li>`).join("")}
            </ul>`;
    }

    function fillModal(modal, event) {
        modal.querySelector(".modal-title").textContent = event.title;
        modal.querySelector(".modal-body").innerHTML = `
            <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
                ${typeBadge(event.type)}
                ${event.speaker ? `<span class="text-secondary">主講：${escapeHtml(event.speaker)}</span>` : ""}
            </div>
            ${renderCarousel(event)}
            ${metaList(event)}
            <p class="modal-summary mt-3 mb-0">${escapeHtml(event.summary)}</p>
            ${agendaList(event.agenda) ? `<h3>活動議程</h3>${agendaList(event.agenda)}` : ""}
            ${renderLinks(event.links)}`;
    }

    // ---------- 頁首：下一場活動 ----------

    function renderNextEvent(root, event) {
        if (!event) {
            root.innerHTML = `
                <p class="next-event-label">下一場活動</p>
                <p class="next-event-empty">近期活動規劃中，歡迎加入會員，第一時間收到通知。</p>
                <a class="next-event-link" href="#past-title">看看過去的活動</a>`;
            return;
        }

        root.innerHTML = `
            <p class="next-event-label">下一場活動</p>
            <p class="next-event-date">
                <time datetime="${escapeHtml(event.date)}">${formatDate(event.date)}</time>
            </p>
            <h2 class="next-event-title">${escapeHtml(event.title)}</h2>
            ${event.speaker ? `<p class="next-event-speaker">${escapeHtml(event.speaker)}</p>` : ""}
            <div class="countdown" data-start="${startDateTime(event).toISOString()}">
                <div class="countdown-unit"><span class="countdown-num" data-unit="d">0</span><span class="countdown-label">天</span></div>
                <div class="countdown-unit"><span class="countdown-num" data-unit="h">00</span><span class="countdown-label">時</span></div>
                <div class="countdown-unit"><span class="countdown-num" data-unit="m">00</span><span class="countdown-label">分</span></div>
            </div>
            <p class="visually-hidden countdown-sr"></p>
            <a class="next-event-link" href="#event-${escapeHtml(event.id)}">查看活動詳情</a>`;

        startCountdown(root.querySelector(".countdown"), root.querySelector(".countdown-sr"));
    }

    // 每 30 秒更新一次；只顯示到「分」，不做每秒跳動，避免干擾閱讀
    function startCountdown(el, srText) {
        if (!el) return;
        const start = new Date(el.dataset.start);
        const nums = {
            d: el.querySelector('[data-unit="d"]'),
            h: el.querySelector('[data-unit="h"]'),
            m: el.querySelector('[data-unit="m"]')
        };

        function tick() {
            const diff = start - new Date();
            if (diff <= 0) {
                el.outerHTML = `<p class="countdown-live">活動進行中，歡迎蒞臨</p>`;
                srText.textContent = "";
                clearInterval(timer);
                return;
            }
            const totalMin = Math.floor(diff / 60000);
            const d = Math.floor(totalMin / 1440);
            const h = Math.floor((totalMin % 1440) / 60);
            const m = totalMin % 60;
            nums.d.textContent = d;
            nums.h.textContent = String(h).padStart(2, "0");
            nums.m.textContent = String(m).padStart(2, "0");
            srText.textContent = `距離活動開始還有 ${d} 天 ${h} 小時 ${m} 分`;
        }

        const timer = setInterval(tick, 30000);
        tick();
    }

    // ---------- 頁首：活動時間軸 ----------

    function renderTimeline(root, events) {
        if (!events.length) {
            root.hidden = true;
            return;
        }

        const sorted = [...events].sort((a, b) => parseDate(a.date) - parseDate(b.date));
        const nextId = (sorted.find(e => daysUntil(e.date) >= 0) || {}).id;
        const pastCount = sorted.filter(e => daysUntil(e.date) < 0).length;

        // 進度線：填到最後一場已舉辦的活動節點為止
        const progress = sorted.length > 1
            ? Math.max(0, pastCount - 1) / (sorted.length - 1)
            : 0;

        const items = sorted.map(e => {
            const date = parseDate(e.date);
            const label = `${date.getMonth() + 1}/${date.getDate()}`;
            const name = escapeHtml(e.shortTitle || e.type);
            const isPast = daysUntil(e.date) < 0;
            const isNext = e.id === nextId;
            const state = isPast ? "is-past" : isNext ? "is-next" : "is-future";

            // 已舉辦：開啟活動紀錄；未舉辦：捲動到即將舉行區塊
            const control = isPast
                ? `<button type="button" class="tl-node" data-bs-toggle="modal" data-bs-target="#eventModal"
                          data-event-id="${escapeHtml(e.id)}"
                          aria-label="${label} ${name}，已舉辦，查看活動紀錄">`
                : `<a class="tl-node" href="#event-${escapeHtml(e.id)}"
                      aria-label="${label} ${name}，即將舉行，查看活動資訊">`;
            const close = isPast ? "</button>" : "</a>";

            return `
                <li class="tl-item ${state}" ${isNext ? 'aria-current="step"' : ""}>
                    ${control}
                        <span class="tl-dot" aria-hidden="true"></span>
                        <span class="tl-date" aria-hidden="true">${label}</span>
                        <span class="tl-name" aria-hidden="true">${name}</span>
                        ${isNext ? '<span class="tl-tag" aria-hidden="true">即將舉行</span>' : ""}
                    ${close}
                </li>`;
        }).join("");

        root.innerHTML = `
            <div class="tl-scroll">
                <ol class="tl-list" style="--tl-count: ${sorted.length}; --tl-progress: ${progress};">
                    ${items}
                </ol>
            </div>`;

        // 手機寬度下時間軸可橫向捲動，預設捲到下一場活動的位置
        const scroller = root.querySelector(".tl-scroll");
        const nextNode = root.querySelector(".tl-item.is-next");
        if (nextNode && scroller.scrollWidth > scroller.clientWidth) {
            scroller.scrollLeft = nextNode.offsetLeft - scroller.clientWidth / 2 + nextNode.offsetWidth / 2;
        }
    }

    // ---------- 初始化 ----------

    document.addEventListener("DOMContentLoaded", function () {
        const data = Array.isArray(window.EVENTS_DATA) ? window.EVENTS_DATA : [];
        const upcomingRoot = document.getElementById("upcoming-events");
        const pastRoot = document.getElementById("past-events");
        const modal = document.getElementById("eventModal");
        if (!upcomingRoot || !pastRoot) return;

        const byId = new Map(data.map(e => [e.id, e]));

        const upcoming = data
            .filter(e => daysUntil(e.date) >= 0)
            .sort((a, b) => parseDate(a.date) - parseDate(b.date));

        const past = data
            .filter(e => daysUntil(e.date) < 0)
            .sort((a, b) => parseDate(b.date) - parseDate(a.date));

        upcomingRoot.innerHTML = upcoming.length
            ? upcoming.map(renderUpcoming).join("")
            : `<p class="events-empty">目前沒有即將舉行的活動，歡迎加入會員，第一時間收到活動通知。</p>`;

        pastRoot.innerHTML = past.length
            ? `<div class="past-grid">${past.map(renderPast).join("")}</div>`
            : `<p class="events-empty">活動紀錄整理中。</p>`;

        attachImageFallback(upcomingRoot);
        attachImageFallback(pastRoot);
        markPortraitCovers(pastRoot);

        const nextRoot = document.getElementById("next-event");
        const timelineRoot = document.getElementById("events-timeline");
        if (nextRoot) renderNextEvent(nextRoot, upcoming[0]);
        if (timelineRoot) renderTimeline(timelineRoot, data);

        if (modal) {
            modal.addEventListener("show.bs.modal", function (e) {
                const trigger = e.relatedTarget;
                const event = trigger && byId.get(trigger.dataset.eventId);
                if (event) fillModal(modal, event);
            });

            // 關閉時清空內容，避免下次開啟短暫閃現上一場活動
            modal.addEventListener("hidden.bs.modal", function () {
                modal.querySelector(".modal-body").innerHTML = "";
            });
        }
    });
})();
