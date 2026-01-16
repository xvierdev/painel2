Chart.register(ChartDataLabels);

const LOCAL_DATA = {
    backlog: {
        ability: {
            rows: [{ l: 'Menos que 8H', o: 7, a: 76, p_o: 50, p_a: 60 }, { l: 'Entre 8H e 24H', o: 6, a: 42, p_o: 40, p_a: 35 }, { l: 'Acima de 24h', o: 0, a: 0, p_o: 0, p_a: 0 }],
            total: { o: 13, a: 118, mo: 8 }
        },
        telji: {
            rows: [{ l: 'Menos que 8H', o: 3, a: 45, p_o: 30, p_a: 40 }, { l: 'Entre 8H e 24H', o: 5, a: 61, p_o: 35, p_a: 50 }, { l: 'Acima de 24h', o: 0, a: 0, p_o: 0, p_a: 0 }],
            total: { o: 8, a: 106, mo: 6 }
        }
    },
    donuts: {
        litoral: { enc: 10, and: 1, seq: 0, color: '#0070c0' },
        sjc: { enc: 20, and: 7, seq: 3, color: '#0070c0' },
        ji: { enc: 15, and: 5, seq: 2, color: '#0070c0' }
    },
    at_data: {
        litoral: [{ at: 'AA', exec: 1, dem: 0 }],
        sjc: [{ at: 'JS', exec: 2, dem: 1 }, { at: 'EM', exec: 1, dem: 0 }, { at: 'SJ', exec: 0, dem: 1 }, { at: 'RH', exec: 1, dem: 0 }],
        ji: [{ at: 'JS', exec: 2, dem: 1 }, { at: 'EM', exec: 1, dem: 0 }, { at: 'SJ', exec: 0, dem: 1 }, { at: 'RH', exec: 1, dem: 0 }]
    },
    // Histórico de Ocorrências (6 meses)
    historico_regional: {
        litoral: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [45, 38, 55, 62, 58] },
        sjc: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [110, 95, 120, 140, 134] },
        ji: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [85, 70, 90, 110, 102] }
    },
    // NOVO: Histórico de Afetação (6 meses)
    afetacao_regional: {
        litoral: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [420, 380, 510, 600, 540] },
        sjc: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [1200, 1050, 1300, 1450, 1343] }, // Ref: 1343
        ji: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [950, 820, 1000, 1150, 1080] }
    },
    analitico: [{ oc: '916767', m: 'HORTOLANDIA', at: 'HT', aging: '22h 30m', af: 6, tec: 'JOÃO SILVA' }, { oc: '916664', m: 'OSASCO', at: 'QT', aging: '26h 45m', af: 36, tec: 'MARCOS OLIVEIRA' }],
    kpis: {
        vale: { sla: 85, fp: 1, dp: 12, tot: 13, bg: 'bg-vale' },
        litoral: { sla: 92, fp: 0, dp: 10, tot: 10, bg: 'bg-litoral-sky' },
        jundiai: { sla: 78, fp: 2, dp: 8, tot: 10, bg: 'bg-jundiai-green' }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

function initDashboard() {
    renderTables();
    renderDonuts();
    renderAtCharts();
    renderAnalitico();
    renderKpiCards();
    renderRegionalTrends();
    renderAfetacaoTrends(); // Nova função de afetação
}

function renderTables() {
    const r = (id, d) => {
        document.getElementById(id).innerHTML = d.rows.map(r => `<tr class="text-center"><td class="p-2 text-left bg-gray-50 font-bold border-r-2">${r.l}</td><td class="bar-blue" style="--p:${r.p_o}%">${r.o}</td><td class="bar-blue" style="--p:${r.p_a}%">${r.a}</td><td>0</td><td>0</td><td class="value-zero">0</td><td class="value-zero">0</td><td class="value-zero">0</td></tr>`).join('') + `<tr class="row-total text-center"><td class="p-2 text-left italic uppercase">Total</td><td>${d.total.o}</td><td>${d.total.a}</td><td>5</td><td>${d.total.mo}</td><td>2</td><td>1</td><td>0</td></tr>`;
    };
    r('body-ability', LOCAL_DATA.backlog.ability);
    r('body-tel', LOCAL_DATA.backlog.telji);
}

function renderDonuts() {
    const r = (id, s, color) => {
        const total = s.enc + s.and + s.seq;
        new Chart(document.getElementById(id), {
            type: 'doughnut',
            data: { labels: ['ENCERRADAS', 'EM EXECUÇÃO', 'PENDENTE'], datasets: [{ data: [s.enc, s.and, s.seq], backgroundColor: ['#28a745', color, '#ed7d31'], borderWidth: 1 }] },
            options: { cutout: '65%', maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { padding: 15, font: { size: 9, weight: 'bold' }, usePointStyle: true } }, datalabels: { color: '#fff', font: { weight: 'bold', size: 11 }, formatter: (v) => v > 0 ? v : '' } } },
            plugins: [{ id: 'centerTxt', afterDraw: c => { const { ctx, chartArea: { top, bottom, left, right } } = c; ctx.save(); ctx.font = "bold 2rem sans-serif"; ctx.fillStyle = "#333"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(total, (left + right) / 2, (top + bottom) / 2 - 5); ctx.font = "bold 0.6rem sans-serif"; ctx.fillText("TOTAL", (left + right) / 2, (top + bottom) / 2 + 18); ctx.restore(); } }]
        });
    };
    r('donutLitoral', LOCAL_DATA.donuts.litoral, '#0070c0');
    r('donutSJC', LOCAL_DATA.donuts.sjc, '#0070c0');
    r('donutJI', LOCAL_DATA.donuts.ji, '#0070c0');
}

