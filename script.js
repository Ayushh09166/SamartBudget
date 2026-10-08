/**
 * SmartSave – Saving Predictor & Financial Planner
 * --------------------------------------------------
 * Client-Side Financial Forecasting & Allocation Model
 *
 * All mathematical calculations, financial health scoring, dynamic allocation planning,
 * input validations, localStorage synchronization, and Chart.js visualizations
 * execute directly in the browser with zero backend dependencies.
 */

// Indian Rupee Currency Formatter using Intl.NumberFormat
const inrCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  return inrCurrencyFormatter.format(Math.round(Number(amount)));
}

// ==========================================================================
// DYNAMIC ALLOCATION ALGORITHM
// ==========================================================================
function calculateSmartPlan(income, expenses, currentSavings, targetSavings, months, monthlySaving) {
  // If target duration is 4 months or less, or no positive savings, do not recommend investment plan
  if (!months || months <= 4 || monthlySaving <= 0) {
    return null;
  }

  // STEP 1 — EMERGENCY FUND
  const emergencyTarget = Math.round(expenses * 3);
  let emergencyGap = emergencyTarget - currentSavings;
  if (emergencyGap < 0) {
    emergencyGap = 0;
  }

  // STEP 2 — FINANCIAL HEALTH
  const savingRatio = (monthlySaving / income) * 100;
  const expenseRatio = (expenses / income) * 100;

  // STEP 3 — DYNAMIC MATHEMATICAL SCORING
  let savingsScore = 40;
  let goldScore = 20;
  let sipScore = 40;

  // Emergency Fund adjustments
  if (emergencyGap > 0) {
    savingsScore += 20;
    if (emergencyGap > monthlySaving * 2) {
      savingsScore += 10;
    }
  }

  // Saving Rate adjustments
  if (savingRatio >= 30) {
    sipScore += 10;
  }
  if (savingRatio >= 40) {
    sipScore += 5;
  }
  if (savingRatio < 15) {
    savingsScore += 15;
  }

  // Target Duration adjustments
  if (months > 4 && months <= 12) {
    savingsScore += 15;
    sipScore -= 10;
  } else if (months > 12 && months <= 36) {
    sipScore += 5;
  } else if (months > 36) {
    sipScore += 15;
  }

  // Gold score bounds: between 10 and 25
  goldScore = Math.max(10, Math.min(25, goldScore));
  sipScore = Math.max(10, sipScore);
  savingsScore = Math.max(20, savingsScore);

  // Normalize Scores to Percentages
  const totalScore = savingsScore + goldScore + sipScore;
  let savingsPercentage = Math.round((savingsScore / totalScore) * 100);
  let goldPercentage = Math.round((goldScore / totalScore) * 100);
  let sipPercentage = Math.round((sipScore / totalScore) * 100);

  // Ensure exact 100% total by adjusting savings percentage
  const pctDifference = 100 - (savingsPercentage + goldPercentage + sipPercentage);
  savingsPercentage += pctDifference;

  if (sipPercentage < 0) {
    savingsPercentage += sipPercentage;
    sipPercentage = 0;
  }

  // Calculate Real Monthly Rupee Amounts
  let savingsAmount = Math.round((monthlySaving * savingsPercentage) / 100);
  let goldAmount = Math.round((monthlySaving * goldPercentage) / 100);
  let sipAmount = Math.round((monthlySaving * sipPercentage) / 100);

  // Ensure sum equals monthlySaving exactly
  const amtDifference = monthlySaving - (savingsAmount + goldAmount + sipAmount);
  savingsAmount += amtDifference;

  // Professional Strategy Rationale
  const reasonClauses = [];
  if (emergencyGap > 0) {
    reasonClauses.push("Emergency reserve is below the suggested 3-month expense benchmark, so priority is given to liquid savings.");
  } else {
    reasonClauses.push("Emergency reserves meet the 3-month benchmark, allowing greater room for long-term growth allocation.");
  }

  if (savingRatio >= 30) {
    reasonClauses.push("A healthy saving rate provides expanded flexibility for long-term compounding.");
  } else if (savingRatio < 15) {
    reasonClauses.push("Current saving rate suggests focusing on building liquid stability first.");
  }

  const reason = reasonClauses.join(" ");

  let planName = "Balanced Allocation";
  if (emergencyGap > 0) {
    planName = "Capital Preservation";
  } else if (sipPercentage >= 45) {
    planName = "Growth Allocation";
  }

  return {
    savingsPercentage,
    goldPercentage,
    sipPercentage,
    savingsAmount,
    goldAmount,
    sipAmount,
    emergencyTarget,
    emergencyGap,
    currentSavings,
    reason,
    planName
  };
}

