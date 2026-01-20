// Registro global do plugin de rótulos de dados para todos os gráficos
Chart.register(ChartDataLabels);

const API_URL = 'https://sigma.hermeticshell.org/api/dados';

// Base de Dados de Segurança (Backup/Mock)
const LOCAL_DATA = {
    backlog: {
        ability: { 
            rows: [
                { l: 'Menos que 8H', o: 7, a: 76, p_o: 50, p_a: 60 }, 
                { l: 'Entre 8H e 24H', o: 6, a: 42, p_o: 40, p_a: 35 }, 
                { l: 'Acima de 24h', o: 0, a: 0, p_o: 0, p_a: 0 }
            ], 
            total: { o: 13, a: 118, mo: 8 } 
        },
        telji: { 
            rows: [
                { l: 'Menos que 8H', o: 3, a: 45, p_o: 30, p_a: 40 }, 
                { l: 'Entre 8H e 24H', o: 5, a: 61, p_o: 35, p_a: 50 }, 
                { l: 'Acima de 24h', o: 0, a: 0, p_o: 0, p_a: 0 }
            ], 
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
    metas: { 
        projeção: { litoral: 55, sjc: 125, ji: 105 }, 
        afetacao: { litoral: 520, sjc: 1350, ji: 1050 } 
    },
    historico_regional: {
        litoral: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [45, 38, 55, 62, 58] },
        sjc: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [110, 95, 120, 140, 134] },
        ji: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [85, 70, 90, 110, 102] }
    },
    afetacao_regional: {
        litoral: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [420, 380, 510, 600, 540] },
        sjc: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [1200, 1050, 1300, 1450, 1343] },
        ji: { labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan'], valores: [950, 820, 1000, 1150, 1080] }
    },
    diarizado: {
        labels: Array.from({length: 20}, (_, i) => `${(i+1).toString().padStart(2, '0')}/jan`),
        litoral: { prazo: [10, 15, 12, 8, 20, 18, 11, 8, 10, 12, 14, 11, 12, 9, 8, 15, 14, 12, 10, 9], fora: [2, 3, 1, 4, 2, 3, 1, 2, 4, 3, 2, 1, 2, 1, 2, 1, 3, 1, 2, 1] },
        sjc: { prazo: [18, 50, 30, 15, 40, 32, 35, 8, 12, 18, 22, 18, 20, 15, 14, 21, 18, 14, 17, 15], fora: [4, 13, 7, 6, 5, 6, 6, 2, 3, 2, 8, 4, 4, 5, 4, 5, 4, 5, 4, 3] },
        ji: { prazo: [15, 40, 25, 12, 35, 28, 30, 7, 10, 15, 18, 14, 16, 13, 11, 18, 15, 13, 14, 12], fora: [3, 10, 6, 5, 4, 5, 5, 2, 2, 3, 2, 4, 3, 4, 4, 3, 3, 3, 3, 3] }
    },
    analitico: [
        { oc: '916767', m: 'HORTOLANDIA', at: 'HT', aging: '22h 30m', af: 6, tec: 'JOÃO SILVA' },
        { oc: '916664', m: 'OSASCO', at: 'QT', aging: '26h 45m', af: 36, tec: 'MARCOS OLIVEIRA' }
    ],
    kpis: {
        vale: { sla: 85, fp: 1, dp: 12, tot: 13, bg: 'bg-vale' },
        litoral: { sla: 92, fp: 0, dp: 10, tot: 10, bg: 'bg-litoral-sky' },
        jundiai: { sla: 78, fp: 2, dp: 8, tot: 10, bg: 'bg-jundiai-green' }
    }
};

document.addEventListener('DOMContentLoaded', () => initApp());

/**
 * Inicialização com Integração API
 */
async function initApp() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error();
        const apiData = await response.json();
        // Renderiza com dados da API se disponíveis, senão usa backup
        renderDashboard(apiData.views || LOCAL_DATA);
    } catch (err) {
        console.warn("Usando base de dados local.");
        renderDashboard(LOCAL_DATA);
    }
}

function renderDashboard(data) {
    renderTables(data.backlog);
    renderDonuts(data.donuts);
    renderAtCharts(data.at_data);
    renderAnalitico(data.analitico);
    renderKpiCards(data.kpis);
    renderRegionalTrends(data.historico_regional, data.metas.projeção);
    renderAfetacaoTrends(data.afetacao_regional, data.metas.afetacao);
    renderDiarizadoCharts(data.diarizado);
}

// --- FUNÇÕES DE RENDERIZAÇÃO ---

