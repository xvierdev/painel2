// Registro do plugin de rótulos de dados
Chart.register(ChartDataLabels);

const API_URL = '/api/painel2';
const AUTO_REFRESH_MS = 30000;
const REQUEST_TIMEOUT_MS = 15000;
const CHART_CANVAS_IDS = [
    'donutLitoral', 'donutSJC', 'donutJI',
    'barAtLitoral', 'barAtSJC', 'barAtJI',
    'trendLitoral', 'trendSJC', 'trendJI',
    'afetTrendLitoral', 'afetTrendSJC', 'afetTrendJI',
    'dailyLitoral', 'dailySJC', 'dailyJI'
];

let isRefreshing = false;
let pendingRefresh = false;
let autoRefreshTimer = null;

// Horário atual para cálculo de Aging (10/02/2026 09:40)
const REF_TIME = new Date("2026-02-10T09:40:00");

// Dados Históricos Mock (Mantidos para as seções de tendência)
const HISTORICAL_DATA = {
    metas: { projeção: { litoral: 0, sjc: 125, jundiai: 105 }, afetacao: { litoral: 0, sjc: 1350, jundiai: 1050 } },
    historico_regional: {
        litoral: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [0, 0, 0, 0, 0] },
        sjc: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [110, 95, 120, 140, 134] },
        jundiai: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [85, 70, 90, 110, 102] }
    },
    afetacao_regional: {
        litoral: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [0, 0, 0, 0, 0] },
        sjc: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [1200, 1050, 1300, 1450, 1343] },
        jundiai: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [950, 820, 1000, 1150, 1080] }
    },
    diarizado: {
        labels: ['10/02', '11/02', '12/02', '13/02', '14/02', '15/02', '16/02'],
        litoral: { prazo: [11, 10, 9, 8, 7, 6, 5], fora: [0, 0, 0, 0, 1, 2, 3] },
        sjc: { prazo: [10, 9, 8, 7, 6, 5, 4], fora: [0, 0, 0, 1, 2, 3, 4] },
        jundiai: { prazo: [11, 10, 9, 8, 7, 6, 5], fora: [0, 0, 0, 0, 1, 2, 3] }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    bindActions();
    initApp('initial');
    setupAutoRefresh();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        requestRefresh('resume');
    }
});

function setupAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
    }

    autoRefreshTimer = setInterval(() => {
        requestRefresh('auto');
    }, AUTO_REFRESH_MS);
}

function bindActions() {
    const refreshButton = document.getElementById('btn-refresh-data');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => requestRefresh('manual'));
    }
}

function requestRefresh(source = 'manual') {
    if (isRefreshing) {
        pendingRefresh = true;
        const statusText = document.getElementById('header-status');
        if (statusText) statusText.innerText = 'ATUALIZAÇÃO EM FILA...';
        return;
    }

    initApp(source);
}

window.requestRefresh = requestRefresh;
window.initApp = initApp;

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

function destroyAllCharts() {
    CHART_CANVAS_IDS.forEach((canvasId) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const chart = Chart.getChart(canvas);
        if (chart) chart.destroy();
    });
}

function setRefreshState(loading) {
    const updateButton = document.getElementById('btn-refresh-data');
    if (!updateButton) return;

    updateButton.disabled = loading;
    updateButton.classList.toggle('opacity-60', loading);
    updateButton.classList.toggle('cursor-not-allowed', loading);
}

/**
 * Busca dados da API com tratamento de erro detalhado
 */
