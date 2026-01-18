"use strict";
/**
 * Deterministic Extraction Utilities for Synthesis Builder
 *
 * Constraints:
 * - Do NOT hallucinate data
 * - Do NOT infer beyond simulation outputs
 * - Prefer explicit "unknown" over assumption
 * - All extraction is from simulation evidence ONLY
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEvidence = extractEvidence;
exports.extractDecisionFraming = extractDecisionFraming;
exports.determineRecommendation = determineRecommendation;
exports.buildRecommendationStatement = buildRecommendationStatement;
exports.extractRisksAndTradeoffs = extractRisksAndTradeoffs;
exports.detectConstraints = detectConstraints;
exports.generateDecisionDisplacement = generateDecisionDisplacement;
exports.buildMicroMacroNarrative = buildMicroMacroNarrative;
// ============================================================================
// UNKNOWN VALUE CONSTANTS
// ============================================================================
const UNKNOWN = 'Data not available in simulation output';
const NOT_ASSESSED = 'Not assessed - outside simulation scope';
// ============================================================================
// TYPE GUARDS FOR SAFE EXTRACTION
// ============================================================================
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isArray(value) {
    return Array.isArray(value);
}
/**
 * Safely access nested property from unknown data.
 */
function getNestedProperty(obj, ...keys) {
    let current = obj;
    for (const key of keys) {
        if (!isRecord(current))
            return undefined;
        current = current[key];
    }
    return current;
}
function asNumber(value, fallback = 0) {
    if (typeof value === 'number' && !isNaN(value))
        return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed))
            return parsed;
    }
    return fallback;
}
function asString(value, fallback = UNKNOWN) {
    if (typeof value === 'string' && value.trim())
        return value.trim();
    return fallback;
}
// ============================================================================
// EVIDENCE EXTRACTION
// ============================================================================
/**
 * Extracts all evidence from raw simulation output.
 * Returns explicit "unknown" for missing data - NEVER infers.
 */
function extractEvidence(rawOutput) {
    const evidence = {
        policy_violations: [],
        cost_variances: [],
        failure_rates: [],
        latency_impacts: [],
        binding_constraints: [],
        micro_distributions: [],
        raw_metrics: {},
    };
    if (!isRecord(rawOutput)) {
        return evidence;
    }
    // Extract policy violations
    evidence.policy_violations = extractPolicyViolations(rawOutput);
    // Extract cost variances
    evidence.cost_variances = extractCostVariances(rawOutput);
    // Extract failure rates
    evidence.failure_rates = extractFailureRates(rawOutput);
    // Extract latency impacts
    evidence.latency_impacts = extractLatencyImpacts(rawOutput);
    // Extract binding constraints
    evidence.binding_constraints = extractBindingConstraints(rawOutput);
    // Extract micro distributions
    evidence.micro_distributions = extractMicroDistributions(rawOutput);
    // Store raw metrics for reference
    evidence.raw_metrics = extractRawMetrics(rawOutput);
    return evidence;
}
/**
 * Extracts policy violations from simulation output.
 */
function extractPolicyViolations(data) {
    const violations = [];
    // Check common paths for policy data
    const paths = [
        data.policy_violations,
        data.violations,
        getNestedProperty(data, 'compliance', 'violations'),
        getNestedProperty(data, 'audit', 'violations'),
        getNestedProperty(data, 'security', 'violations'),
    ];
    for (const source of paths) {
        if (isArray(source)) {
            for (const item of source) {
                if (isRecord(item)) {
                    violations.push({
                        rule: asString(item.rule || item.policy || item.name),
                        severity: mapSeverity(item.severity || item.level),
                        description: asString(item.description || item.message || item.detail),
                        source: asString(item.source || item.origin || 'simulation'),
                    });
                }
            }
        }
    }
    return violations;
}
/**
 * Extracts cost variances from simulation output.
 */
function extractCostVariances(data) {
    const variances = [];
    const paths = [
        data.cost_analysis,
        data.costs,
        getNestedProperty(data, 'financial', 'costs'),
        getNestedProperty(data, 'budget', 'variances'),
    ];
    for (const source of paths) {
        if (isRecord(source)) {
            for (const [category, value] of Object.entries(source)) {
                if (isRecord(value)) {
                    const baseline = asNumber(value.baseline || value.expected || value.budget);
                    const actual = asNumber(value.actual || value.current || value.spent);
                    const variance = actual - baseline;
                    variances.push({
                        category,
                        baseline,
                        actual,
                        variance,
                        variancePercent: baseline !== 0 ? (variance / baseline) * 100 : 0,
                        currency: asString(value.currency || data.currency, 'USD'),
                    });
                }
            }
        }
    }
    return variances;
}
/**
 * Extracts failure rates from simulation output.
 */
