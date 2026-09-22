import { html } from 'js/html.js';

class GeneratorMetric extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.isLoading) {
      this.loadLogs();
    }
  }

  async loadLogs() {
    this.isLoading = true;
    try {
      const response = await fetch('/api/generator/summary');
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();

      this.allLogs = data;

      this.applyFiltersAndRender();
    } catch (error) {
    } finally {
      this.isLoading = false;
    }
  }

  render(data, titleContext) {
    const yearHtml = html`
      <div class="dashboard-banner-title ui-h5" style="margin-top: var(--size-3); font-weight: bold;">
        ${titleContext}
      </div>
      <div class="dashboard-banner">
        <div class="stat-card">
          <span class="stat-title">Total Engine Hours</span>
          <span class="stat-value">${data.total_hours_run} hrs</span>
        </div>
        <div class="stat-card">
          <span class="stat-title">Fuel Consumed</span>
          <span class="stat-value">${data.total_fuel_used}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-title">Average Burn Rate</span>
          <span class="stat-value">${data.avg_burn_rate} %/hr</span>
        </div>
      </div>
    `;

    return yearHtml;
  }

  async applyFiltersAndRender() {
    if (!this.allLogs || this.allLogs.length === 0) return;

    let metricHtml = html``;

    // 1. Loop and render individual calendar years with active run counts
    for (const yearData of this.allLogs) {
      const runsLabel = yearData.total_runs === 1 ? '1 run' : `${yearData.total_runs} runs`;
      metricHtml += this.render(yearData, `Year: ${yearData.summary_year} (${runsLabel})`);
    }

    // 2. Reduce the data in memory for the all-time historic row
    const foreverData = this.allLogs.reduce(
      (acc, curr) => {
        acc.total_hours_run += curr.total_hours_run;
        acc.total_fuel_used += curr.total_fuel_used;
        acc.total_runs += curr.total_runs; // Accumulate global runs count
        return acc;
      },
      { total_hours_run: 0, total_fuel_used: 0, total_runs: 0 },
    );

    // Normalize burn rate math accurately
    foreverData.avg_burn_rate =
      foreverData.total_hours_run > 0 ? (foreverData.total_fuel_used / foreverData.total_hours_run).toFixed(2) : '0.00';

    foreverData.total_hours_run = foreverData.total_hours_run.toFixed(1);

    // 3. Append the overall totals banner to the bottom layout card slot
    metricHtml += html`<div class="forever-divider"></div>`;
    metricHtml += this.render(foreverData, `All-Time Historic Stats ♾️ (${foreverData.total_runs} total runs)`);

    const dashboard = this.querySelector('.dashboard-wrapper');
    if (dashboard) dashboard.innerHTML = metricHtml;
  }
}

customElements.define('generator-metric', GeneratorMetric);