async function initApp(source = 'manual') {
    if (isRefreshing) return;

    isRefreshing = true;
    setRefreshState(true);

    const statusText = document.getElementById('header-status');
    try {
        if (statusText) statusText.innerText = "Conectando à API...";

        const apiRequestUrl = `${API_URL}?_ts=${Date.now()}`;
        const response = await fetchWithTimeout(apiRequestUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        console.log("Dados reais carregados:", data);

        const processed = processNewJson(data);
        renderDashboard(processed);

        if (statusText) statusText.innerText = `ATUALIZADO ÀS ${new Date().toLocaleTimeString()}`;
    } catch (err) {
        console.error("ERRO NA API REAL, ativando fallback mock:", err);
        try {
            const fallback = await fetchWithTimeout(`mock-dados.json?_ts=${Date.now()}`, { cache: 'no-store' });
            if (!fallback.ok) throw new Error(`HTTP Error: ${fallback.status}`);
            const mockData = await fallback.json();
            const processed = processNewJson(mockData);
            renderDashboard(processed);
            if (statusText) statusText.innerText = `MODO MOCK (FALLBACK) - ATUALIZADO ÀS ${new Date().toLocaleTimeString()}`;
        } catch (mockErr) {
            console.error("ERRO CRÍTICO AO CARREGAR MOCK:", mockErr);
            if (statusText) statusText.innerText = "ERRO - API E MOCK INDISPONÍVEIS";
        }
    } finally {
        isRefreshing = false;
        setRefreshState(false);

        if (pendingRefresh) {
            pendingRefresh = false;
            setTimeout(() => requestRefresh('queued'), 0);
        }
    }
}

/**
 * Processamento Estrito: Ability_SJ e Tel_JI
 */
// Novo processador para o novo formato de JSON
function processNewJson(data) {
    const toNumber = (value) => Number(value) || 0;

    // 1. Backlog para tabelas principais
    function mapTable(t) {
        const rows = [
            {
                l: 'Menos que 8H',
                o: t.menos_8h.ocorrencias,
                a: t.menos_8h['afetação'],
                s: t.menos_8h.sem_mo,
                m: t.menos_8h.mo_sjc,
                i: t.menos_8h.moin,
                v: t.menos_8h.vip,
                av: t.menos_8h.alto_valor
            },
            {
                l: 'Entre 8H e 24H',
                o: t.menos_24h.ocorrencias,
                a: t.menos_24h['afetação'],
                s: t.menos_24h.sem_mo,
                m: t.menos_24h.mo_sjc,
                i: t.menos_24h.moin,
                v: t.menos_24h.vip,
                av: t.menos_24h.alto_valor
            },
            {
                l: 'Acima de 24h',
                o: t.acima_24h.ocorrencias,
                a: t.acima_24h['afetação'],
                s: t.acima_24h.sem_mo,
                m: t.acima_24h.mo_sjc,
                i: t.acima_24h.moin,
                v: t.acima_24h.vip,
                av: t.acima_24h.alto_valor
            }
        ];
        const total = rows.reduce((acc, r) => {
            acc.o += r.o; acc.a += r.a; acc.s += r.s; acc.m += r.m; acc.i += r.i; acc.v += r.v; acc.av += r.av;
            return acc;
        }, {o:0,a:0,s:0,m:0,i:0,v:0,av:0});
        return { rows, total };
    }

    // 2. Donuts
    function mapDonuts(d) {
        return {
            litoral: { enc: toNumber(d?.litoral?.encerradas), and: toNumber(d?.litoral?.em_execucao), seq: toNumber(d?.litoral?.pendentes), color: '#0070c0' },
            sjc: { enc: toNumber(d?.sjc?.encerradas), and: toNumber(d?.sjc?.em_execucao), seq: toNumber(d?.sjc?.pendentes), color: '#0070c0' },
            jundiai: { enc: toNumber(d?.jundiai?.encerradas), and: toNumber(d?.jundiai?.em_execucao), seq: toNumber(d?.jundiai?.pendentes), color: '#0070c0' }
        };
    }

    // 3. Barras AT
    function mapAt(b) {
        return {
            litoral: (b?.litoral?.dados || []).map(i => ({ at: i.at, exec: toNumber(i.em_execucao), dem: toNumber(i.demanda) })),
            sjc: (b?.sjc?.dados || []).map(i => ({ at: i.at, exec: toNumber(i.em_execucao), dem: toNumber(i.demanda) })),
            jundiai: (b?.jundiai?.dados || []).map(i => ({ at: i.at, exec: toNumber(i.em_execucao), dem: toNumber(i.demanda) }))
        };
    }

    // 4. Analítico
    function mapAnalytics(a) {
        return a.data.map(i => ({
            oc: i.id_ocorrencia,
            m: i.municipio,
            at: i.at,
            aging: i.aging,
            af: i.afetacao,
            tec: i.tecnico
        }));
    }

    // 5. Cards
    function mapCards(c) {
        return {
            vale: { sla: parseInt(c?.litoral?.['prazo_d-1']) || 0, fp: toNumber(c?.litoral?.ocs_fora_prazo), dp: toNumber(c?.litoral?.ocs_dentro_prazo), tot: toNumber(c?.litoral?.total_ocs), bg: 'bg-vale' },
            litoral: { sla: parseInt(c?.sjc?.['prazo_d-1']) || 0, fp: toNumber(c?.sjc?.ocs_fora_prazo), dp: toNumber(c?.sjc?.ocs_dentro_prazo), tot: toNumber(c?.sjc?.total_ocs), bg: 'bg-litoral-sky' },
            jundiai: { sla: parseInt(c?.jundiai?.['prazo_d-1']) || 0, fp: toNumber(c?.jundiai?.ocs_fora_prazo), dp: toNumber(c?.jundiai?.ocs_dentro_prazo), tot: toNumber(c?.jundiai?.total_ocs), bg: 'bg-jundiai-green' }
        };
    }

    // 6. Projeções (tendências)
    function mapTrends(p) {
        const keys = ['atual-5','atual-4','atual-3','atual-2','atual-1','atual-0'];
        const mapRegion = (region) => {
            const labels = keys.map((k) => region?.meses?.[k] || k);
            const valores = keys.map((k) => toNumber(region?.[k]));
            return { labels, valores };
        };
        return {
            litoral: mapRegion(p?.litoral),
            sjc: mapRegion(p?.sjc),
            jundiai: mapRegion(p?.jundiai)
        };
    }

    // 7. Projeções de afetação
    function mapAfetacao(p) {
        const keys = ['atual-5','atual-4','atual-3','atual-2','atual-1','atual-0'];
        const mapRegion = (region) => {
            const labels = keys.map((k) => region?.meses?.[k] || k);
            const valores = keys.map((k) => toNumber(region?.[k]));
            return { labels, valores };
        };
        return {
            litoral: mapRegion(p?.litoral),
            sjc: mapRegion(p?.sjc),
            jundiai: mapRegion(p?.jundiai)
        };
    }

    // 8. Diarizado (formato exato do JSON: diariazado)
    function mapDiarizado(d) {
        const keys = ['d-6', 'd-5', 'd-4', 'd-3', 'd-2', 'd-1', 'd-0'];
        const mapReg = (reg) => ({
            prazo: keys.map((key) => toNumber(reg?.[key]?.no_prazo)),
            fora: keys.map((key) => toNumber(reg?.[key]?.fora_prazo))
        });
        const labels = keys.map((key) => d?.litoral?.[key]?.data || key);

        return {
            labels,
            litoral: mapReg(d?.litoral),
            sjc: mapReg(d?.sjc),
            jundiai: mapReg(d?.jundiai)
        };
    }

    const diarizado = data?.diariazado ? mapDiarizado(data.diariazado) : HISTORICAL_DATA.diarizado;

    return {
        backlog: {
            ABILITY_SJ: mapTable(data.table.ability_sj),
            TEL_JI: mapTable(data.table.tel_ji)
        },
        donuts: mapDonuts(data.donuts),
        at_data: mapAt(data.bars_at),
        analitico: mapAnalytics(data.analytics),
        kpis: mapCards(data.cards),
        historico_regional: mapTrends(data.projecao_ocorrencias),
        metas: {
            projeção: {
                litoral: Number(data.projecao_ocorrencias?.litoral?.projecao) || 0,
                sjc: Number(data.projecao_ocorrencias?.sjc?.projecao) || 0,
                jundiai: Number(data.projecao_ocorrencias?.jundiai?.projecao) || 0
            },
            afetacao: {
                litoral: Number(data.projecao_afetacao?.litoral?.projecao) || 0,
                sjc: Number(data.projecao_afetacao?.sjc?.projecao) || 0,
                jundiai: Number(data.projecao_afetacao?.jundiai?.projecao) || 0
            }
        },
        afetacao_regional: mapAfetacao(data.projecao_afetacao),
        diarizado
    };
}

/**
 * Funções de Renderização Otimizadas
 */
function renderDashboard(data) {
    destroyAllCharts();

    // Tabelas (Ability_SJ e Tel_JI)
    const renderT = (id, d) => {
        const percent = (value, total) => (total > 0 ? ((value / total) * 100) : 0);
        document.getElementById(id).innerHTML = d.rows.map(r => `
            <tr class="text-center text-[12px]">
                <td class="p-3 text-left bg-gray-50 font-bold border-r-2">${r.l}</td>
                <td class="bar-blue" style="--p:${percent(r.o, d.total.o)}%">${r.o}</td>
                <td class="bar-blue" style="--p:${percent(r.a, d.total.a)}%">${r.a}</td>
                <td>${r.s}</td><td>${r.m}</td><td>${r.i}</td><td>${r.v}</td><td>${r.av}</td>
            </tr>`).join('') +
            `<tr class="row-total text-center text-[13px]">
                <td class="p-3 text-left italic uppercase font-black">TOTAL</td>
                <td>${d.total.o}</td><td>${d.total.a}</td><td>${d.total.s}</td>
                <td>${d.total.m}</td><td>${d.total.i}</td><td>${d.total.v}</td><td>${d.total.av}</td>
            </tr>`;
    };
    renderT('body-ability', data.backlog.ABILITY_SJ);
    renderT('body-tel', data.backlog.TEL_JI);

    // Reutiliza funções de renderização do backup anterior para Donuts, AT e Tendências
    renderDonuts(data.donuts);
    renderAtCharts(data.at_data);
    renderAnalitico(data.analitico);
    renderKpiCards(data.kpis);
    renderTrends(data.historico_regional, data.metas.projeção, 'trend');
    renderTrends(data.afetacao_regional, data.metas.afetacao, 'afetTrend');
    renderDiarizado(data.diarizado);
}

// Funções Auxiliares (Donuts, AT, Trends, etc - Mantidas do backup otimizado)
function renderDonuts(d) {
    const donutMap = [
        { key: 'litoral', id: 'donutLitoral' },
        { key: 'sjc', id: 'donutSJC' },
        { key: 'jundiai', id: 'donutJI' }
    ];

    donutMap.forEach(({ key, id }) => {
        const s = d[key];
        if (!s) return;
        const tot = s.enc + s.and + s.seq;
        const ctx = document.getElementById(id);
        if (!ctx) return;
        new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['ENCERRADAS', 'EM EXECUÇÃO', 'PENDENTE'], datasets: [{ data: [s.enc, s.and, s.seq], backgroundColor: ['#28a745', s.color, '#ed7d31'], borderWidth: 1 }] },
            options: { cutout: '65%', maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 13, weight: 'bold' } } }, datalabels: { color: '#fff', font: { weight: 'bold', size: 18 }, formatter: v => v > 0 ? v : '' } } },
            plugins: [{ id: 'ct', afterDraw: c => {
                const { ctx, chartArea: { top, bottom, left, right } } = c;
                ctx.save(); ctx.font = "bold 3rem sans-serif"; ctx.fillStyle = "#333"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText(tot, (left+right)/2, (top+bottom)/2-5); ctx.restore();
            }}]
        });
    });
}