// ==========================================================================
// CORE SAVING PREDICTION LOGIC
// ==========================================================================
function calculatePrediction(income, expenses, currentSavings, targetSavings) {
  const monthlySaving = income - expenses;
  const remaining = targetSavings - currentSavings;
  const expenseRatio = Math.round(((expenses / income) * 100) * 10) / 10;
  const savingRate = Math.round(((monthlySaving / income) * 100) * 10) / 10;

  // Case 1: Expenses exceed Income
  if (expenses > income) {
    return {
      status: "deficit",
      income,
      expenses,
      currentSavings,
      targetSavings,
      monthlySaving,
      remaining: Math.max(0, remaining),
      months: null,
      savingRate: 0,
      expenseRatio,
      message: "Monthly expenses exceed total income.",
      suggestion: "Adjust discretionary expenditure before setting a long-term target."
    };
  }

  // Case 2: Zero Monthly Saving
  if (monthlySaving === 0) {
    return {
      status: "zero_saving",
      income,
      expenses,
      currentSavings,
      targetSavings,
      monthlySaving: 0,
      remaining: Math.max(0, remaining),
      months: null,
      savingRate: 0,
      expenseRatio,
      message: "Net monthly surplus is currently ₹0.",
      suggestion: "Establish a positive monthly surplus to calculate your goal timeline."
    };
  }

  // Case 3: Target already achieved
  if (remaining <= 0) {
    return {
      status: "target_reached",
      income,
      expenses,
      currentSavings,
      targetSavings,
      monthlySaving,
      remaining: 0,
      months: 0,
      savingRate,
      expenseRatio,
      message: "Target milestone already reached.",
      suggestion: "You have achieved this goal amount. You can set a new target or allocate surplus to investments."
    };
  }

  // Case 4: Standard positive prediction
  const rawMonths = remaining / monthlySaving;
  const months = Number.isInteger(rawMonths) ? rawMonths : Math.round(rawMonths * 10) / 10;

  // 12-Month Projected Trajectory
  const projection12Months = [];
  let accumulated = currentSavings;
  for (let m = 1; m <= 12; m++) {
    accumulated += monthlySaving;
    projection12Months.push({
      month: `Month ${m}`,
      projectedSavings: accumulated
    });
  }

  // Dynamic Allocation calculation
  const smartPlan = calculateSmartPlan(income, expenses, currentSavings, targetSavings, months, monthlySaving);

  return {
    status: "success",
    income,
    expenses,
    currentSavings,
    targetSavings,
    monthlySaving,
    remaining,
    months,
    monthsExact: Math.round(rawMonths * 100) / 100,
    savingRate,
    expenseRatio,
    progressPercentage: Math.min(100, Math.round(((currentSavings / targetSavings) * 100) * 10) / 10),
    projection12Months,
    smartPlan,
    investmentPlan: smartPlan
  };
}

// Default benchmark data for standard scenario
const DEFAULT_BENCHMARK = calculatePrediction(30000, 20000, 10000, 100000);

