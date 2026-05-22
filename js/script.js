(function () {
  "use strict";

  const WORK_START = 10;
  const WORK_END = 21;
  const SLOT_MINUTES = 60;
  const CLOSED_DAYS = [0]; // воскресенье — короткий день, можно настроить

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ——— Год в подвале ———
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ——— Шапка при скролле ———
  const header = $(".header");
  window.addEventListener(
    "scroll",
    () => header?.classList.toggle("header--scrolled", window.scrollY > 20),
    { passive: true }
  );

  // ——— Мобильное меню ———
  const navToggle = $(".nav-toggle");
  const nav = $("#nav");

  navToggle?.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("is-open", !open);
  });

  $$(".nav a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle?.setAttribute("aria-expanded", "false");
      nav?.classList.remove("is-open");
    });
  });

  // ——— Вкладки услуг ———
  const tabs = $$(".services__tabs button");
  const panels = $$(".services__panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.tab;
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      panels.forEach((p) => {
        const show = p.dataset.panel === id;
        p.hidden = !show;
      });
    });
  });

  // ——— Слоты времени ———
  const dateInput = $("#date");
  const timeSelect = $("#time");

  function getMinDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function getMaxDate() {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().slice(0, 10);
  }

  if (dateInput) {
    dateInput.min = getMinDate();
    dateInput.max = getMaxDate();
  }

  function isWorkingDay(dateStr) {
    const day = new Date(dateStr + "T12:00:00").getDay();
    return !CLOSED_DAYS.includes(day);
  }

  function buildTimeSlots(dateStr) {
    const slots = [];
    const day = new Date(dateStr + "T12:00:00").getDay();
    let start = WORK_START;
    let end = WORK_END;

    if (day === 0) {
      start = 11;
      end = 20;
    } else if (day === 6) {
      start = 11;
      end = 20;
    }

    for (let h = start; h < end; h++) {
      for (let m = 0; m < 60; m += SLOT_MINUTES) {
        if (h === end - 1 && m > 0) break;
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  }

  dateInput?.addEventListener("change", () => {
    const val = dateInput.value;
    timeSelect.innerHTML = "";
    timeSelect.disabled = true;

    if (!val) {
      timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
      return;
    }

    if (!isWorkingDay(val)) {
      timeSelect.innerHTML = '<option value="">В этот день салон не работает</option>';
      showError("date", "Выберите другой день");
      return;
    }

    clearError("date");
    const slots = buildTimeSlots(val);
    timeSelect.disabled = false;
    timeSelect.innerHTML =
      '<option value="">Выберите время</option>' +
      slots.map((s) => `<option value="${s}">${s}</option>`).join("");
  });

  // ——— Маска телефона (упрощённая) ———
  const phoneInput = $("#phone");

  phoneInput?.addEventListener("input", (e) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (!digits.startsWith("7") && digits.length) digits = "7" + digits;

    let formatted = "";
    if (digits.length > 0) formatted = "+7";
    if (digits.length > 1) formatted += " (" + digits.slice(1, 4);
    if (digits.length >= 4) formatted += ") " + digits.slice(4, 7);
    if (digits.length >= 7) formatted += "-" + digits.slice(7, 9);
    if (digits.length >= 9) formatted += "-" + digits.slice(9, 11);

    e.target.value = formatted;
  });

  // ——— Валидация формы ———
  const form = $("#booking-form");
  const modal = $("#success-modal");
  const modalText = $("#modal-text");

  function showError(field, msg) {
    const el = $(`#error-${field}`);
    const input = $(`#${field}`, form) || $(`[name="${field}"]`, form);
    if (el) el.textContent = msg;
    input?.classList.add("invalid");
  }

  function clearError(field) {
    const el = $(`#error-${field}`);
    const input = $(`#${field}`, form);
    if (el) el.textContent = "";
    input?.classList.remove("invalid");
  }

  function validatePhone(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length === 11 && digits.startsWith("7");
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    ["name", "phone", "service", "date", "time", "consent"].forEach(clearError);

    const name = $("#name", form)?.value.trim();
    const phone = $("#phone", form)?.value;
    const service = $("#service", form)?.value;
    const date = $("#date", form)?.value;
    const time = $("#time", form)?.value;
    const consent = $("#consent", form)?.checked;

    if (!name || name.length < 2) {
      showError("name", "Введите имя (минимум 2 символа)");
      valid = false;
    }

    if (!validatePhone(phone)) {
      showError("phone", "Введите корректный номер телефона");
      valid = false;
    }

    if (!service) {
      showError("service", "Выберите услугу");
      valid = false;
    }

    if (!date || !isWorkingDay(date)) {
      showError("date", "Выберите рабочий день");
      valid = false;
    }

    if (!time) {
      showError("time", "Выберите время");
      valid = false;
    }

    if (!consent) {
      showError("consent", "Необходимо согласие на обработку данных");
      valid = false;
    }

    if (!valid) return;

    const contact = $("#contact", form)?.value;
    const comment = $("#comment", form)?.value.trim();
    const serviceLabel = $("#service", form).selectedOptions[0]?.text;

    const payload = {
      name,
      phone,
      contact,
      service,
      serviceLabel,
      date,
      time,
      comment,
      submittedAt: new Date().toISOString(),
    };

    console.info("Заявка на запись:", payload);

    if (modalText) {
      modalText.textContent = `${name}, мы получили вашу заявку на ${date} в ${time} («${serviceLabel}»). Перезвоним или напишем в ${contact === "telegram" ? "Telegram" : contact === "whatsapp" ? "WhatsApp" : "течение 2 часов"}.`;
    }

    modal?.showModal();
    form.reset();
    timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
    timeSelect.disabled = true;
  });

  $$(".modal__close, .modal__btn").forEach((btn) => {
    btn?.addEventListener("click", () => modal?.close());
  });

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  // ——— Плавный скролл к записи с карточек услуг ———
  $$(".service-card").forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const title = card.querySelector("h3")?.textContent?.trim();
      const serviceSelect = $("#service");
      if (title && serviceSelect) {
        for (const opt of serviceSelect.options) {
          if (opt.text.includes(title) || title.includes(opt.text)) {
            serviceSelect.value = opt.value;
            break;
          }
        }
      }
      document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth" });
    });
  });
})();