function renderAtCharts(d) {
    const chartMap = [
        { key: 'litoral', canvasId: 'barAtLitoral' },
        { key: 'sjc', canvasId: 'barAtSJC' },
        { key: 'jundiai', canvasId: 'barAtJI' }
    ];

    chartMap.forEach(({ key, canvasId }) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !d[key]) return;

        const execValues = d[key].map(i => i.exec);
        const demValues = d[key].map(i => i.dem);
        const maxValue = Math.max(...execValues, ...demValues, 0);
        const yMax = maxValue > 0 ? Math.ceil(maxValue * 1.3) : 1;
        const barLabelOptions = {
            display: true,
            formatter: (v) => `${v}`,
            anchor: 'end',
            align: 'top',
            offset: 4,
            clamp: false,
            clip: false,
            color: '#1f2937',
            font: { size: 15, weight: 'bold' }
        };

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: d[key].map(i => i.at),
                datasets: [
                    {
                        label: 'EXECUÇÃO',
                        data: d[key].map(i => i.exec),
                        backgroundColor: '#0070c0',
                        datalabels: barLabelOptions
                    },
                    {
                        label: 'DEMANDA',
                        data: d[key].map(i => i.dem),
                        backgroundColor: '#ed7d31',
                        datalabels: barLabelOptions
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 24 } },
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 12 } } },
                    datalabels: barLabelOptions
                },
                scales: {
                    y: {
                        display: false,
                        beginAtZero: true,
                        max: yMax
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    });
}

