/*
 * 活動渲染程式
 * 讀取 events-data.js 的 window.EVENTS_DATA：
 *   - 活動頁（events.html）：頁首倒數、時間軸、即將舉行、活動回顧
 *   - 活動頁（events.html）：人才培訓課程（讀取 window.COURSES_DATA）
 *   - 首頁（index.html）：「最新活動」區塊
 *   - 媒體報導頁（cases.html）：從活動與課程的 links 自動產生報導列表
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
    function markPortraitCovers(root, selector = ".past-cover") {
        root.querySelectorAll(`${selector} img`).forEach(img => {
            const check = () => {
                if (img.naturalHeight > img.naturalWidth) {
                    img.closest(selector).classList.add("is-portrait");
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

    // 有報名連結才顯示「立即報名」按鈕；沒有連結時不顯示任何報名區塊
    function registrationBlock(reg) {
        if (!reg || !reg.url) return "";
        return `
            <div class="upcoming-actions">
                <a class="events-cta-btn" href="${escapeHtml(reg.url)}" target="_blank" rel="noopener noreferrer">
                    立即報名 <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                </a>
            </div>`;
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
                    ${registrationBlock(event.registration)}
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

    // ---------- 人才培訓課程 ----------

    function formatShortDate(str) {
        const d = parseDate(str);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }

    // 依上課日期判斷場次狀態；上課當天仍算「進行中」
    function classStatus(dates) {
        const sorted = [...dates].sort();
        const total = sorted.length;
        const done = sorted.filter(d => daysUntil(d) < 0).length;
        const todayIsClass = sorted.some(d => daysUntil(d) === 0);

        if (done === total) return { key: "done", text: "已結訓" };
        if (done === 0 && !todayIsClass) {
            return { key: "soon", text: `即將開課（${formatShortDate(sorted[0])} 起）` };
        }
        return { key: "live", text: `進行中，已完成 ${done}／${total} 堂` };
    }

    function galleryButton(key, count, label) {
        if (!count) return "";
        return `
            <button type="button" class="course-gallery-btn"
                    data-bs-toggle="modal" data-bs-target="#eventModal" data-gallery="${escapeHtml(key)}"
                    aria-label="查看${escapeHtml(label)}課程照片，共 ${count} 張">
                <i class="bi bi-images" aria-hidden="true"></i> 課程照片（${count}）
            </button>`;
    }

    function coverFigure(photos, cls) {
        const src = photos && photos[0] && photos[0].src;
        if (!src) return "";
        return `
            <figure class="${cls}">
                <img src="${escapeHtml(src)}" alt="" loading="lazy" width="800" height="600" data-fallback>
            </figure>`;
    }

    function renderProgram(c) {
        const sessions = [...(c.sessions || [])].sort((a, b) => parseDate(a.date) - parseDate(b.date));
        const range = sessions.length
            ? `<span class="nowrap">${formatDate(sessions[0].date)} – ${formatDate(sessions[sessions.length - 1].date)}</span><span class="nowrap">，共 ${sessions.length} 堂</span>`
            : "";

        return `
            <article class="course-card course-program" id="course-${escapeHtml(c.id)}">
                <header class="course-head">
                    <span class="course-type">${escapeHtml(c.type)}</span>
                    <h3>${escapeHtml(c.title)}</h3>
                    ${range ? `<p class="course-range">${range}</p>` : ""}
                    <p class="course-intro">${escapeHtml(c.intro)}</p>
                </header>
                <div class="course-program-body">
                    <div class="course-program-media">
                        ${coverFigure(c.photos, "course-cover")}
                        <div class="course-actions">
                            ${galleryButton(c.id, (c.photos || []).length, c.title)}
                            ${(c.links || []).map(l => `
                                <a class="course-link" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">
                                    ${escapeHtml(l.text)} <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                                    <span class="visually-hidden">（另開新視窗）</span>
                                </a>`).join("")}
                        </div>
                    </div>
                    <ol class="session-list" aria-label="課程表">
                        ${sessions.map((ss, i) => `
                            <li>
                                <div class="session-when">
                                    <span class="session-no">第 ${i + 1} 堂</span>
                                    <time datetime="${escapeHtml(ss.date)}">${formatDate(ss.date)}</time>
                                </div>
                                <div>
                                    <h4>${escapeHtml(ss.name)}</h4>
                                    <p>${escapeHtml(ss.outline)}</p>
                                </div>
                            </li>`).join("")}
                    </ol>
                </div>
            </article>`;
    }

    function renderClasses(c) {
        const stats = (c.stats || []).map(st => `
            <div class="course-stat">
                <p class="course-stat-value">${escapeHtml(st.value)}<span>${escapeHtml(st.unit)}</span></p>
                <p class="course-stat-label">${escapeHtml(st.label)}</p>
            </div>`).join("");

        const classes = (c.classes || []).map(k => {
            const status = classStatus(k.dates || []);
            return `
                <article class="class-card" id="course-${escapeHtml(c.id)}-${escapeHtml(k.id)}">
                    ${coverFigure(k.photos, "class-cover")}
                    <div class="class-body">
                        <span class="class-status is-${status.key}">${escapeHtml(status.text)}</span>
                        <h4>${escapeHtml(k.name)}</h4>
                        <dl class="class-meta">
                            <div><dt>課程日期</dt><dd>${escapeHtml(k.dateText)}</dd></div>
                            <div><dt>授課講師</dt><dd>${escapeHtml(k.teachers)}</dd></div>
                            <div><dt>課程內容</dt><dd>${escapeHtml(k.content)}</dd></div>
                        </dl>
                        ${galleryButton(`${c.id}:${k.id}`, (k.photos || []).length, k.name)}
                    </div>
                </article>`;
        }).join("");

        return `
            <article class="course-card course-classes" id="course-${escapeHtml(c.id)}">
                <div class="course-classes-top">
                    <header class="course-head">
                        <span class="course-type">${escapeHtml(c.type)}</span>
                        <h3>${escapeHtml(c.title)}</h3>
                        <p class="course-intro">${escapeHtml(c.intro)}</p>
                    </header>
                    ${stats ? `
                        <div class="course-stats">
                            <div class="course-stats-row">${stats}</div>
                            ${c.statsNote ? `<p class="course-stats-note">${escapeHtml(c.statsNote)}</p>` : ""}
                        </div>` : ""}
                </div>
                <div class="class-grid">${classes}</div>
            </article>`;
    }

    function renderCourses(root, courses) {
        if (!courses.length) {
            root.innerHTML = `<p class="events-empty">課程資訊整理中。</p>`;
            return;
        }
        root.innerHTML = courses
            .map(c => (c.layout === "classes" ? renderClasses(c) : renderProgram(c)))
            .join("");
        attachImageFallback(root);
    }

    // 照片集：key 為 "課程id" 或 "課程id:場次id"
    function buildGalleries(courses) {
        const map = new Map();
        courses.forEach(c => {
            if (c.photos && c.photos.length) {
                map.set(c.id, { title: c.title, subtitle: c.type, photos: c.photos });
            }
            (c.classes || []).forEach(k => {
                if (k.photos && k.photos.length) {
                    map.set(`${c.id}:${k.id}`, { title: k.name, subtitle: k.dateText, photos: k.photos });
                }
            });
        });
        return map;
    }

    function fillGallery(modal, g) {
        modal.querySelector(".modal-title").textContent = g.title;
        modal.querySelector(".modal-body").innerHTML = `
            ${g.subtitle ? `<p class="text-secondary mb-3">${escapeHtml(g.subtitle)}</p>` : ""}
            ${renderCarousel({ title: g.title, photos: g.photos })}`;
    }

    // ---------- 媒體報導頁：彙整所有活動與課程的 links ----------

    function renderMedia(root, events, courses) {
        // 已經在頁面上方精選的連結不再重複列出
        const featured = new Set(
            [...document.querySelectorAll("#media-featured a[href]")].map(a => a.href)
        );

        const items = [];
        events.forEach(e => {
            if (e.links && e.links.length) {
                items.push({ date: e.date, type: e.type, title: e.title, links: e.links });
            }
        });
        courses.forEach(c => {
            if (c.links && c.links.length) {
                const first = (c.sessions || []).map(x => x.date).sort()[0] || "";
                items.push({ date: first, type: c.type, title: c.title, links: c.links });
            }
        });

        const rows = items
            .map(it => ({ ...it, links: it.links.filter(l => !featured.has(new URL(l.url, location.href).href)) }))
            .filter(it => it.links.length)
            .sort((a, b) => (a.date < b.date ? 1 : -1));

        root.innerHTML = rows.length
            ? rows.map(it => `
                <li class="media-row">
                    <time datetime="${escapeHtml(it.date)}">${it.date ? formatDate(it.date) : ""}</time>
                    <div>
                        <h3>${escapeHtml(it.title)}</h3>
                        <ul class="media-links">
                            ${it.links.map(l => `
                                <li>
                                    <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">
                                        ${escapeHtml(l.text)}<span class="visually-hidden">（另開新視窗）</span>
                                    </a>
                                </li>`).join("")}
                        </ul>
                    </div>
                </li>`).join("")
            : `<li class="events-empty">其他報導整理中。</li>`;
    }

    // ---------- 首頁：最新活動 ----------

    function renderHome(nextRoot, listRoot, upcoming, past) {
        const next = upcoming[0];
        if (nextRoot) {
            if (next) {
                const days = daysUntil(next.date);
                nextRoot.innerHTML = `
                    <a class="home-next" href="events.html#event-${escapeHtml(next.id)}">
                        <span class="home-next-label">下一場活動</span>
                        <span class="home-next-date">${formatDate(next.date)}</span>
                        <span class="home-next-title">${escapeHtml(next.title)}${next.speaker ? `｜${escapeHtml(next.speaker)}` : ""}</span>
                        <span class="home-next-days">${days === 0 ? "今天舉行" : `還有 ${days} 天`}</span>
                    </a>`;
            } else {
                nextRoot.hidden = true;
            }
        }

        // 首頁圖片順序：homeImage（指定）→ 第一張現場照片 → 封面
        listRoot.innerHTML = past.slice(0, 3).map(e => {
            const img = e.homeImage || (e.photos && e.photos[0] && e.photos[0].src) || e.cover;
            return `
                <div class="col-md-6 col-lg-4">
                    <a class="home-event-card" href="events.html#event-${escapeHtml(e.id)}">
                        <figure class="home-event-img">
                            <img src="${escapeHtml(img)}" alt="" loading="lazy" width="800" height="500" data-fallback>
                        </figure>
                        <div class="home-event-body">
                            <div class="past-date">
                                <time datetime="${escapeHtml(e.date)}">${formatDate(e.date)}</time>
                                ${typeBadge(e.type)}
                            </div>
                            <h3>${escapeHtml(e.title)}</h3>
                            <p class="home-event-place"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${escapeHtml(e.location)}</p>
                        </div>
                    </a>
                </div>`;
        }).join("");

        attachImageFallback(listRoot);
        markPortraitCovers(listRoot, ".home-event-img");
    }

    // ---------- 活動頁：從其他頁面帶 #event-xxx 連進來 ----------

    function handleEventHash(byId, modal) {
        const match = /^#event-(.+)$/.exec(window.location.hash);
        if (!match) return;
        const event = byId.get(match[1]);
        const card = document.getElementById(`event-${match[1]}`);
        if (!event || !card) return;

        card.scrollIntoView({ block: "start" });

        // 已舉辦的活動直接打開活動紀錄
        if (daysUntil(event.date) < 0 && modal && window.bootstrap) {
            const trigger = card.querySelector(".past-more");
            window.bootstrap.Modal.getOrCreateInstance(modal).show(trigger);
        }
    }

    // ---------- 初始化 ----------

    document.addEventListener("DOMContentLoaded", function () {
        const data = Array.isArray(window.EVENTS_DATA) ? window.EVENTS_DATA : [];
        const byId = new Map(data.map(e => [e.id, e]));

        const upcoming = data
            .filter(e => daysUntil(e.date) >= 0)
            .sort((a, b) => parseDate(a.date) - parseDate(b.date));

        const past = data
            .filter(e => daysUntil(e.date) < 0)
            .sort((a, b) => parseDate(b.date) - parseDate(a.date));

        // 媒體報導頁
        const mediaList = document.getElementById("media-list");
        if (mediaList) {
            const courseData = Array.isArray(window.COURSES_DATA) ? window.COURSES_DATA : [];
            renderMedia(mediaList, data, courseData);
        }

        // 首頁
        const homeList = document.getElementById("home-events");
        if (homeList) {
            renderHome(document.getElementById("home-next-event"), homeList, upcoming, past);
        }

        // 活動頁
        const upcomingRoot = document.getElementById("upcoming-events");
        const pastRoot = document.getElementById("past-events");
        if (!upcomingRoot || !pastRoot) return;

        const modal = document.getElementById("eventModal");

        upcomingRoot.innerHTML = upcoming.length
            ? upcoming.map(renderUpcoming).join("")
            : `<p class="events-empty">目前沒有即將舉行的活動，歡迎加入會員，第一時間收到活動通知。</p>`;

        pastRoot.innerHTML = past.length
            ? `<div class="past-grid">${past.map(renderPast).join("")}</div>`
            : `<p class="events-empty">活動紀錄整理中。</p>`;

        attachImageFallback(upcomingRoot);
        attachImageFallback(pastRoot);
        markPortraitCovers(pastRoot);

        const courses = Array.isArray(window.COURSES_DATA) ? window.COURSES_DATA : [];
        const galleries = buildGalleries(courses);
        const coursesRoot = document.getElementById("courses");
        if (coursesRoot) renderCourses(coursesRoot, courses);

        const nextRoot = document.getElementById("next-event");
        const timelineRoot = document.getElementById("events-timeline");
        if (nextRoot) renderNextEvent(nextRoot, upcoming[0]);
        if (timelineRoot) renderTimeline(timelineRoot, data);

        if (modal) {
            let lastTrigger = null;

            modal.addEventListener("show.bs.modal", function (e) {
                const trigger = e.relatedTarget;
                const event = trigger && byId.get(trigger.dataset.eventId);
                const gallery = trigger && galleries.get(trigger.dataset.gallery);
                if (event) fillModal(modal, event);
                else if (gallery) fillGallery(modal, gallery);
                lastTrigger = trigger || null;
            });

            // 關閉時清空內容，並把焦點還給開啟它的按鈕
            modal.addEventListener("hidden.bs.modal", function () {
                modal.querySelector(".modal-body").innerHTML = "";
                if (lastTrigger && document.activeElement === document.body) {
                    lastTrigger.focus();
                }
            });
        }

        handleEventHash(byId, modal);
    });
})();