// ==========================================================================
// PAGE 1: SAVING PREDICTOR (index.html)
// ==========================================================================
function initPredictorPage() {
  const form = document.getElementById("predictorForm");
  if (!form) return;

  const incomeInput = document.getElementById("incomeInput");
  const expensesInput = document.getElementById("expensesInput");
  const currentSavingsInput = document.getElementById("currentSavingsInput");
  const targetSavingsInput = document.getElementById("targetSavingsInput");
  const alertBanner = document.getElementById("alertBanner");

  // Output elements
  const normalResultContainer = document.getElementById("normalResultContainer");
  const specialStateCard = document.getElementById("specialStateCard");
  const resultKicker = document.getElementById("resultKicker");
  const resultHeroNumber = document.getElementById("resultHeroNumber");
  const monthlySavingVal = document.getElementById("monthlySavingVal");
  const remainingVal = document.getElementById("remainingVal");
  const savingRateVal = document.getElementById("savingRateVal");
  const progressValues = document.getElementById("progressValues");
  const progressBarFill = document.getElementById("progressBarFill");

  // Monthly Allocation Plan elements
  const smartSavingPlanSection = document.getElementById("smartSavingPlanSection");
  const planNameTag = document.getElementById("planNameTag");
  const planMetricMonthlySaving = document.getElementById("planMetricMonthlySaving");
  const planMetricSavingRate = document.getElementById("planMetricSavingRate");
  const planMetricEmergency = document.getElementById("planMetricEmergency");
  const planMetricTimeline = document.getElementById("planMetricTimeline");
  const savingsPctVal = document.getElementById("savingsPctVal");
  const savingsAmtVal = document.getElementById("savingsAmtVal");
  const goldPctVal = document.getElementById("goldPctVal");
  const goldAmtVal = document.getElementById("goldAmtVal");
  const sipPctVal = document.getElementById("sipPctVal");
  const sipAmtVal = document.getElementById("sipAmtVal");
  const barSegmentSavings = document.getElementById("barSegmentSavings");
  const barSegmentGold = document.getElementById("barSegmentGold");
  const barSegmentSip = document.getElementById("barSegmentSip");
  const smartPlanMessage = document.getElementById("smartPlanMessage");

  function showAlert(msg) {
    if (!alertBanner) return;
    alertBanner.textContent = msg;
    alertBanner.style.display = "block";
    alertBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideAlert() {
    if (!alertBanner) return;
    alertBanner.textContent = "";
    alertBanner.style.display = "none";
  }

  // Display prediction result in the UI
  function renderPrediction(data) {
    if (!data) return;

    // Deficit state (Expenses > Income)
    if (data.status === "deficit") {
      if (smartSavingPlanSection) smartSavingPlanSection.style.display = "none";
      normalResultContainer.style.display = "none";
      specialStateCard.className = "special-state-card warning";
      specialStateCard.innerHTML = `
        <div class="special-state-title">⚠️ ${data.message || "Monthly expenses exceed total income."}</div>
        <p class="special-state-desc">${data.suggestion || "Adjust discretionary expenditure before setting a long-term target."}</p>
        <div style="margin-top: 1rem; font-size: 0.85rem; color: #666666;">
          Monthly Deficit: <strong>${formatCurrency(Math.abs(data.monthlySaving))}</strong>
        </div>
      `;
      specialStateCard.style.display = "block";
      resultKicker.textContent = "Status Check";
      resultHeroNumber.textContent = "DEFICIT";
      return;
    }

    // Zero Monthly Savings state
    if (data.status === "zero_saving") {
      if (smartSavingPlanSection) smartSavingPlanSection.style.display = "none";
      normalResultContainer.style.display = "none";
      specialStateCard.className = "special-state-card warning";
      specialStateCard.innerHTML = `
        <div class="special-state-title">⚠️ ${data.message || "Net monthly surplus is currently ₹0."}</div>
        <p class="special-state-desc">${data.suggestion || "Establish a positive monthly surplus to calculate your goal timeline."}</p>
      `;
      specialStateCard.style.display = "block";
      resultKicker.textContent = "Status Check";
      resultHeroNumber.textContent = "0 MONTHS";
      return;
    }

    // Target Reached state
    if (data.status === "target_reached") {
      if (smartSavingPlanSection) smartSavingPlanSection.style.display = "none";
      normalResultContainer.style.display = "none";
      specialStateCard.className = "special-state-card success";
      specialStateCard.innerHTML = `
        <div class="special-state-title">🎯 ${data.message || "Target milestone already reached."}</div>
        <p class="special-state-desc">${data.suggestion || "You have achieved this goal amount. You can set a new target or allocate surplus to investments."}</p>
        <div style="margin-top: 1rem; font-size: 0.85rem; color: #111111;">
          Current Savings: <strong>${formatCurrency(data.currentSavings)}</strong> (Target: ${formatCurrency(data.targetSavings)})
        </div>
      `;
      specialStateCard.style.display = "block";
      resultKicker.textContent = "Goal Achieved";
      resultHeroNumber.textContent = "REACHED";
      return;
    }

    // Standard Success Case
    specialStateCard.style.display = "none";
    normalResultContainer.style.display = "block";

    resultKicker.textContent = "Your target can be reached in";
    const monthText = data.months === 1 ? "1 MONTH" : `${data.months} MONTHS`;
    resultHeroNumber.textContent = monthText;

    monthlySavingVal.textContent = formatCurrency(data.monthlySaving);
    remainingVal.textContent = formatCurrency(data.remaining);
    savingRateVal.textContent = `${data.savingRate}%`;

    const currentFmt = formatCurrency(data.currentSavings);
    const targetFmt = formatCurrency(data.targetSavings);
    progressValues.textContent = `${currentFmt} / ${targetFmt}`;

    let progressPct = 0;
    if (data.targetSavings > 0) {
      progressPct = Math.min(100, Math.max(0, (data.currentSavings / data.targetSavings) * 100));
    }
    progressBarFill.style.width = `${progressPct}%`;

    // Monthly Allocation Plan (only if months > 4 and monthly saving > 0)
    const plan = data.smartPlan || data.investmentPlan;
    if (smartSavingPlanSection) {
      if (data.months && data.months > 4 && plan && data.monthlySaving > 0) {
        smartSavingPlanSection.style.display = "block";
        if (planNameTag) planNameTag.textContent = plan.planName;

        if (planMetricMonthlySaving) planMetricMonthlySaving.textContent = formatCurrency(data.monthlySaving);
        if (planMetricSavingRate) planMetricSavingRate.textContent = `${data.savingRate}%`;
        if (planMetricEmergency) {
          const emTarget = plan.emergencyTarget !== undefined ? plan.emergencyTarget : (data.expenses * 3);
          planMetricEmergency.textContent = `${formatCurrency(data.currentSavings)} / ${formatCurrency(emTarget)}`;
        }
        if (planMetricTimeline) planMetricTimeline.textContent = `${data.months} months`;

        if (savingsPctVal) savingsPctVal.textContent = `${plan.savingsPercentage}%`;
        if (savingsAmtVal) savingsAmtVal.textContent = `${formatCurrency(plan.savingsAmount)}/month`;
        if (goldPctVal) goldPctVal.textContent = `${plan.goldPercentage}%`;
        if (goldAmtVal) goldAmtVal.textContent = `${formatCurrency(plan.goldAmount)}/month`;
        if (sipPctVal) sipPctVal.textContent = `${plan.sipPercentage}%`;
        if (sipAmtVal) sipAmtVal.textContent = `${formatCurrency(plan.sipAmount)}/month`;

        if (barSegmentSavings) barSegmentSavings.style.width = `${plan.savingsPercentage}%`;
        if (barSegmentGold) barSegmentGold.style.width = `${plan.goldPercentage}%`;
        if (barSegmentSip) barSegmentSip.style.width = `${plan.sipPercentage}%`;

        if (smartPlanMessage) smartPlanMessage.textContent = plan.reason;
      } else {
        smartSavingPlanSection.style.display = "none";
      }
    }
  }

  // Form Submit Handler
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideAlert();

    const incomeVal = incomeInput.value.trim();
    const expensesVal = expensesInput.value.trim();
    const currentSavingsVal = currentSavingsInput.value.trim();
    const targetSavingsVal = targetSavingsInput.value.trim();

    // 1. Validation Checks
    if (!incomeVal || !expensesVal || !currentSavingsVal || !targetSavingsVal) {
      showAlert("Please fill in all 4 input fields.");
      return;
    }

    const income = parseFloat(incomeVal);
    const expenses = parseFloat(expensesVal);
    const currentSavings = parseFloat(currentSavingsVal);
    const targetSavings = parseFloat(targetSavingsVal);

    if (isNaN(income) || isNaN(expenses) || isNaN(currentSavings) || isNaN(targetSavings)) {
      showAlert("Please enter valid numeric values.");
      return;
    }

    if (income <= 0) {
      showAlert("Monthly Income must be greater than ₹0.");
      incomeInput.focus();
      return;
    }

    if (expenses < 0) {
      showAlert("Monthly Expenses cannot be negative.");
      expensesInput.focus();
      return;
    }

    if (currentSavings < 0) {
      showAlert("Current Savings cannot be negative.");
      currentSavingsInput.focus();
      return;
    }

    if (targetSavings <= 0) {
      showAlert("Target Savings must be greater than ₹0.");
      targetSavingsInput.focus();
      return;
    }

    // 2. Compute locally
    const predictionResult = calculatePrediction(income, expenses, currentSavings, targetSavings);

    // 3. Store in localStorage
    localStorage.setItem("smartsave_latest", JSON.stringify(predictionResult));

    // 4. Update the UI
    renderPrediction(predictionResult);
  });

  // Example Preset Buttons
  const presetStandard = document.getElementById("presetStandard");
  if (presetStandard) {
    presetStandard.addEventListener("click", () => {
      incomeInput.value = "30000";
      expensesInput.value = "20000";
      currentSavingsInput.value = "10000";
      targetSavingsInput.value = "100000";
      hideAlert();
      form.dispatchEvent(new Event("submit"));
    });
  }

  const presetStarter = document.getElementById("presetStarter") || document.getElementById("presetStudent");
  if (presetStarter) {
    presetStarter.addEventListener("click", () => {
      incomeInput.value = "15000";
      expensesInput.value = "9000";
      currentSavingsInput.value = "5000";
      targetSavingsInput.value = "50000";
      hideAlert();
      form.dispatchEvent(new Event("submit"));
    });
  }

  const presetClear = document.getElementById("presetClear");
  if (presetClear) {
    presetClear.addEventListener("click", () => {
      incomeInput.value = "";
      expensesInput.value = "";
      currentSavingsInput.value = "";
      targetSavingsInput.value = "";
      hideAlert();
      incomeInput.focus();
    });
  }

  // Initial Load: Restore last prediction or load standard benchmark
  const cachedDataStr = localStorage.getItem("smartsave_latest");
  if (cachedDataStr) {
    try {
      const cached = JSON.parse(cachedDataStr);
      if (cached && cached.income) {
        incomeInput.value = cached.income;
        expensesInput.value = cached.expenses;
        currentSavingsInput.value = cached.currentSavings;
        targetSavingsInput.value = cached.targetSavings;
        renderPrediction(cached);
        return;
      }
    } catch (e) {
      console.warn("Invalid cached data", e);
    }
  }

  // If no cache, populate with initial benchmark
  incomeInput.value = "30000";
  expensesInput.value = "20000";
  currentSavingsInput.value = "10000";
  targetSavingsInput.value = "100000";
  localStorage.setItem("smartsave_latest", JSON.stringify(DEFAULT_BENCHMARK));
  renderPrediction(DEFAULT_BENCHMARK);
}