function renderTrends(hist, meta, prefix) {
    const trendMap = [
        { histKey: 'litoral', metaKey: 'litoral', canvasId: `${prefix}Litoral` },
        { histKey: 'sjc', metaKey: 'sjc', canvasId: `${prefix}SJC` },
        { histKey: 'jundiai', metaKey: 'jundiai', canvasId: `${prefix}JI`, histFallback: 'ji', metaFallback: 'ji' }
    ];

    trendMap.forEach(({ histKey, metaKey, canvasId, histFallback, metaFallback }) => {
        const d = hist[histKey] || (histFallback ? hist[histFallback] : undefined);
        const metaValue = meta[metaKey] ?? (metaFallback ? meta[metaFallback] : undefined) ?? 0;
        const canvas = document.getElementById(canvasId);
        if (!canvas || !d || !Array.isArray(d.labels) || !Array.isArray(d.valores)) return;

        const projecaoUltimoMes = Array(d.labels.length).fill(null);
        const lastIndex = d.labels.length - 1;
        const penultimateIndex = d.labels.length - 2;
        if (penultimateIndex >= 0) {
            projecaoUltimoMes[penultimateIndex] = d.valores[penultimateIndex];
            projecaoUltimoMes[lastIndex] = metaValue;
        }

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: d.labels,
                datasets: [
                    {
                        data: d.valores,
                        borderColor: '#0070c0',
                        backgroundColor: 'rgba(0,112,192,0.05)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 5,
                        datalabels: {
                            display: true,
                            color: '#1f2937',
                            align: 'top',
                            anchor: 'end',
                            offset: 4,
                            clamp: true,
                            clip: false,
                            font: { size: 10, weight: 'bold' },
                            formatter: (v) => v
                        }
                    },
                    {
                        data: projecaoUltimoMes,
                        borderColor: '#ff4d4d',
                        backgroundColor: '#ff4d4d',
                        borderDash: [6, 6],
                        showLine: true,
                        spanGaps: true,
                        fill: false,
                        pointRadius: (ctx) => (ctx.dataIndex === lastIndex ? 5 : 3),
                        pointHoverRadius: 6,
                        datalabels: {
                            display: (ctx) => ctx.dataIndex === lastIndex,
                            color: '#b91c1c',
                            align: 'top',
                            anchor: 'end',
                            offset: 6,
                            clamp: true,
                            clip: false,
                            font: { size: 11, weight: 'bold' },
                            formatter: (v) => v
                        }
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                layout: { padding: { top: 30 } },
                plugins: {
                    legend: { display: false },
                    datalabels: { display: false }
                },
                scales: { y: { display: false } }
            }
        });
    });
}