function renderTables(d) {
    const r = (id, data) => {
        document.getElementById(id).innerHTML = data.rows.map(row => `
            <tr class="text-center">
                <td class="p-3 text-left bg-gray-50 font-bold border-r-2">${row.l}</td>
                <td class="bar-blue" style="--p:${row.p_o}%">${row.o}</td>
                <td class="bar-blue" style="--p:${row.p_a}%">${row.a}</td>
                <td>0</td><td>0</td><td class="value-zero">0</td><td class="value-zero">0</td><td class="value-zero">0</td>
            </tr>`).join('') + 
            `<tr class="row-total text-center"><td class="p-3 text-left italic uppercase">Total</td><td>${data.total.o}</td><td>${data.total.a}</td><td>5</td><td>${data.total.mo}</td><td>2</td><td>1</td><td>0</td></tr>`;
    };
    r('body-ability', d.ability);
    r('body-tel', d.telji);
}

function renderDonuts(d) {
    const regions = ['litoral', 'sjc', 'ji'];
    const canvasIds = ['donutLitoral', 'donutSJC', 'donutJI'];
    
    regions.forEach((reg, i) => {
        const s = d[reg];
        const total = s.enc + s.and + s.seq;
        new Chart(document.getElementById(canvasIds[i]).getContext('2d'), {
            type: 'doughnut',
            data: { 
                labels: ['ENCERRADAS', 'EM EXECUÇÃO', 'PENDENTE'], 
                datasets: [{ data: [s.enc, s.and, s.seq], backgroundColor: ['#28a745', s.color, '#ed7d31'], borderWidth: 1 }] 
            },
            options: {
                cutout: '65%', maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'right', labels: { padding: 15, font: { size: 11, weight: 'bold' }, usePointStyle: true } },
                    datalabels: { color: '#fff', font: { weight: 'bold', size: 13 }, formatter: (v) => v > 0 ? v : '' }
                }
            },
            plugins: [{
                id: 'centerTxt',
                afterDraw: c => {
                    const { ctx, chartArea: { top, bottom, left, right } } = c;
                    ctx.save(); ctx.font = "bold 2.4rem sans-serif"; ctx.fillStyle = "#333"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    ctx.fillText(total, (left + right) / 2, (top + bottom) / 2 - 5);
                    ctx.font = "bold 0.8rem sans-serif"; ctx.fillText("TOTAL", (left + right) / 2, (top + bottom) / 2 + 18);
                    ctx.restore();
                }
            }]
        });
    });
}

function renderAtCharts(d) {
    const configs = [
        { id: 'barAtLitoral', data: d.litoral, color: '#0070c0' },
        { id: 'barAtSJC', data: d.sjc, color: '#0070c0' },
        { id: 'barAtJI', data: d.ji, color: '#0070c0' }
    ];
    configs.forEach(c => {
        new Chart(document.getElementById(c.id).getContext('2d'), {
            type: 'bar',
            data: { 
                labels: c.data.map(i => i.at), 
                datasets: [
                    { label: 'EXECUÇÃO', data: c.data.map(i => i.exec), backgroundColor: c.color },
                    { label: 'DEMANDA', data: c.data.map(i => i.dem), backgroundColor: '#ed7d31' }
                ] 
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, usePointStyle: true } },
                    datalabels: { anchor: 'end', align: 'top', font: { size: 10, weight: 'bold' }, formatter: (v) => v > 0 ? v : '' }
                },
                scales: { y: { display: false, beginAtZero: true, grace: '20%' }, x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } } }
            }
        });
    });
}

function renderRegionalTrends(hist, targets) {
    const keys = ['litoral', 'sjc', 'ji'];
    const ids = ['trendLitoral', 'trendSJC', 'trendJI'];
    keys.forEach((k, i) => {
        const d = hist[k];
        new Chart(document.getElementById(ids[i]).getContext('2d'), {
            type: 'line',
            data: {
                labels: d.labels,
                datasets: [
                    { data: d.valores, borderColor: '#0070c0', backgroundColor: 'rgba(0, 112, 192, 0.05)', borderWidth: 2, pointRadius: 4, fill: true, tension: 0.3 },
                    { data: Array(d.labels.length).fill(targets[k]), borderColor: '#ff4d4d', borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, fill: false }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: { 
                        align: 'top', font: { weight: 'bold', size: 11 }, 
                        color: (ctx) => ctx.datasetIndex === 0 ? '#0070c0' : '#ff4d4d',
                        formatter: (v, ctx) => ctx.dataIndex === d.labels.length - 1 ? v : '' 
                    }
                },
                scales: { y: { display: false, beginAtZero: false, grace: '30%' }, x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } } }
            }
        });
    });
}

