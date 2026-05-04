document.addEventListener("DOMContentLoaded", () => {
  const passes = [
    { key: "sports", name: "Sports", price: 9900, oneCash: 1400, x: 0, y: 0 },
    { key: "paramount", name: "Paramount+", price: 3300, oneCash: 400, x: 181, y: 0 },
    { key: "sony", name: "Sony Pictures", price: 2900, oneCash: 400, x: 1, y: 168 },
    { key: "jplus", name: "J plus", price: 5500, oneCash: 700, x: 181, y: 168 },
    { key: "moa", name: "MOA", price: 5500, oneCash: 700, x: 1, y: 335 },
    { key: "ebs", name: "EBS ON", price: 4900, oneCash: 600, x: 181, y: 335 },
  ];

  const doubleCashMap = {
    "sports+paramount": 1700,
    "sports+sony": 1700,
    "sports+jplus": 2000,
    "sports+moa": 2000,
    "sports+ebs": 1900,
    "paramount+sony": 800,
    "paramount+jplus": 1100,
    "paramount+moa": 1100,
    "paramount+ebs": 1100,
    "sony+jplus": 1100,
    "sony+moa": 1100,
    "sony+ebs": 1000,
    "jplus+moa": 1400,
    "jplus+ebs": 1400,
    "moa+ebs": 1400,
  };

  const modeConfig = {
    one: { label: "원패스", max: 1, discount: 0.05 },
    double: { label: "더블패스", max: 2, discount: 0.10 },
    all: { label: "올패스", max: 6, discount: 0.30, cash: 3000 },
  };

  let mode = "double";
  let selected = new Set([0, 1]);

  const oneScreen = document.querySelector(".onepass-display");
  const allScreen = document.querySelector(".allpass-display");
  const group = document.querySelector(".onepass-display .group");
  const comboTabs = document.querySelector(".section-combo-tabs");
  const oneTabs = Array.from(document.querySelectorAll(".onepass-display .section-pass-tabs > *"));
  const allTabs = Array.from(document.querySelectorAll(".allpass-display .section-pass-tabs > *"));
  const tabTypes = ["one", "double", "all"];

  function money(value) {
    return `${Number(value).toLocaleString("ko-KR")}원`;
  }

  // 1원 단위 절사: 9,405원 → 9,400원처럼 10원 단위로 내림
  function floor10(value) {
    return Math.floor(value / 10) * 10;
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function pairKey(indexes) {
    const order = passes.map((pass) => pass.key);
    return indexes
      .map((i) => passes[i].key)
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .join("+");
  }

  function getCash(indexes) {
    if (mode === "one") return passes[indexes[0]]?.oneCash || 0;
    if (mode === "double") return doubleCashMap[pairKey(indexes)] || 0;
    if (mode === "all") return 3000;
    return 0;
  }

  function switchMode(nextMode) {
    mode = nextMode;
    if (mode === "one") selected = new Set([0]);
    if (mode === "double") selected = new Set([0, 1]);
    if (mode === "all") selected = new Set(passes.map((_, i) => i));
    updateUI();
  }

  function setupTabs() {
    [oneTabs, allTabs].forEach((tabList) => {
      tabList.forEach((tab, index) => {
        const type = tabTypes[index];
        if (!type) return;
        tab.dataset.passMode = type;
        tab.addEventListener("click", () => switchMode(type));
      });
    });
  }

  const recommendSets = {
    one: [
      { label: "스포츠", picks: [0] },
      { label: "파라마운트", picks: [1] },
      { label: "J PLUS", picks: [3] },
    ],
    double: [
      { label: "스포츠 + 파라마운트", picks: [0, 1] },
      { label: "소니 + EBS", picks: [2, 5] },
      { label: "J PLUS + MOA", picks: [3, 4] },
    ],
    all: [],
  };

  function renderComboTabs() {
    if (!comboTabs) return;

    const combos = recommendSets[mode] || [];
    comboTabs.innerHTML = "";

    if (mode === "all" || combos.length === 0) {
      comboTabs.style.display = "none";
      return;
    }

    comboTabs.style.display = "flex";

    combos.forEach((combo) => {
      const btn = document.createElement("button");
      btn.type = "button";
      const isActive = JSON.stringify(Array.from(selected).sort()) === JSON.stringify(combo.picks.slice().sort());
      btn.className = `combo-chip${isActive ? " is-active" : ""}`;
      btn.textContent = combo.label;
      btn.addEventListener("click", () => {
        mode = combo.picks.length === 1 ? "one" : "double";
        selected = new Set(combo.picks);
        updateUI();
      });
      comboTabs.appendChild(btn);
    });
  }

  function setupComboTabs() {
    renderComboTabs();
  }

  function setupCardHotspots() {
    if (!group || group.querySelector(".pass-hotspot")) return;

    passes.forEach((pass, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pass-hotspot";
      btn.setAttribute("aria-label", `${pass.name} 선택`);
      btn.style.left = `${pass.x}px`;
      btn.style.top = `${pass.y}px`;
      btn.innerHTML = '<span class="dynamic-check"></span>';

      btn.addEventListener("click", () => {
        if (mode === "all") return;

        const max = modeConfig[mode].max;
        if (selected.has(index)) {
          if (selected.size > 1) selected.delete(index);
        } else {
          if (selected.size >= max) {
            const first = selected.values().next().value;
            selected.delete(first);
          }
          selected.add(index);
        }

        updateUI();
      });

      group.appendChild(btn);
    });
  }

  function updateTopInfo(count, max, discountPercent) {
    setText(".onepass-display .text-wrapper-10", `${count}/${max}`);
    const info = document.querySelector(".onepass-display .div-select-right .element");
    if (info) {
      info.innerHTML = `<span class="text-wrapper-11">${count}개를 선택하시면&nbsp;</span><span class="text-wrapper-13">${discountPercent}% 할인</span><span class="text-wrapper-11">이 적용돼요</span>`;
    }
  }

  function updateSummary(count, original, discountPercent, applied, cash, benefit, finalPay) {
    setText(".onepass-display .div-summary-item .text-wrapper-24", `${count}개`);
    setText(".onepass-display .div-summary-item-2 .text-wrapper-24", money(original));
    setText(".onepass-display .div-summary-item-3 .text-wrapper-25", `${discountPercent}%`);
    setText(".onepass-display .div-summary-item-4 .text-wrapper-25", money(applied));
    setText(".onepass-display .div-summary-item-5 .text-wrapper-25", money(cash));
    setText(".onepass-display .div-summary-item-6 .text-wrapper-25", money(benefit));
    setText(".onepass-display .div-total-box .text-wrapper-27", money(finalPay));
  }

  function updateAllpassSummary() {
    setText(".allpass-display .div-summary-item .text-wrapper-14", "6개");
    setText(".allpass-display .div-summary-item-2 .text-wrapper-14", "32,000원");
    setText(".allpass-display .div-summary-item-3 .text-wrapper-15", "30%");
    setText(".allpass-display .div-summary-item-4 .text-wrapper-15", "22,400원");
    setText(".allpass-display .div-summary-item-5 .text-wrapper-15", "3,000원");
    setText(".allpass-display .div-summary-item-6 .text-wrapper-15", "12,600원");
    setText(".allpass-display .allpay-original", "22,400원");
    setText(".allpass-display .allpay-current", "0원");
    setText(".allpass-display .button-cta .text-wrapper-21", "22,400원");
  }

  function updateTabActive() {
    [...oneTabs, ...allTabs].forEach((tab) => {
      tab.classList.toggle("pass-tab-active", tab.dataset.passMode === mode);
    });
  }

  function updateScreens() {
    const isAll = mode === "all";
    if (oneScreen) oneScreen.classList.toggle("screen-hidden", isAll);
    if (allScreen) allScreen.classList.toggle("screen-hidden", !isAll);
  }

  function updateUI() {
    const config = modeConfig[mode];
    const max = config.max;
    const indexes = Array.from(selected);
    const count = indexes.length;
    const original = indexes.reduce((sum, index) => sum + passes[index].price, 0);
    const discountPercent = Math.round(config.discount * 100);
    const applied = mode === "all" ? 22400 : floor10(original * (1 - config.discount));
    const discountAmount = original - applied;
    const cash = count === 0 ? 0 : getCash(indexes);
    const benefit = discountAmount + cash;
    const finalPay = applied;

    updateScreens();
    updateTabActive();
    renderComboTabs();

    document.querySelectorAll(".pass-hotspot").forEach((btn, index) => {
      btn.classList.toggle("is-selected", selected.has(index));
    });

    if (mode === "all") {
      updateAllpassSummary();
      return;
    }

    updateTopInfo(count, max, discountPercent);
    updateSummary(count, original, discountPercent, applied, cash, benefit, finalPay);
  }

  setupTabs();
  setupComboTabs();
  setupCardHotspots();
  updateUI();
});
