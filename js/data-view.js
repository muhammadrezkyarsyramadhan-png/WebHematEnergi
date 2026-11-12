/**
 * KELAS HEMAT ENERGI - DATA VIEW CONTROLLER (FASE 2)
 * Render Visualisasi, Tabel Interaktif, Filter & Pencarian
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof DATA_ENERGI === "undefined") {
    console.error("DATA_ENERGI tidak ditemukan. Pastikan data-perilaku-energi.js dimuat.");
    return;
  }

  const data = DATA_ENERGI;

  // ==========================================
  // 1. Inisialisasi Ringkasan & KPI Cards
  // ==========================================
  const initKPI = () => {
    const kpiAvg = document.getElementById("kpiRataRata");
    const kpiResp = document.getElementById("kpiResponden");
    const kpiPersenBaik = document.getElementById("kpiPersenBaik");
    const kpiTopItem = document.getElementById("kpiTopItem");

    if (kpiAvg) kpiAvg.textContent = `${data.ringkasan.rata_rata_skor.toFixed(2)} / 4.00`;
    if (kpiResp) kpiResp.textContent = `${data.meta.jumlah_responden} Siswa`;
    
    // Total Sangat Baik + Baik
    const persenPositif = (data.ringkasan.kategori_persen["Sangat Baik"] + data.ringkasan.kategori_persen["Baik"]).toFixed(1);
    if (kpiPersenBaik) kpiPersenBaik.textContent = `${persenPositif}%`;

    if (kpiTopItem && data.ringkasan.sorotan.butir_tertinggi.length > 0) {
      const top = data.ringkasan.sorotan.butir_tertinggi[0];
      kpiTopItem.textContent = `${top.kode} (${top.rata_rata})`;
    }
  };

  // ==========================================
  // 2. Render Canvas Charts (Zero Dependency)
  // ==========================================
  const renderDonutChart = () => {
    const canvas = document.getElementById("chartKategori");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const size = 260;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const categories = [
      { label: "Sangat Baik", count: data.ringkasan.kategori["Sangat Baik"], color: "#10b981", percent: data.ringkasan.kategori_persen["Sangat Baik"] },
      { label: "Baik", count: data.ringkasan.kategori["Baik"], color: "#3b82f6", percent: data.ringkasan.kategori_persen["Baik"] },
      { label: "Cukup", count: data.ringkasan.kategori["Cukup"], color: "#f59e0b", percent: data.ringkasan.kategori_persen["Cukup"] },
      { label: "Kurang", count: data.ringkasan.kategori["Kurang"], color: "#ef4444", percent: data.ringkasan.kategori_persen["Kurang"] },
    ];

    const total = categories.reduce((sum, c) => sum + c.count, 0);
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 100;
    const innerRadius = 60;

    let startAngle = -Math.PI / 2;

    categories.forEach((cat) => {
      const sliceAngle = (cat.count / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = cat.color;
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Donut Center Text
    ctx.font = "800 24px Poppins, sans-serif";
    ctx.fillStyle = "#064e3b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(data.ringkasan.rata_rata_skor.toFixed(2), centerX, centerY - 6);

    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("RATA-RATA", centerX, centerY + 16);
  };

  const renderHistogramChart = () => {
    const canvas = document.getElementById("chartHistogram");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement ? canvas.parentElement.clientWidth : 500;
    const height = 240;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const sebaran = data.sebaran_skor_total;
    const maxJumlah = Math.max(...sebaran.map(s => s.jumlah));
    const padding = { top: 20, bottom: 40, left: 35, right: 20 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Draw Grid Lines
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const val = Math.round(maxJumlah - (maxJumlah / 4) * i);
      ctx.font = "500 10px Inter, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "right";
      ctx.fillText(val.toString(), padding.left - 6, y + 3);
    }

    // Draw Bars
    const barWidth = Math.max(8, (chartW / sebaran.length) - 4);
    sebaran.forEach((item, idx) => {
      const barH = (item.jumlah / maxJumlah) * chartH;
      const x = padding.left + idx * (chartW / sebaran.length) + 2;
      const y = padding.top + chartH - barH;

      // Color coding based on score
      let color = "#3b82f6";
      if (item.skor_total >= 33) color = "#10b981";
      else if (item.skor_total < 25) color = "#f59e0b";

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Labels on X-axis (every few items)
      if (idx % 3 === 0 || idx === sebaran.length - 1) {
        ctx.font = "500 10px Inter, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "center";
        ctx.fillText(item.skor_total.toString(), x + barWidth / 2, height - padding.bottom + 16);
      }
    });

    // Axis label
    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.fillText("Skor Total Siswa (10 - 40)", width / 2, height - 8);
  };

  // ==========================================
  // 3. Render 10 Butir Pernyataan
  // ==========================================
  const renderButirList = (filterType = "all") => {
    const container = document.getElementById("butirContainer");
    if (!container) return;

    let items = [...data.per_butir];

    if (filterType === "top") {
      items.sort((a, b) => b.rata_rata - a.rata_rata);
      items = items.slice(0, 3);
    } else if (filterType === "bottom") {
      items.sort((a, b) => a.rata_rata - b.rata_rata);
      items = items.slice(0, 3);
    }

    container.innerHTML = items.map((b) => {
      const catColor = b.rata_rata >= 3.26 ? "var(--sangat-baik)" : (b.rata_rata >= 2.51 ? "var(--baik)" : "var(--cukup)");
      const catText = b.rata_rata >= 3.26 ? "Sangat Baik" : (b.rata_rata >= 2.51 ? "Baik" : "Cukup");
      
      const p1 = b.persen_per_skor["1"] || 0;
      const p2 = b.persen_per_skor["2"] || 0;
      const p3 = b.persen_per_skor["3"] || 0;
      const p4 = b.persen_per_skor["4"] || 0;

      return `
        <div class="butir-card">
          <div class="butir-card-header">
            <span class="butir-code">${b.kode}</span>
            <div class="butir-title">${b.label}</div>
            <div class="butir-score">
              <div class="score-num">${b.rata_rata.toFixed(2)}</div>
              <div class="score-cat" style="color: ${catColor};">${catText}</div>
            </div>
          </div>
          <div class="butir-question">"${b.pertanyaan}"</div>

          <div class="likert-bar-container">
            <div class="likert-bar" title="Distribusi Jawaban Siswa">
              <div class="likert-segment seg-1" style="width: ${p1}%;" title="Skor 1 (Tidak Pernah): ${p1}%"></div>
              <div class="likert-segment seg-2" style="width: ${p2}%;" title="Skor 2 (Jarang): ${p2}%"></div>
              <div class="likert-segment seg-3" style="width: ${p3}%;" title="Skor 3 (Sering): ${p3}%"></div>
              <div class="likert-segment seg-4" style="width: ${p4}%;" title="Skor 4 (Selalu): ${p4}%"></div>
            </div>
            <div class="likert-legend">
              <span class="likert-legend-item"><span class="legend-dot" style="background: var(--kurang);"></span> 1 (Kurang): ${p1}%</span>
              <span class="likert-legend-item"><span class="legend-dot" style="background: var(--cukup);"></span> 2 (Cukup): ${p2}%</span>
              <span class="likert-legend-item"><span class="legend-dot" style="background: var(--baik);"></span> 3 (Sering): ${p3}%</span>
              <span class="likert-legend-item"><span class="legend-dot" style="background: var(--sangat-baik);"></span> 4 (Selalu): ${p4}%</span>
              <span style="margin-left: auto; font-weight: 600; color: var(--primary);">Sering/Selalu: ${b.persen_sering}%</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  };

  // Butir Filter Buttons
  const butirFilterBtns = document.querySelectorAll(".butir-filter-btn");
  butirFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      butirFilterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderButirList(btn.getAttribute("data-filter"));
    });
  });

  // ==========================================
  // 4. Render Per Jurusan
  // ==========================================
  const renderJurusan = () => {
    const container = document.getElementById("jurusanContainer");
    if (!container) return;

    const list = [...data.per_jurusan].sort((a, b) => (b.rata_rata_skor || b.rata_rata) - (a.rata_rata_skor || a.rata_rata));

    container.innerHTML = list.map((j, idx) => {
      const avg = j.rata_rata_skor || j.rata_rata;
      const percentBar = ((avg / 4.0) * 100).toFixed(1);
      const isTop = idx === 0;
      const isLowest = idx === list.length - 1;

      let badgeTag = "";
      if (isTop) badgeTag = `<span class="badge badge-yellow">⭐ Skor Tertinggi</span>`;
      else if (isLowest) badgeTag = `<span class="badge badge-blue">🎯 Target Pembinaan</span>`;

      return `
        <div class="card card-top-accent ${isTop ? 'accent-yellow' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 1.25rem; font-weight: 800; color: var(--primary-dark);">${j.jurusan || j.nama} (${j.kode || ''})</span>
            ${badgeTag}
          </div>
          <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 2rem; font-weight: 800; color: var(--primary-dark); font-family: var(--font-heading);">${avg.toFixed(2)}</span>
            <span style="color: var(--text-muted); font-size: 0.9rem;">/ 4.00 (${j.jumlah_responden} siswa)</span>
          </div>

          <div style="background: #e2e8f0; height: 10px; border-radius: 999px; overflow: hidden; margin-bottom: 14px;">
            <div style="background: linear-gradient(90deg, #10b981, #059669); width: ${percentBar}%; height: 100%;"></div>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted); display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>Sangat Baik: <strong>${j.kategori_persen ? j.kategori_persen["Sangat Baik"] : '-'}%</strong></div>
            <div>Baik: <strong>${j.kategori_persen ? j.kategori_persen["Baik"] : '-'}%</strong></div>
          </div>
        </div>
      `;
    }).join("");
  };

  // ==========================================
  // 5. Render Per Rombel Table dengan Search & Filter
  // ==========================================
  const renderRombelTable = () => {
    const tableBody = document.getElementById("rombelTableBody");
    const searchInput = document.getElementById("searchRombel");
    const filterJurusan = document.getElementById("filterJurusanSelect");
    const sortSelect = document.getElementById("sortRombelSelect");

    if (!tableBody) return;

    // Populate Jurusan select options if empty
    if (filterJurusan && filterJurusan.options.length <= 1) {
      const jurusans = [...new Set(data.per_rombel.map(r => r.jurusan))];
      jurusans.forEach(j => {
        const opt = document.createElement("option");
        opt.value = j;
        opt.textContent = j;
        filterJurusan.appendChild(opt);
      });
    }

    const updateTable = () => {
      const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
      const selectedJurusan = filterJurusan ? filterJurusan.value : "all";
      const sortBy = sortSelect ? sortSelect.value : "score-desc";

      let filtered = data.per_rombel.filter((r) => {
        const matchQuery = r.rombel.toLowerCase().includes(query) || (r.jurusan && r.jurusan.toLowerCase().includes(query));
        const matchJurusan = selectedJurusan === "all" || r.jurusan === selectedJurusan;
        return matchQuery && matchJurusan;
      });

      // Sorting
      if (sortBy === "score-desc") {
        filtered.sort((a, b) => b.rata_rata_skor - a.rata_rata_skor);
      } else if (sortBy === "score-asc") {
        filtered.sort((a, b) => a.rata_rata_skor - b.rata_rata_skor);
      } else if (sortBy === "name-asc") {
        filtered.sort((a, b) => a.rombel.localeCompare(b.rombel));
      }

      if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 24px; color: var(--text-muted);">Tidak ada rombel yang sesuai kriteria pencarian.</td></tr>`;
        return;
      }

      tableBody.innerHTML = filtered.map((r, idx) => {
        const cat = r.rata_rata_skor >= 3.26 ? "Sangat Baik" : "Baik";
        const catBadge = cat === "Sangat Baik" ? "badge-green" : "badge-blue";

        return `
          <tr>
            <td style="font-weight: 700; color: var(--text-main);">${idx + 1}</td>
            <td><strong>${r.rombel}</strong></td>
            <td><span class="badge badge-yellow" style="font-size: 0.75rem;">${r.jurusan}</span></td>
            <td>${r.jumlah_responden} Siswa</td>
            <td><strong style="color: var(--primary-dark); font-size: 1.05rem;">${r.rata_rata_skor.toFixed(2)}</strong></td>
            <td><span class="badge ${catBadge}">${cat}</span></td>
          </tr>
        `;
      }).join("");
    };

    if (searchInput) searchInput.addEventListener("input", updateTable);
    if (filterJurusan) filterJurusan.addEventListener("change", updateTable);
    if (sortSelect) sortSelect.addEventListener("change", updateTable);

    updateTable();
  };

  // ==========================================
  // 6. Render Per Rayon & Gaya Belajar
  // ==========================================
  const renderRayonDanGayaBelajar = () => {
    const rayonContainer = document.getElementById("rayonContainer");
    const gayaContainer = document.getElementById("gayaBelajarContainer");

    if (rayonContainer && data.per_rayon) {
      const rayons = [...data.per_rayon].sort((a, b) => b.rata_rata_skor - a.rata_rata_skor);
      rayonContainer.innerHTML = rayons.map((ry, idx) => `
        <div style="background: var(--bg-card); padding: 16px 20px; border-radius: var(--radius-sm); border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div>
            <div style="font-weight: 700; color: var(--text-main);">${idx + 1}. Rayon ${ry.rayon}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">${ry.jumlah_responden} responden</div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--primary);">${ry.rata_rata_skor.toFixed(2)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">SANGAT BAIK (${ry.kategori_persen['Sangat Baik']}%)</div>
          </div>
        </div>
      `).join("");
    }

    if (gayaContainer && data.per_gaya_belajar) {
      gayaContainer.innerHTML = data.per_gaya_belajar.map((g) => {
        const icons = { Visual: "👁️", Auditori: "🎧", Kinestetik: "🏃" };
        return `
          <div class="card card-top-accent">
            <div style="font-size: 2rem; margin-bottom: 8px;">${icons[g.gaya_belajar] || "💡"}</div>
            <h3>Gaya Belajar: ${g.gaya_belajar}</h3>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-dark); font-family: var(--font-heading); margin-bottom: 4px;">
              ${g.rata_rata_skor.toFixed(2)} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">/ 4.00</span>
            </div>
            <p style="font-size: 0.9rem; margin-bottom: 12px;">Jumlah Siswa: <strong>${g.jumlah_responden} responden</strong> (${((g.jumlah_responden/data.meta.jumlah_responden)*100).toFixed(1)}%)</p>
            <div style="background: var(--bg-surface); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.85rem;">
              Sangat Baik: <strong>${g.kategori_persen["Sangat Baik"]}%</strong> | Baik: <strong>${g.kategori_persen["Baik"]}%</strong>
            </div>
          </div>
        `;
      }).join("");
    }
  };

  // Run all renders
  initKPI();
  renderDonutChart();
  renderHistogramChart();
  renderButirList("all");
  renderJurusan();
  renderRombelTable();
  renderRayonDanGayaBelajar();

  // Resize listener for responsive charts
  window.addEventListener("resize", () => {
    renderHistogramChart();
  });
});