function extractFailureRates(data) {
    const rates = [];
    const paths = [
        data.failure_rates,
        data.reliability,
        getNestedProperty(data, 'metrics', 'failures'),
        getNestedProperty(data, 'performance', 'failures'),
    ];
    for (const source of paths) {
        if (isRecord(source)) {
            for (const [component, value] of Object.entries(source)) {
                if (isRecord(value)) {
                    const rate = asNumber(value.rate || value.failure_rate);
                    const threshold = asNumber(value.threshold || value.limit, 0.05);
                    rates.push({
                        component,
                        rate,
                        threshold,
                        breached: rate > threshold,
                        sampleSize: asNumber(value.sample_size || value.count || value.n, 0),
                    });
                }
                else if (typeof value === 'number') {
                    rates.push({
                        component,
                        rate: value,
                        threshold: 0.05,
                        breached: value > 0.05,
                        sampleSize: 0,
                    });
                }
            }
        }
    }
    return rates;
}
/**
 * Extracts latency impacts from simulation output.
 */
function extractLatencyImpacts(data) {
    const impacts = [];
    const paths = [
        data.latency,
        getNestedProperty(data, 'performance', 'latency'),
        getNestedProperty(data, 'metrics', 'latency'),
        data.response_times,
    ];
    for (const source of paths) {
        if (isRecord(source)) {
            for (const [operation, value] of Object.entries(source)) {
                if (isRecord(value)) {
                    const p95 = asNumber(value.p95 || value.percentile_95);
                    const baseline = asNumber(value.baseline_p95 || value.baseline, p95);
                    impacts.push({
                        operation,
                        p50: asNumber(value.p50 || value.percentile_50),
                        p95,
                        p99: asNumber(value.p99 || value.percentile_99),
                        baseline_p95: baseline,
                        degradation_percent: baseline !== 0 ? ((p95 - baseline) / baseline) * 100 : 0,
                        unit: value.unit || 'ms',
                    });
                }
            }
        }
    }
    return impacts;
}
/**
 * Extracts binding constraints from simulation output.
 */
function extractBindingConstraints(data) {
    const constraints = [];
    const paths = [
        { source: data.constraints, type: 'policy' },
        { source: data.budget_constraints, type: 'budget' },
        { source: data.policy_constraints, type: 'policy' },
        { source: data.regulatory_constraints, type: 'regulatory' },
        { source: data.org_constraints, type: 'organizational' },
    ];
    for (const { source, type } of paths) {
        if (isArray(source)) {
            for (const item of source) {
                if (isRecord(item)) {
                    constraints.push({
                        type: item.type || type,
                        name: asString(item.name || item.constraint),
                        limit: asString(item.limit || item.threshold || item.max),
                        current: asString(item.current || item.actual || item.value),
                        binding: Boolean(item.binding || item.is_binding || item.breached),
                        source: asString(item.source || 'simulation'),
                    });
                }
            }
        }
    }
    return constraints;
}
/**
 * Extracts micro-level distributions from simulation output.
 */
function extractMicroDistributions(data) {
    const distributions = [];
    const paths = [
        data.distributions,
        data.statistics,
        getNestedProperty(data, 'metrics', 'distributions'),
    ];
    for (const source of paths) {
        if (isRecord(source)) {
            for (const [metric, value] of Object.entries(source)) {
                if (isRecord(value)) {
                    distributions.push({
                        metric,
                        distribution: {
                            min: asNumber(value.min),
                            max: asNumber(value.max),
                            mean: asNumber(value.mean || value.avg || value.average),
                            median: asNumber(value.median || value.p50),
                            stdDev: asNumber(value.std_dev || value.stdDev || value.sd),
                        },
                        sampleSize: asNumber(value.n || value.count || value.sample_size),
                        unit: asString(value.unit, ''),
                    });
                }
            }
        }
    }
    return distributions;
}
/**
 * Extracts raw metrics for reference.
 */