function renderAtCharts() {
    const r = (id, data, color) => {
        new Chart(document.getElementById(id), {
            type: 'bar',
            data: { labels: data.map(i => i.at), datasets: [{ label: 'EM EXECUÇÃO', data: data.map(i => i.exec), backgroundColor: color }, { label: 'DEMANDA DE EQUIPE', data: data.map(i => i.dem), backgroundColor: '#ed7d31' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { padding: 10, font: { size: 8, weight: 'bold' }, usePointStyle: true } }, datalabels: { anchor: 'end', align: 'top', font: { size: 9, weight: 'bold' }, formatter: (v) => v > 0 ? v : '' } }, scales: { y: { display: false, beginAtZero: true, grace: '20%' }, x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } } } }
        });
    };
    r('barAtLitoral', LOCAL_DATA.at_data.litoral, '#0070c0');
    r('barAtSJC', LOCAL_DATA.at_data.sjc, '#0070c0');
    r('barAtJI', LOCAL_DATA.at_data.ji, '#0070c0');
}

function renderRegionalTrends() {
    const draw = (id, data) => {
        const ctx = document.getElementById(id).getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{ data: data.valores, borderColor: '#0070c0', backgroundColor: 'rgba(0, 112, 192, 0.05)', borderWidth: 2, pointRadius: 4, fill: true, tension: 0.3 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, datalabels: { align: 'top', font: { weight: 'bold', size: 10 }, color: '#0070c0' } },
                scales: { y: { display: false, beginAtZero: false, grace: '30%' }, x: { grid: { display: false }, ticks: { font: { size: 8, weight: 'bold' } } } }
            }
        });
    };
    draw('trendLitoral', LOCAL_DATA.historico_regional.litoral);
    draw('trendSJC', LOCAL_DATA.historico_regional.sjc);
    draw('trendJI', LOCAL_DATA.historico_regional.ji);
}

// Renderiza as 3 tendências de afetação
function renderAfetacaoTrends() {
    const draw = (id, data) => {
        const ctx = document.getElementById(id).getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.valores,
                    borderColor: '#0070c0',
                    backgroundColor: 'rgba(0, 112, 192, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#0070c0',
                    pointRadius: 4,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: { align: 'top', font: { weight: 'bold', size: 10 }, color: '#0070c0' }
                },
                scales: {
                    y: { display: false, beginAtZero: false, grace: '30%' },
                    x: { grid: { display: false }, ticks: { font: { size: 8, weight: 'bold' } } }
                }
            }
        });
    };
    draw('afetTrendLitoral', LOCAL_DATA.afetacao_regional.litoral);
    draw('afetTrendSJC', LOCAL_DATA.afetacao_regional.sjc);
    draw('afetTrendJI', LOCAL_DATA.afetacao_regional.ji);
}

function renderAnalitico() {
    document.getElementById('body-analitico').innerHTML = LOCAL_DATA.analitico.map(i => `<tr class="hover:bg-gray-100"><td class="p-2 font-black border-r">${i.oc}</td><td class="p-2 border-r uppercase">${i.m}</td><td class="p-2 border-r font-bold">${i.at}</td><td class="p-2 text-center border-r aging-hot">${i.aging}</td><td class="p-2 text-center border-r font-black">${i.af}</td><td class="p-2 italic text-purple-800 font-bold">${i.tec}</td></tr>`).join('');
}

function renderKpiCards() {
    const r = (id, k) => {
        document.getElementById(id).innerHTML = `<div class="card-kpi ${k.bg}"><span class="c-label">Prazo D-1</span><span class="c-number">${k.sla}%</span></div><div class="card-kpi ${k.bg}"><span class="c-label">OCs FP</span><span class="c-number">${k.fp}</span></div><div class="card-kpi ${k.bg}"><span class="c-label">OCs DP</span><span class="c-number">${k.dp}</span></div><div class="card-kpi ${k.bg}"><span class="c-label">Total OCs</span><span class="c-number">${k.tot}</span></div>`;
    };
    r('cards-vale', LOCAL_DATA.kpis.vale);
    r('cards-litoral', LOCAL_DATA.kpis.litoral);
    r('cards-jundiai', LOCAL_DATA.kpis.jundiai);
}

async function exportarDashboard() {
    const canvas = await html2canvas(document.body, { scale: 1.5 });
    const link = document.createElement('a');
    link.download = `Painel_Gestao_Total.png`;
    link.href = canvas.toDataURL();
    link.click();
}