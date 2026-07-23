// =========================================================
// MOTOR DE CÁLCULO — mesma lógica do app HTML original,
// agora recebendo o preço do filamento (por tipo: PLA/ABS/PETG)
// em vez de um valor fixo único.
// =========================================================

/**
 * @param {Object} opts
 * @param {number} opts.grams               peso da peça em gramas
 * @param {number} opts.hours                horas de impressão
 * @param {number} opts.minutes              minutos de impressão (adicional às horas)
 * @param {number} opts.manualHours          horas de trabalho manual
 * @param {number} opts.filamentPricePerKg   preço do filamento usado (R$/kg) — vem de filament_types
 * @param {Object} settings                  linha da tabela settings
 * @param {Array}  packagingItems            itens de embalagem (para somar custo total)
 * @param {boolean} includePackaging         se deve somar embalagem no custo
 */
function computeCost({ grams, hours, minutes, manualHours, filamentPricePerKg }, settings, packagingItems, includePackaging) {
  const g = Number(grams) || 0;
  const h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  const manual = Number(manualHours) || 0;
  const totalHours = h + m / 60;

  const material = (Number(filamentPricePerKg) / 1000) * g;
  const energy = Number(settings.energy_rate) * (Number(settings.power_watts) / 1000) * totalHours;
  const depreciation = (Number(settings.printer_cost) / (Number(settings.printer_life_hours) || 1)) * totalHours;
  const maintenance = depreciation * Number(settings.maintenance_pct);
  const labor = Number(settings.hourly_rate) * manual;
  const failure = (material + energy + depreciation + maintenance + labor) * Number(settings.failure_pct);
  const packagingTotal = (packagingItems || []).reduce((sum, p) => sum + (Number(p.cost) || 0), 0);

  let costComFixo = material + energy + depreciation + maintenance + labor + failure;
  let costSemFixo = material + energy + labor + failure;

  if (includePackaging) {
    costComFixo += packagingTotal;
    costSemFixo += packagingTotal;
  }

  return {
    material, energy, depreciation, maintenance, labor, failure, packagingTotal,
    costComFixo, costSemFixo,
    active: settings.cost_mode === 'com_fixo' ? costComFixo : costSemFixo,
  };
}

function tierPricing(cost, multiplier) {
  const price = cost * multiplier;
  const profit = price - cost;
  const margin = price > 0 ? profit / price : 0;
  return { price, profit, margin };
}

function channelPricing(cost, marginTarget, commission, fixedFee) {
  const denom = 1 - commission - marginTarget;
  if (denom <= 0) return { price: NaN, profit: NaN, margin: NaN };
  const price = (cost + fixedFee) / denom;
  const profit = price * (1 - commission) - fixedFee - cost;
  const margin = price > 0 ? profit / price : 0;
  return { price, profit, margin };
}

function saleFees(price, qty, channel) {
  const revenue = price * qty;
  const totalFees = qty * (price * Number(channel.commission) + Number(channel.fixed_fee));
  return { revenue, totalFees };
}

module.exports = { computeCost, tierPricing, channelPricing, saleFees };