// ==========================================================================
// PAGE 2: SAVING ANALYTICS (analytics.html)
// ==========================================================================
function initAnalyticsPage() {
  const analyticsContainer = document.getElementById("analyticsPage");
  if (!analyticsContainer) return;

  // Retrieve saved prediction from localStorage
  let data = DEFAULT_BENCHMARK;
  const stored = localStorage.getItem("smartsave_latest");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.income === "number") {
        data = parsed;
      }
    } catch (e) {
      console.warn("Error reading analytics data", e);
    }
  }

  const income = data.income || 30000;
  const expenses = data.expenses || 20000;
  const monthlySaving = data.monthlySaving !== undefined ? data.monthlySaving : (income - expenses);
  const currentSavings = data.currentSavings !== undefined ? data.currentSavings : 10000;
  const targetSavings = data.targetSavings || 100000;
  const savingRate = data.savingRate !== undefined ? data.savingRate : (income > 0 ? ((monthlySaving / income) * 100) : 0);
  const remaining = data.remaining !== undefined ? data.remaining : Math.max(0, targetSavings - currentSavings);
  const months = data.months !== undefined && data.months !== null ? data.months : (monthlySaving > 0 ? Math.ceil(remaining / monthlySaving) : "N/A");

  // 1. Populate 4 Summary Cards
  const statIncome = document.getElementById("statIncome");
  const statExpenses = document.getElementById("statExpenses");
  const statMonthlySaving = document.getElementById("statMonthlySaving");
  const statSavingRate = document.getElementById("statSavingRate");

  if (statIncome) statIncome.textContent = formatCurrency(income);
  if (statExpenses) statExpenses.textContent = formatCurrency(expenses);
  if (statMonthlySaving) statMonthlySaving.textContent = formatCurrency(monthlySaving);
  if (statSavingRate) statSavingRate.textContent = `${savingRate}%`;

  // 2. Populate Saving Summary list
  const sumCurrentSavings = document.getElementById("sumCurrentSavings");
  const sumIncome = document.getElementById("sumIncome");
  const sumExpenses = document.getElementById("sumExpenses");
  const sumMonthlySaving = document.getElementById("sumMonthlySaving");
  const sumTarget = document.getElementById("sumTarget");
  const sumMonths = document.getElementById("sumMonths");
  const sumSavingRate = document.getElementById("sumSavingRate");

  if (sumCurrentSavings) sumCurrentSavings.textContent = formatCurrency(currentSavings);
  if (sumIncome) sumIncome.textContent = formatCurrency(income);
  if (sumExpenses) sumExpenses.textContent = formatCurrency(expenses);
  if (sumMonthlySaving) sumMonthlySaving.textContent = formatCurrency(monthlySaving);
  if (sumTarget) sumTarget.textContent = formatCurrency(targetSavings);
  if (sumMonths) sumMonths.textContent = typeof months === "number" ? `${months} months` : months;
  if (sumSavingRate) sumSavingRate.textContent = `${savingRate}%`;

  // 3. Populate Suggested Monthly Allocation
  const analyticsAllocGrid = document.getElementById("analyticsAllocGrid");
  const analyticsAllocEmpty = document.getElementById("analyticsAllocEmpty");
  const analyticsAllocSavings = document.getElementById("analyticsAllocSavings");
  const analyticsAllocGold = document.getElementById("analyticsAllocGold");
  const analyticsAllocSip = document.getElementById("analyticsAllocSip");

  let plan = data.smartPlan || data.investmentPlan;
  if (!plan && typeof months === "number" && months > 4 && monthlySaving > 0) {
    plan = calculateSmartPlan(income, expenses, currentSavings, targetSavings, months, monthlySaving);
  }

  if (plan && typeof months === "number" && months > 4 && monthlySaving > 0) {
    if (analyticsAllocGrid) analyticsAllocGrid.style.display = "grid";
    if (analyticsAllocEmpty) analyticsAllocEmpty.style.display = "none";
    if (analyticsAllocSavings) analyticsAllocSavings.textContent = formatCurrency(plan.savingsAmount);
    if (analyticsAllocGold) analyticsAllocGold.textContent = formatCurrency(plan.goldAmount);
    if (analyticsAllocSip) analyticsAllocSip.textContent = formatCurrency(plan.sipAmount);
  } else {
    if (analyticsAllocGrid) analyticsAllocGrid.style.display = "none";
    if (analyticsAllocEmpty) analyticsAllocEmpty.style.display = "block";
  }

  // 4. Financial Health Note
  const habitTitle = document.getElementById("habitTitle");
  const habitMessage = document.getElementById("habitMessage");

  if (habitTitle && habitMessage) {
    if (savingRate >= 30) {
      habitTitle.textContent = "Healthy Saving Rate";
      habitMessage.textContent = "You are saving over 30% of your income. Maintaining this surplus helps build your emergency reserves and accelerates long-term targets.";
    } else if (savingRate >= 10) {
      habitTitle.textContent = "Moderate Saving Rate";
      habitMessage.textContent = "You are saving consistently. Reviewing non-essential monthly expenses can help boost your saving rate toward the 20–30% benchmark.";
    } else {
      habitTitle.textContent = "Low Saving Rate";
      habitMessage.textContent = "Your current saving cushion is under 10%. Prioritize auditing recurring expenses or seeking income supplements to strengthen your financial safety net.";
    }
  } else if (habitMessage) {
    if (savingRate >= 30) {
      habitMessage.textContent = "Healthy Saving Rate: You are saving over 30% of your income. Maintaining this surplus helps build emergency reserves and accelerates long-term goals.";
    } else if (savingRate >= 10) {
      habitMessage.textContent = "Moderate Saving Rate: You are saving consistently. Reviewing non-essential expenses can help boost your rate toward the 20–30% benchmark.";
    } else {
      habitMessage.textContent = "Low Saving Rate: Your current saving cushion is under 10%. Consider auditing recurring expenses to strengthen your safety net.";
    }
  }

  // 5. Render Charts using Chart.js
  if (typeof Chart === "undefined") {
    console.warn("Chart.js is not loaded.");
    return;
  }

  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  Chart.defaults.color = "#666666";

  // --- CHART 1: Income vs Expenses (Bar Chart) ---
  const ctxBar = document.getElementById("incomeExpenseChart");
  if (ctxBar) {
    new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: ["Total Income", "Total Expenses", "Monthly Saving"],
        datasets: [{
          data: [income, expenses, Math.max(0, monthlySaving)],
          backgroundColor: ["#111111", "#888888", "#555555"],
          borderRadius: 6,
          barPercentage: 0.55
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#111111",
            padding: 10,
            callbacks: {
              label: function (context) {
                return formatCurrency(context.raw);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#f0f0f0" },
            ticks: {
              callback: function (val) {
                return inrCurrencyFormatter.format(val);
              }
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // --- CHART 2: Goal Progress (Doughnut Chart) ---
  const ctxDonut = document.getElementById("savingProgressChart");
  if (ctxDonut) {
    new Chart(ctxDonut, {
      type: "doughnut",
      data: {
        labels: ["Current Savings", "Remaining Target"],
        datasets: [{
          data: [currentSavings, Math.max(0, remaining)],
          backgroundColor: ["#111111", "#e5e5e5"],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, padding: 16 }
          },
          tooltip: {
            backgroundColor: "#111111",
            padding: 10,
            callbacks: {
              label: function (context) {
                return `${context.label}: ${formatCurrency(context.raw)}`;
              }
            }
          }
        }
      }
    });
  }

  // --- CHART 3: 12-Month Projection (Line Chart) ---
  const ctxLine = document.getElementById("futureProjectionChart");
  if (ctxLine) {
    const projectionMonths = [];
    const projectionValues = [];
    const increment = Math.max(0, monthlySaving);

    for (let m = 1; m <= 12; m++) {
      const projected = currentSavings + (increment * m);
      projectionMonths.push(`Month ${m}`);
      projectionValues.push(projected);
    }

    new Chart(ctxLine, {
      type: "line",
      data: {
        labels: projectionMonths,
        datasets: [{
          label: "Projected Savings",
          data: projectionValues,
          borderColor: "#111111",
          backgroundColor: "rgba(17, 17, 17, 0.04)",
          borderWidth: 2.2,
          pointBackgroundColor: "#111111",
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#111111",
            padding: 10,
            callbacks: {
              label: function (context) {
                return `Projected: ${formatCurrency(context.raw)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: "#f0f0f0" },
            ticks: {
              callback: function (val) {
                return inrCurrencyFormatter.format(val);
              }
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
}

// Auto-run appropriate initializer when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initPredictorPage();
  initAnalyticsPage();
});
