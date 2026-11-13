/**
 * KELAS HEMAT ENERGI - SCRIPT UTAMA
 * Navigasi, Interaksi Global, Kalkulator & Checklist
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Menu Toggle
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("show");
      menuToggle.setAttribute("aria-expanded", isOpen);
      menuToggle.innerHTML = isOpen ? "✕" : "☰";
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target) && navMenu.classList.contains("show")) {
        navMenu.classList.remove("show");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.innerHTML = "☰";
      }
    });
  }

  // 2. Active Tab Switcher (Generic for all tab systems)
  const tabButtons = document.querySelectorAll(".tab-btn");
  if (tabButtons.length > 0) {
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        const parentContainer = btn.closest(".tabs-container") || document;

        parentContainer.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        parentContainer.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));

        btn.classList.add("active");
        const targetPane = document.getElementById(targetTab);
        if (targetPane) {
          targetPane.classList.add("active");
        }
      });
    });
  }

  // 3. Interactive Energy Calculator (di halaman aksi.html)
  const lampRange = document.getElementById("calcLampu");
  const pcRange = document.getElementById("calcPC");
  const acRange = document.getElementById("calcAC");

  if (lampRange && pcRange && acRange) {
    const lampVal = document.getElementById("valLampu");
    const pcVal = document.getElementById("valPC");
    const acVal = document.getElementById("valAC");
    const resultKwh = document.getElementById("resKwh");
    const resultRupiah = document.getElementById("resRupiah");
    const resultCo2 = document.getElementById("resCo2");

    const updateCalculator = () => {
      const jamLampu = parseInt(lampRange.value, 10);
      const jmlPC = parseInt(pcRange.value, 10);
      const acMode = parseInt(acRange.value, 10); // 0=tidak, 1=1 jam mati, 2=2 jam mati/naik suhu

      lampVal.textContent = `${jamLampu} Jam / hari`;
      pcVal.textContent = `${jmlPC} Unit PC / Laptop`;
      acVal.textContent = acMode === 0 ? "Standar" : `${acMode} Jam hemat / hari`;

      // Konsumsi asumsi:
      // 1 lampu LED kelas ~ 36 Watt (kelas ada rata-rata 6 lampu = 216 Watt = 0.216 kW)
      // 1 PC/Laptop ~ 65 Watt = 0.065 kW
      // 1 unit AC 1 PK ~ 800 Watt = 0.8 kW
      // Hari efektif per bulan ~ 22 hari sekolah
      const kwhLampuBulan = 0.216 * jamLampu * 22;
      const kwhPCBulan = jmlPC * 0.065 * 1.5 * 22; // dihemat ~1.5 jam waktu istirahat
      const kwhACBulan = acMode * 0.8 * 22;

      const totalKwh = Math.round((kwhLampuBulan + kwhPCBulan + kwhACBulan) * 10) / 10;
      const TARIF_PLN = 1444.7; // Rp per kWh (Tarif Bisnis / Sekolah R-1/B-1)
      const totalRupiah = Math.round(totalKwh * TARIF_PLN);
      const totalCo2 = Math.round(totalKwh * 0.85 * 10) / 10; // ~0.85 kg CO2 per kWh di Indonesia

      if (resultKwh) resultKwh.textContent = totalKwh.toLocaleString("id-ID");
      if (resultRupiah) resultRupiah.textContent = "Rp " + totalRupiah.toLocaleString("id-ID");
      if (resultCo2) resultCo2.textContent = totalCo2.toLocaleString("id-ID") + " kg";
    };

    lampRange.addEventListener("input", updateCalculator);
    pcRange.addEventListener("input", updateCalculator);
    acRange.addEventListener("input", updateCalculator);
    updateCalculator();
  }

  // 4. Interactive Checklist Aksi Harian (dengan localStorage)
  const checklistItems = document.querySelectorAll(".checklist-item");
  const progressFill = document.getElementById("checklistProgress");
  const progressText = document.getElementById("checklistPercent");

  if (checklistItems.length > 0) {
    const STORAGE_KEY = "kelas_hemat_checklist_v1";
    let savedState = {};

    try {
      savedState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      savedState = {};
    }

    const updateChecklistProgress = () => {
      let checkedCount = 0;
      checklistItems.forEach((item, index) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
          checkedCount++;
          item.classList.add("checked");
        } else {
          item.classList.remove("checked");
        }
      });

      const percent = Math.round((checkedCount / checklistItems.length) * 100);
      if (progressFill) progressFill.style.width = `${percent}%`;
      if (progressText) progressText.textContent = `${percent}% Selesai (${checkedCount}/${checklistItems.length})`;

      // Save state
      const stateToSave = {};
      checklistItems.forEach((item, index) => {
        const cb = item.querySelector('input[type="checkbox"]');
        stateToSave[index] = cb ? cb.checked : false;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    };

    // Initialize from saved state
    checklistItems.forEach((item, index) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) {
        if (savedState[index]) {
          checkbox.checked = true;
        }
        checkbox.addEventListener("change", updateChecklistProgress);
      }

      item.addEventListener("click", (e) => {
        if (e.target.tagName !== "INPUT") {
          const cb = item.querySelector('input[type="checkbox"]');
          if (cb) {
            cb.checked = !cb.checked;
            updateChecklistProgress();
          }
        }
      });
    });

    updateChecklistProgress();
  }
});