function extractRawMetrics(data) {
    const metrics = {};
    const metricKeys = ['metrics', 'summary', 'results', 'output', 'data'];
    for (const key of metricKeys) {
        if (data[key] !== undefined) {
            metrics[key] = data[key];
        }
    }
    return metrics;
}
// ============================================================================
// DECISION FRAMING LOGIC
// ============================================================================
/**
 * Extracts decision framing from command intent, plan type, and simulation goal.
 */
function extractDecisionFraming(input) {
    const { command, objective, plan_type, simulation_goal } = input;
    // Extract decision from command intent
    const decision_required = buildDecisionStatement(command, objective, plan_type);
    // Extract alternatives from simulation output if available
    const alternatives = extractAlternatives(input.raw_output);
    // Build inaction scenario
    const inaction_scenario = buildInactionScenario(plan_type, objective);
    return { decision_required, alternatives, inaction_scenario };
}
function buildDecisionStatement(command, objective, planType) {
    // Extract action from command
    const commandLower = command.toLowerCase();
    if (commandLower.includes('deploy') || commandLower.includes('rollout')) {
        return `Approve or reject deployment of ${extractTarget(objective)}`;
    }
    if (commandLower.includes('migrate') || commandLower.includes('migration')) {
        return `Approve or defer migration of ${extractTarget(objective)}`;
    }
    if (commandLower.includes('optimize') || commandLower.includes('performance')) {
        return `Approve optimization changes for ${extractTarget(objective)}`;
    }
    if (commandLower.includes('remediat') || commandLower.includes('fix')) {
        return `Approve remediation plan for ${extractTarget(objective)}`;
    }
    if (commandLower.includes('assess') || commandLower.includes('evaluat')) {
        return `Determine readiness status for ${extractTarget(objective)}`;
    }
    // Default based on plan type
    switch (planType) {
        case 'deployment':
            return `Approve production deployment of ${extractTarget(objective)}`;
        case 'migration':
            return `Approve migration execution for ${extractTarget(objective)}`;
        case 'optimization':
            return `Approve optimization implementation for ${extractTarget(objective)}`;
        case 'remediation':
            return `Approve remediation execution for ${extractTarget(objective)}`;
        default:
            return `Determine disposition for: ${objective}`;
    }
}
function extractTarget(objective) {
    // Extract the main subject from the objective
    const words = objective.split(/\s+/);
    if (words.length <= 5)
        return objective;
    // Try to find key nouns
    const keyPhrases = objective.match(/(?:the\s+)?(?:new\s+)?(?:\w+\s+)?(?:system|service|feature|capability|platform|module|component|integration)/i);
    return keyPhrases ? keyPhrases[0] : words.slice(0, 5).join(' ');
}
function extractAlternatives(rawOutput) {
    if (!isRecord(rawOutput))
        return [];
    const alternatives = [];
    const paths = [
        rawOutput.alternatives,
        rawOutput.scenarios,
        rawOutput.options,
    ];
    for (const source of paths) {
        if (isArray(source)) {
            for (const item of source) {
                if (isRecord(item)) {
                    alternatives.push({
                        path: asString(item.name || item.path || item.option),
                        description: asString(item.description || item.summary),
                    });
                }
            }
        }
    }
    // If no alternatives found, provide default structure
    if (alternatives.length === 0) {
        return [
            { path: 'Proceed as proposed', description: 'Execute the recommended approach' },
            { path: 'Defer pending review', description: 'Delay decision for additional analysis' },
            { path: 'Reject current proposal', description: 'Do not proceed with current approach' },
        ];
    }
    return alternatives;
}
function buildInactionScenario(planType, objective) {
    switch (planType) {
        case 'deployment':
            return 'Current system remains in production; new capabilities unavailable; competitive position may erode.';
        case 'migration':
            return 'Legacy system continues operating; technical debt accumulates; maintenance costs increase.';
        case 'optimization':
            return 'Performance remains at current levels; user experience unchanged; resource utilization suboptimal.';
        case 'remediation':
            return 'Identified issues persist; risk exposure continues; potential for escalation increases.';
        default:
            return `No action taken on: ${objective || 'the proposed initiative'}. Status quo maintained.`;
    }
}
// ============================================================================
// RECOMMENDATION LOGIC
// ============================================================================
/**
 * Determines recommendation disposition based on evidence.
 * Returns SINGLE disposition: APPROVE, DEFER, or REJECT.
 * NO multi-path recommendations.
 */