function renderAfetacaoTrends(hist, targets) {
    const keys = ['litoral', 'sjc', 'ji'];
    const ids = ['afetTrendLitoral', 'afetTrendSJC', 'afetTrendJI'];
    keys.forEach((k, i) => {
        const d = hist[k];
        new Chart(document.getElementById(ids[i]).getContext('2d'), {
            type: 'line',
            data: {
                labels: d.labels,
                datasets: [
                    { data: d.valores, borderColor: '#0070c0', backgroundColor: 'rgba(0, 112, 192, 0.1)', borderWidth: 2, pointRadius: 4, fill: true, tension: 0.3 },
                    { data: Array(d.labels.length).fill(targets[k]), borderColor: '#ff4d4d', borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, fill: false }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: { 
                        align: 'top', font: { weight: 'bold', size: 11 }, 
                        color: (ctx) => ctx.datasetIndex === 0 ? '#0070c0' : '#ff4d4d',
                        formatter: (v, ctx) => ctx.dataIndex === d.labels.length - 1 ? v : '' 
                    }
                },
                scales: { y: { display: false, beginAtZero: false, grace: '30%' }, x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } } }
            }
        });
    });
}

function renderDiarizadoCharts(d) {
    const ids = ['dailyLitoral', 'dailySJC', 'dailyJI'];
    const keys = ['litoral', 'sjc', 'ji'];
    keys.forEach((k, i) => {
        const data = d[k];
        const total = data.prazo.map((v, idx) => v + data.fora[idx]);
        new Chart(document.getElementById(ids[i]).getContext('2d'), {
            type: 'bar',
            data: {
                labels: d.labels,
                datasets: [
                    { type: 'line', label: 'TOTAL', data: total, borderColor: '#0070c0', borderWidth: 2.5, pointRadius: 2, fill: false, tension: 0.1, datalabels: { align: 'top', color: '#0070c0', font: { weight: 'bold', size: 11 } } },
                    { label: 'NO PRAZO', data: data.prazo, backgroundColor: '#28a745', stack: 's1', datalabels: { display: false } },
                    { label: 'FORA PRAZO', data: data.fora, backgroundColor: '#ed7d31', stack: 's1', datalabels: { display: false } }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, usePointStyle: true } } },
                scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }, y: { stacked: true, display: false, beginAtZero: true, grace: '40%' } }
            }
        });
    });
}

function renderAnalitico(d) {
    document.getElementById('body-analitico').innerHTML = d.map(item => `
        <tr class="hover:bg-gray-100 transition-colors border-b">
            <td class="p-3 font-black border-r">${item.oc}</td>
            <td class="p-3 border-r uppercase">${item.m}</td>
            <td class="p-3 border-r font-black">${item.at}</td>
            <td class="p-3 text-center border-r aging-hot">${item.aging}</td>
            <td class="p-3 text-center border-r font-black">${item.af}</td>
            <td class="p-3 italic text-purple-800 font-black">${item.tec}</td>
        </tr>`).join('');
}

function renderKpiCards(k) {
    const r = (id, data) => {
        document.getElementById(id).innerHTML = `
            <div class="card-kpi ${data.bg}"><span class="c-label">Prazo D-1</span><span class="c-number">${data.sla}%</span></div>
            <div class="card-kpi ${data.bg}"><span class="c-label">OCs FP</span><span class="c-number">${data.fp}</span></div>
            <div class="card-kpi ${data.bg}"><span class="c-label">OCs DP</span><span class="c-number">${data.dp}</span></div>
            <div class="card-kpi ${data.bg}"><span class="c-label">Total OCs</span><span class="c-number">${data.tot}</span></div>`;
    };
    r('cards-vale', k.vale);
    r('cards-litoral', k.litoral);
    r('cards-jundiai', k.jundiai);
}

/**
 * Exportação Forçada para Desktop (Resiliente para Mobile)
 */
async function exportarDashboard() {
    const body = document.body;
    const originalWidth = body.style.width;
    const originalMinWidth = body.style.minWidth;

    body.style.width = '1440px';
    body.style.minWidth = '1440px';

    await new Promise(resolve => setTimeout(resolve, 400)); // Tempo para re-renderização

    try {
        const canvas = await html2canvas(body, {
            scale: 2, windowWidth: 1440, useCORS: true
        });
        const link = document.createElement('a');
        link.download = `Painel_Gestao_Total_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
    } catch (e) {
        alert("Erro ao exportar relatório.");
    } finally {
        body.style.width = originalWidth;
        body.style.minWidth = originalMinWidth;
    }
}