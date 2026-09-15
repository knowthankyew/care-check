/**
 * CareCheck Medical Bill Price Audit Engine
 * Cross-references billed charges with CMS Price Transparency benchmarks and Medicare baselines.
 * Identifies overcharges, markups, and unbundled codes.
 */

import type { ItemizedMedicalBill } from '../../contracts/bill.js';
import type {
  LineItemAuditVerdict,
  PriceAuditResult,
  PriceDiscrepancyType,
} from '../../contracts/audit.js';
import type { CharityCareAssessment } from '../../contracts/charity-care.js';
import benchmarksData from '../../../data/benchmarks/shoppable-codes.json' with { type: 'json' };

interface BenchmarkItem {
  code: string;
  category: string;
  description: string;
  nationalMedianCashPriceUSD: number;
  medicareBaselineRateUSD: number;
  commonUnbundlingRisk: boolean;
  unbundlingWarning?: string;
}

const BENCHMARKS_MAP = new Map<string, BenchmarkItem>();
for (const item of benchmarksData as BenchmarkItem[]) {
  BENCHMARKS_MAP.set(item.code, item);
}

export interface AuditOptions {
  customCashPricesByCode?: Record<string, number>; // Hospital-specific cash prices if known
  uninsuredAgBDiscountPercent?: number; // Hospital's AGB discount
  charityCareAssessment?: CharityCareAssessment; // Cross-reference statutory 501(r) assistance
}

/**
 * Audits an itemized medical bill against published cash prices, Medicare baselines,
 * and coding integrity benchmarks.
 */
export function auditMedicalBill(
  bill: ItemizedMedicalBill,
  options: AuditOptions = {}
): PriceAuditResult {
  const lineItemAudits: LineItemAuditVerdict[] = [];
  const aggregatedFlags = new Set<PriceDiscrepancyType>();
  let totalPotentialSavingsUSD = 0;
  let totalFairBaselineUSD = 0;

  for (const item of bill.lineItems) {
    const flags: PriceDiscrepancyType[] = [];
    const benchmark = BENCHMARKS_MAP.get(item.code);
    const customCash = options.customCashPricesByCode?.[item.code];
    const cashPrice = customCash ?? benchmark?.nationalMedianCashPriceUSD;
    const medicareRate = benchmark?.medicareBaselineRateUSD;

    let markupMultiplier: number | undefined;
    let linePotentialSavings = 0;
    const explanations: string[] = [];

    // 1. Cash Price Check
    if (cashPrice !== undefined && item.billedCharge > cashPrice) {
      flags.push('EXCEEDS_CASH_PRICE');
      const diff = item.billedCharge - cashPrice;
      linePotentialSavings = Math.max(linePotentialSavings, diff);
      explanations.push(
        `Billed charge ($${item.billedCharge.toFixed(2)}) exceeds published cash rate ($${cashPrice.toFixed(2)}) by $${diff.toFixed(2)}.`
      );
    }

    // 2. Medicare Markup Multiplier Check
    // Compare total billed charge to total Medicare allowable baseline (medicareRate * quantity)
    if (medicareRate !== undefined && medicareRate > 0) {
      markupMultiplier = Number((item.billedCharge / (medicareRate * (item.quantity || 1))).toFixed(1));

      if (markupMultiplier >= 8.0) {
        flags.push('PREDATORY_MARKUP');
        explanations.push(
          `Chargemaster markup is ${markupMultiplier}x the Medicare allowable baseline ($${medicareRate.toFixed(2)}), exceeding federal fair-pricing standards.`
        );
      } else if (markupMultiplier >= 4.0) {
        flags.push('EXCESSIVE_MARKUP');
        explanations.push(
          `Billed charge reflects an excessive chargemaster markup (${markupMultiplier}x Medicare baseline of $${medicareRate.toFixed(2)}).`
        );
      }
    }

    // 3. Unbundling Risk Check
    if (benchmark?.commonUnbundlingRisk) {
      flags.push('POTENTIAL_UNBUNDLED_CODE');
      explanations.push(
        benchmark.unbundlingWarning ||
          `Procedure code ${item.code} has known unbundling vulnerabilities under CMS NCCI rules.`
      );
    }

    // 4. Missing Itemization / Blank Code
    if (!item.code || item.code.trim() === '' || item.codeType === 'UNKNOWN') {
      flags.push('MISSING_ITEMIZATION');
      explanations.push(
        'Line item lacks standardized CPT/HCPCS coding required under federal billing rules.'
      );
    }

    // Determine fair settlement target for this line:
    // Prefer cash price; otherwise 125% of Medicare baseline; otherwise billed charge
    let lineFairTarget = item.billedCharge;
    if (cashPrice !== undefined) {
      lineFairTarget = cashPrice;
    } else if (medicareRate !== undefined) {
      lineFairTarget = Number((medicareRate * 1.25 * (item.quantity || 1)).toFixed(2));
    }
    totalFairBaselineUSD += lineFairTarget;

    // Track total potential savings
    totalPotentialSavingsUSD += linePotentialSavings;

    for (const f of flags) {
      aggregatedFlags.add(f);
    }

    lineItemAudits.push({
      lineItemId: item.id,
      code: item.code,
      description: item.description,
      billedCharge: item.billedCharge,
      hospitalCashPrice: cashPrice,
      medicareBaselineRate: medicareRate,
      markupMultiplier,
      flags,
      potentialSavingsUSD: Number(linePotentialSavings.toFixed(2)),
      explanation: explanations.length > 0 ? explanations.join(' ') : 'Pricing aligns with standard baselines.',
    });
  }

  let fairTarget = Math.min(bill.totalPatientResponsibility, totalFairBaselineUSD);
  if (options.charityCareAssessment) {
    fairTarget = Math.min(fairTarget, options.charityCareAssessment.adjustedPatientBalanceUSD);
  }
  const recommendedFairSettlementUSD = Number(fairTarget.toFixed(2));

  const hasHighSeverityDiscrepancy =
    aggregatedFlags.has('EXCEEDS_CASH_PRICE') ||
    aggregatedFlags.has('PREDATORY_MARKUP') ||
    aggregatedFlags.has('POTENTIAL_UNBUNDLED_CODE');

  return {
    billId: bill.id,
    hospitalId: bill.hospitalId,
    hospitalName: bill.hospitalName,
    totalBilledCharge: bill.totalBilledCharge,
    totalPatientResponsibility: bill.totalPatientResponsibility,
    totalPotentialSavingsUSD: Number(totalPotentialSavingsUSD.toFixed(2)),
    recommendedFairSettlementUSD,
    lineItemAudits,
    summaryFlags: Array.from(aggregatedFlags),
    hasHighSeverityDiscrepancy,
    auditTimestamp: new Date().toISOString(),
  };
}
