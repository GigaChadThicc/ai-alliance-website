document.addEventListener("DOMContentLoaded", function () {
    fetch("navbar.html")
        .then(response => response.text())
        .then(data => {
            const placeholder = document.getElementById("navbar-placeholder");
            if (!placeholder) return;

            placeholder.innerHTML = data;

            initNavbarA11y();
            initJumpEngine();
            enhancePageA11y();
        })
        .catch(error => console.error("導覽列載入失敗:", error));

    function initNavbarA11y() {
        const navbar = document.querySelector(".navbar");
        const toggler = document.querySelector(".navbar-toggler");
        const navbarNav = document.getElementById("navbarNav");
        const desktopMedia = window.matchMedia("(min-width: 992px)");

        if (!navbar || !navbarNav) return;

        if (toggler) {
            navbarNav.addEventListener("shown.bs.collapse", () => {
                toggler.setAttribute("aria-expanded", "true");
            });

            navbarNav.addEventListener("hidden.bs.collapse", () => {
                toggler.setAttribute("aria-expanded", "false");
                closeAllMenus();
            });
        }

        const topDropdownItems = navbar.querySelectorAll(".nav-item.dropdown");
        const topTriggers = navbar.querySelectorAll(".nav-item.dropdown > .dropdown-toggle");
        const submenuItems = navbar.querySelectorAll(".dropdown-submenu");
        const submenuToggleButtons = navbar.querySelectorAll(".submenu-toggle-btn");

        function setExpanded(element, expanded) {
            if (element) {
                element.setAttribute("aria-expanded", expanded ? "true" : "false");
            }
        }

        function getDirectMenu(item) {
            return item ? item.querySelector(":scope > .dropdown-menu") : null;
        }

        function getTopTrigger(item) {
            return item ? item.querySelector(":scope > .dropdown-toggle") : null;
        }

        function getSubmenuToggleButton(item) {
            return item ? item.querySelector(":scope > .submenu-item-wrap > .submenu-toggle-btn") : null;
        }

        function clearTimers(item) {
            if (!item) return;
            if (item.showTimer) clearTimeout(item.showTimer);
            if (item.hideTimer) clearTimeout(item.hideTimer);
            item.showTimer = null;
            item.hideTimer = null;
        }

        function closeSubmenu(item) {
            if (!item) return;

            clearTimers(item);
            item.classList.remove("show-submenu", "is-hovered");
            setExpanded(getSubmenuToggleButton(item), false);

            item.querySelectorAll(".dropdown-submenu.show-submenu, .dropdown-submenu.is-hovered").forEach(child => {
                child.classList.remove("show-submenu", "is-hovered");
                clearTimers(child);
                setExpanded(getSubmenuToggleButton(child), false);
            });
        }

        function openSubmenu(item) {
            if (!item) return;

            clearTimers(item);

            const siblings = item.parentElement
                ? item.parentElement.querySelectorAll(":scope > .dropdown-submenu")
                : [];

            siblings.forEach(sibling => {
                if (sibling !== item) closeSubmenu(sibling);
            });

            item.classList.add("show-submenu", "is-hovered");
            setExpanded(getSubmenuToggleButton(item), true);
        }

        function closeTopDropdown(item) {
            if (!item) return;

            clearTimers(item);
            item.classList.remove("show", "is-hovered");

            const trigger = getTopTrigger(item);
            const menu = getDirectMenu(item);

            setExpanded(trigger, false);

            if (menu) {
                menu.classList.remove("show");
            }

            item.querySelectorAll(".dropdown-submenu").forEach(sub => {
                closeSubmenu(sub);
            });
        }

        function openTopDropdown(item) {
            if (!item) return;

            clearTimers(item);

            topDropdownItems.forEach(other => {
                if (other !== item) closeTopDropdown(other);
            });

            item.classList.add("show", "is-hovered");

            const trigger = getTopTrigger(item);
            const menu = getDirectMenu(item);

            setExpanded(trigger, true);

            if (menu) {
                menu.classList.add("show");
            }
        }

        function closeAllMenus() {
            topDropdownItems.forEach(closeTopDropdown);
        }

        function focusFirstItemInMenu(menu) {
            if (!menu) return;
            const firstFocusable = menu.querySelector(".dropdown-item, .submenu-toggle-btn, a, button");
            if (firstFocusable) firstFocusable.focus();
        }

        function focusParentTopTrigger(submenuItem) {
            const parentDropdown = submenuItem.closest(".nav-item.dropdown");
            const parentTrigger = getTopTrigger(parentDropdown);
            if (parentTrigger) parentTrigger.focus();
        }

        topTriggers.forEach(trigger => {
            trigger.addEventListener("click", function (e) {
                const parent = this.closest(".nav-item.dropdown");
                const href = this.getAttribute("href");

                if (href === "#" || !href) {
                    e.preventDefault();
                }

                const isOpen = parent.classList.contains("show") || parent.classList.contains("is-hovered");

                if (desktopMedia.matches) {
                    if (isOpen) {
                        closeTopDropdown(parent);
                    } else {
                        openTopDropdown(parent);
                    }
                }
            });

            trigger.addEventListener("keydown", function (e) {
                const parent = this.closest(".nav-item.dropdown");

                if (["Enter", " ", "ArrowDown"].includes(e.key)) {
                    e.preventDefault();
                    openTopDropdown(parent);
                    focusFirstItemInMenu(getDirectMenu(parent));
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    closeTopDropdown(parent);
                    this.focus();
                } else if (e.key === "ArrowRight") {
                    const allTopTriggers = Array.from(topTriggers);
                    const currentIndex = allTopTriggers.indexOf(this);
                    const next = allTopTriggers[currentIndex + 1];
                    if (next) next.focus();
                } else if (e.key === "ArrowLeft") {
                    const allTopTriggers = Array.from(topTriggers);
                    const currentIndex = allTopTriggers.indexOf(this);
                    const prev = allTopTriggers[currentIndex - 1];
                    if (prev) prev.focus();
                }
            });
        });

        submenuToggleButtons.forEach(button => {
            button.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();

                const parent = this.closest(".dropdown-submenu");
                const isOpen = parent.classList.contains("show-submenu");

                if (isOpen) {
                    closeSubmenu(parent);
                } else {
                    openSubmenu(parent);
                }
            });

            button.addEventListener("keydown", function (e) {
                const parent = this.closest(".dropdown-submenu");
                const submenu = getDirectMenu(parent);

                if (["Enter", " ", "ArrowRight", "ArrowDown"].includes(e.key)) {
                    e.preventDefault();
                    openSubmenu(parent);
                    focusFirstItemInMenu(submenu);
                } else if (["Escape", "ArrowLeft"].includes(e.key)) {
                    e.preventDefault();
                    closeSubmenu(parent);
                    this.focus();
                }
            });
        });

        submenuItems.forEach(item => {
            item.addEventListener("mouseenter", function () {
                if (!desktopMedia.matches) return;

                clearTimers(item);
                item.showTimer = setTimeout(() => {
                    openSubmenu(item);
                }, 60);
            });

            item.addEventListener("mouseleave", function () {
                if (!desktopMedia.matches) return;

                clearTimers(item);
                item.hideTimer = setTimeout(() => {
                    closeSubmenu(item);
                }, 220);
            });
        });

        topDropdownItems.forEach(item => {
            item.addEventListener("mouseenter", function () {
                if (!desktopMedia.matches) return;

                clearTimers(item);
                item.showTimer = setTimeout(() => {
                    openTopDropdown(item);
                }, 60);
            });

            item.addEventListener("mouseleave", function () {
                if (!desktopMedia.matches) return;

                clearTimers(item);
                item.hideTimer = setTimeout(() => {
                    closeTopDropdown(item);
                }, 260);
            });
        });

        navbar.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                closeAllMenus();

                const activeSubToggle = navbar.querySelector(".submenu-toggle-btn[aria-expanded='true']");
                if (activeSubToggle) {
                    activeSubToggle.focus();
                    return;
                }

                const activeTopTrigger = navbar.querySelector(".nav-item.dropdown > .dropdown-toggle[aria-expanded='true']");
                if (activeTopTrigger) {
                    activeTopTrigger.focus();
                }
            }
        });

        document.addEventListener("click", function (e) {
            if (!e.target.closest(".navbar")) {
                closeAllMenus();
            }
        });

        document.querySelectorAll(".dropdown-menu .dropdown-item").forEach(link => {
            link.addEventListener("keydown", function (e) {
                const parentSubmenu = this.closest(".dropdown-submenu");

                if (e.key === "ArrowLeft" && parentSubmenu) {
                    e.preventDefault();
                    closeSubmenu(parentSubmenu);
                    const btn = getSubmenuToggleButton(parentSubmenu);
                    if (btn) btn.focus();
                }

                if (e.key === "Escape") {
                    e.preventDefault();

                    if (parentSubmenu) {
                        closeSubmenu(parentSubmenu);
                        const btn = getSubmenuToggleButton(parentSubmenu);
                        if (btn) {
                            btn.focus();
                        } else {
                            focusParentTopTrigger(parentSubmenu);
                        }
                    } else {
                        const parentDropdown = this.closest(".nav-item.dropdown");
                        if (parentDropdown) {
                            closeTopDropdown(parentDropdown);
                            const trigger = getTopTrigger(parentDropdown);
                            if (trigger) trigger.focus();
                        }
                    }
                }
            });
        });
    }

    function initJumpEngine() {
        document.querySelectorAll(".dropdown-item, .nav-link, .btn").forEach(link => {
            link.addEventListener("click", function (e) {
                const href = this.getAttribute("href");
                if (!href || href === "#") return;

                let isSamePage = false;
                let hash = "";

                if (href.includes("#")) {
                    const parts = href.split("#");
                    const linkPath = parts[0];
                    hash = "#" + parts[1];

                    const currentFile = window.location.pathname.split("/").pop() || "index.html";
                    if (linkPath === "" || linkPath === currentFile) {
                        isSamePage = true;
                    }
                }

                if (isSamePage && hash !== "#") {
                    e.preventDefault();

                    const target = document.querySelector(hash);
                    if (!target) return;

                    window.history.pushState(null, null, hash);

                    const headerOffset = 90;
                    const offsetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
                    });

                    if (!target.hasAttribute("tabindex")) {
                        target.setAttribute("tabindex", "-1");
                    }

                    target.focus({ preventScroll: true });
                }
            });
        });

        if (window.location.hash) {
            setTimeout(function () {
                const target = document.querySelector(window.location.hash);
                if (!target) return;

                const headerOffset = 90;
                const offsetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
                });
            }, 300);
        }
    }

    function enhancePageA11y() {
        document.querySelectorAll("i.bi").forEach(icon => {
            if (!icon.hasAttribute("aria-hidden")) {
                icon.setAttribute("aria-hidden", "true");
            }
        });

        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            if (!link.hasAttribute("aria-label")) {
                const label = link.textContent.trim().replace(/\s+/g, " ");
                link.setAttribute("aria-label", `${label}（另開新視窗）`);
            }
        });

        document.querySelectorAll('a[href="#"]').forEach(link => {
            if (!link.closest(".navbar")) {
                const txt = link.textContent.trim().replace(/\s+/g, " ");
                link.setAttribute("role", "link");

                if (!link.hasAttribute("aria-disabled")) {
                    link.setAttribute("aria-disabled", "true");
                }

                if (!link.hasAttribute("title")) {
                    link.setAttribute("title", `${txt}目前尚未提供連結`);
                }

                if (!link.hasAttribute("aria-label")) {
                    link.setAttribute("aria-label", `${txt}，目前尚未提供連結`);
                }
            }
        });
    }
});