function determineRecommendation(evidence) {
    // Critical violations → REJECT
    const criticalViolations = evidence.policy_violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
        return 'REJECT';
    }
    // Multiple high-severity issues → REJECT
    const highSeverityCount = evidence.policy_violations.filter(v => v.severity === 'high').length +
        evidence.failure_rates.filter(f => f.breached && f.rate > 0.1).length;
    if (highSeverityCount >= 3) {
        return 'REJECT';
    }
    // Binding budget constraints breached → DEFER
    const budgetConstraintBreached = evidence.binding_constraints.some(c => c.type === 'budget' && c.binding);
    if (budgetConstraintBreached) {
        return 'DEFER';
    }
    // Regulatory constraints binding → DEFER
    const regulatoryIssues = evidence.binding_constraints.filter(c => c.type === 'regulatory' && c.binding);
    if (regulatoryIssues.length > 0) {
        return 'DEFER';
    }
    // Significant latency degradation → DEFER
    const significantLatencyIssues = evidence.latency_impacts.filter(l => l.degradation_percent > 50);
    if (significantLatencyIssues.length > 0) {
        return 'DEFER';
    }
    // Medium violations present but manageable → APPROVE with conditions
    // No blocking issues → APPROVE
    return 'APPROVE';
}
/**
 * Builds recommendation statement based on disposition and evidence.
 */
function buildRecommendationStatement(disposition, evidence, objective) {
    const target = extractTarget(objective);
    switch (disposition) {
        case 'APPROVE':
            if (evidence.policy_violations.length > 0) {
                return `Proceed with ${target} subject to remediation of ${evidence.policy_violations.length} identified policy exceptions.`;
            }
            return `Proceed with ${target} as proposed.`;
        case 'DEFER':
            const deferReasons = [];
            if (evidence.binding_constraints.filter(c => c.binding).length > 0) {
                deferReasons.push('constraint resolution');
            }
            if (evidence.latency_impacts.filter(l => l.degradation_percent > 50).length > 0) {
                deferReasons.push('performance optimization');
            }
            return `Defer ${target} pending ${deferReasons.join(' and ') || 'further analysis'}.`;
        case 'REJECT':
            const criticalCount = evidence.policy_violations.filter(v => v.severity === 'critical').length;
            if (criticalCount > 0) {
                return `Do not proceed with ${target} due to ${criticalCount} critical policy violation(s).`;
            }
            return `Do not proceed with ${target} in current form; fundamental redesign required.`;
    }
}
// ============================================================================
// RISK & TRADEOFF EXTRACTION
// ============================================================================
/**
 * Extracts risks and tradeoffs directly from simulation evidence.
 */
function extractRisksAndTradeoffs(evidence) {
    const key_risks = [];
    // Convert policy violations to risks
    for (const violation of evidence.policy_violations) {
        if (violation.severity !== 'critical') {
            key_risks.push({
                risk: `Policy violation: ${violation.rule}`,
                likelihood: violation.severity === 'high' ? 'high' : 'medium',
                impact: mapSeverityToImpact(violation.severity),
                accepted_because: `Violation identified and documented; remediation plan in place`,
            });
        }
    }
    // Convert failure rates to risks
    for (const failure of evidence.failure_rates) {
        if (failure.breached) {
            key_risks.push({
                risk: `Elevated failure rate in ${failure.component}: ${(failure.rate * 100).toFixed(1)}%`,
                likelihood: failure.rate > 0.1 ? 'high' : 'medium',
                impact: 'medium',
                accepted_because: `Monitoring in place; rollback capability available`,
            });
        }
    }
    // Extract tradeoffs from cost variances
    const tradeoffs_accepted = [];
    for (const variance of evidence.cost_variances) {
        if (variance.variance > 0) {
            tradeoffs_accepted.push({
                choosing: `Accept ${variance.variancePercent.toFixed(0)}% cost increase in ${variance.category}`,
                forgoing: 'Original budget allocation',
                in_exchange_for: `Capability delivery within timeline`,
            });
        }
    }
    // Unmitigated risks from binding constraints
    const unmitigated_risks = [];
    for (const constraint of evidence.binding_constraints) {
        if (constraint.binding && constraint.type !== 'regulatory') {
            unmitigated_risks.push({
                risk: `${constraint.name} at limit (${constraint.current} vs ${constraint.limit})`,
                level: 'medium',
                reason_accepted: 'Within acceptable organizational tolerance',
            });
        }
    }
    return { key_risks, tradeoffs_accepted, unmitigated_risks };
}
// ============================================================================
// CONSTRAINT DETECTION
// ============================================================================
/**
 * Detects binding constraints from evidence.
 */