function renderDiarizado(d) {
    const dailyMap = [
        { key: 'litoral', canvasId: 'dailyLitoral' },
        { key: 'sjc', canvasId: 'dailySJC' },
        { key: 'jundiai', canvasId: 'dailyJI' }
    ];

    dailyMap.forEach(({ key, canvasId }) => {
        const canvas = document.getElementById(canvasId);
        const data = d[key];
        if (!canvas || !data) return;
        const tot = data.prazo.map((v, i) => v + data.fora[i]);
        const maxTotal = Math.max(...tot, 0);
        const yMax = Math.max(5, Math.ceil(maxTotal * 1.4));

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: d.labels,
                datasets: [
                    {
                        label: 'NO PRAZO',
                        data: data.prazo,
                        backgroundColor: '#28a745',
                        stack: 's1',
                        order: 2,
                        datalabels: { display: false }
                    },
                    {
                        label: 'FORA PRAZO',
                        data: data.fora,
                        backgroundColor: '#ed7d31',
                        stack: 's1',
                        order: 2,
                        datalabels: { display: false }
                    },
                    {
                        type: 'line',
                        label: 'TOTAL',
                        data: tot,
                        borderColor: '#0070c0',
                        backgroundColor: '#0070c0',
                        pointRadius: 4,
                        pointHoverRadius: 5,
                        tension: 0.1,
                        fill: false,
                        order: 1,
                        datalabels: {
                            display: true,
                            color: '#1f2937',
                            anchor: 'end',
                            align: 'top',
                            offset: 6,
                            clamp: true,
                            clip: false,
                            formatter: (v) => v
                        }
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    datalabels: { display: false }
                },
                scales: {
                    x: { stacked: true },
                    y: {
                        stacked: true,
                        display: false,
                        min: 0,
                        max: yMax
                    }
                }
            }
        });
    });
}