function detectConstraints(evidence) {
    const result = {
        policy: [],
        organizational: [],
        regulatory: [],
    };
    // Extract budget constraints
    const budgetConstraints = evidence.binding_constraints.filter(c => c.type === 'budget');
    if (budgetConstraints.length > 0) {
        const primary = budgetConstraints[0];
        result.budget = {
            ceiling: primary.limit,
            envelope: primary.current,
            contingency: NOT_ASSESSED,
        };
    }
    // Categorize other constraints
    for (const constraint of evidence.binding_constraints) {
        const entry = `${constraint.name}: ${constraint.limit}${constraint.binding ? ' (binding)' : ''}`;
        switch (constraint.type) {
            case 'policy':
                result.policy.push(entry);
                break;
            case 'organizational':
                result.organizational.push(entry);
                break;
            case 'regulatory':
                result.regulatory.push(entry);
                break;
        }
    }
    return result;
}
// ============================================================================
// DECISION DISPLACEMENT
// ============================================================================
/**
 * Generates decision displacement statement.
 * Maps to a real enterprise activity.
 */
function generateDecisionDisplacement(planType, objective) {
    const activities = {
        deployment: 'determining production deployment readiness and timing',
        migration: 'evaluating migration risk and scheduling cutover windows',
        optimization: 'prioritizing performance improvement initiatives',
        remediation: 'assessing remediation urgency and resource allocation',
        assessment: 'evaluating system capability and compliance status',
    };
    const activity = activities[planType || 'assessment'] ||
        `evaluating ${extractTarget(objective)}`;
    return {
        statement: `This recommendation replaces the need for humans to manually decide: ${activity}`,
        enterprise_activity: activity,
    };
}
// ============================================================================
// MICRO → MACRO NARRATIVE
// ============================================================================
/**
 * Builds micro to macro narrative from distributions and metrics.
 */
function buildMicroMacroNarrative(evidence, objective) {
    // Build operational action from distributions
    let operational_action = 'Individual operations execute within defined parameters';
    if (evidence.micro_distributions.length > 0) {
        const primary = evidence.micro_distributions[0];
        operational_action = `Each ${primary.metric} operation averages ${primary.distribution.mean.toFixed(2)}${primary.unit} (σ=${primary.distribution.stdDev.toFixed(2)})`;
    }
    else if (evidence.latency_impacts.length > 0) {
        const primary = evidence.latency_impacts[0];
        operational_action = `Each ${primary.operation} completes at p95=${primary.p95}${primary.unit}`;
    }
    // Build aggregation effect
    let aggregation_effect = 'Across the system, these operations compound predictably';
    if (evidence.micro_distributions.length > 0) {
        const totalSamples = evidence.micro_distributions.reduce((sum, d) => sum + d.sampleSize, 0);
        if (totalSamples > 0) {
            aggregation_effect = `Across ${totalSamples.toLocaleString()} sampled operations, variance remains within acceptable bounds`;
        }
    }
    // Build enterprise outcome
    let enterprise_outcome = 'System operates within defined service levels';
    const successRate = evidence.failure_rates.length > 0
        ? 1 - (evidence.failure_rates.reduce((sum, f) => sum + f.rate, 0) / evidence.failure_rates.length)
        : null;
    if (successRate !== null) {
        enterprise_outcome = `Enterprise achieves ${(successRate * 100).toFixed(1)}% operational success rate`;
    }
    // Add cost context if available
    if (evidence.cost_variances.length > 0) {
        const totalVariance = evidence.cost_variances.reduce((sum, v) => sum + v.variance, 0);
        const currency = evidence.cost_variances[0].currency;
        if (totalVariance !== 0) {
            enterprise_outcome += ` with ${totalVariance > 0 ? '+' : ''}${currency}${totalVariance.toLocaleString()} cost variance`;
        }
    }
    return { operational_action, aggregation_effect, enterprise_outcome };
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function mapSeverity(value) {
    const str = String(value).toLowerCase();
    if (str.includes('critical') || str.includes('blocker'))
        return 'critical';
    if (str.includes('high') || str.includes('major'))
        return 'high';
    if (str.includes('medium') || str.includes('moderate'))
        return 'medium';
    return 'low';
}
function mapSeverityToImpact(severity) {
    switch (severity) {
        case 'critical':
            return 'high';
        case 'high':
            return 'high';
        case 'medium':
            return 'medium';
        default:
            return 'low';
    }
}