function renderAnalitico(d) {
    document.getElementById('body-analitico').innerHTML = d.map(i => `
        <tr class="hover:bg-gray-50 border-b text-[12px]"><td class="p-3 font-black border-r">${i.oc}</td><td class="p-3 border-r uppercase">${i.m}</td>
        <td class="p-3 border-r font-black">${i.at}</td><td class="p-3 text-center border-r aging-hot">${i.aging}</td>
        <td class="p-3 text-center border-r font-black">${i.af}</td><td class="p-3 italic text-purple-800 font-black">${i.tec}</td></tr>`).join('');
}

function renderKpiCards(k) {
    const f = (id, d) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = `
            <div class="card-kpi ${d.bg}"><span class="c-label">Prazo D-1</span><span class="c-number">${d.sla}%</span></div>
            <div class="card-kpi ${d.bg}"><span class="c-label">OCs FP</span><span class="c-number">${d.fp}</span></div>
            <div class="card-kpi ${d.bg}"><span class="c-label">OCs DP</span><span class="c-number">${d.dp}</span></div>
            <div class="card-kpi ${d.bg}"><span class="c-label">Total OCs</span><span class="c-number">${d.tot}</span></div>`;
    };
    f('cards-vale', k.vale); f('cards-litoral', k.litoral); f('cards-jundiai', k.jundiai);
}

async function exportarDashboard() {
    const b = document.body; const ow = b.style.width; const omw = b.style.minWidth;
    b.style.width = '1440px'; b.style.minWidth = '1440px';
    await new Promise(r => setTimeout(r, 500));
    try {
        const c = await html2canvas(b, { scale: 2, windowWidth: 1440, useCORS: true });
        const l = document.createElement('a'); l.download = `Relatorio_Cluster_${new Date().toISOString().split('T')[0]}.png`;
        l.href = c.toDataURL(); l.click();
    } catch (e) { alert("Erro ao exportar."); } finally { b.style.width = ow; b.style.minWidth = omw; }
}