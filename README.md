# SmartSave – Saving Predictor & Financial Planner

SmartSave is a clean, minimalist personal finance planning application designed to forecast target milestones, compute saving timelines, and structure monthly surplus allocations. Built with a focus on simplicity, speed, and privacy, it runs entirely client-side without external server dependencies or tracking.

---

## Key Features

- **Timeline Forecast:** Calculates the exact months needed to achieve your target milestone based on your monthly disposable income and existing savings.
- **Dynamic Allocation Plan:** Evaluates emergency fund adequacy and saving capacity to propose a balanced division of monthly surplus across Liquid Savings, Gold, and Long-Term SIP investments.
- **Interactive Analytics:** Visualizes cash flow differentials (Income vs. Expenses), goal completion percentage, and 12-month forward savings projections using responsive Chart.js charts.
- **100% Client-Side Execution:** Zero backend or API calls. All calculations run instantly in vanilla JavaScript.
- **Zero Configuration:** No database, accounts, or setup required. Persists active scenario data locally using browser `localStorage`.
- **Minimalist Aesthetic:** High-contrast, clean monochrome interface optimized for desktop and mobile viewports.

---

## Mathematical Methodology

### 1. Monthly Surplus
$$\text{Monthly Saving} = \text{Monthly Income} - \text{Monthly Expenses}$$

### 2. Remaining Target Gap
$$\text{Remaining Target} = \max(0, \text{Target Savings} - \text{Current Savings})$$

### 3. Estimated Timeline
$$\text{Estimated Months} = \frac{\text{Remaining Target}}{\text{Monthly Saving}}$$

### 4. Financial Health Ratios
$$\text{Saving Rate (\%)} = \left(\frac{\text{Monthly Saving}}{\text{Monthly Income}}\right) \times 100$$
$$\text{Expense Ratio (\%)} = \left(\frac{\text{Monthly Expenses}}{\text{Monthly Income}}\right) \times 100$$

### 5. Dynamic Surplus Allocation Algorithm
When a goal timeline exceeds 4 months and a positive monthly surplus exists, SmartSave applies dynamic allocation scoring:

1. **Emergency Reserve Benchmark:**
   $$\text{Emergency Target} = \text{Monthly Expenses} \times 3$$
   $$\text{Emergency Gap} = \max(0, \text{Emergency Target} - \text{Current Savings})$$

2. **Scoring Model:**
   - **Base Weights:** Liquid Savings (40), Gold (20), SIP / Long-term (40).
   - **Emergency Reserve Weighting:** Increases Liquid Savings weight (+20 to +30) when an emergency gap exists.
   - **Surplus Capacity Weighting:** Expands SIP weight (+10 to +15) when the saving rate exceeds 30–40%.
   - **Timeline Adaptation:** For short-to-medium horizons (4–12 months), favors liquid stability over equity volatility; for extended timelines (>36 months), emphasizes long-term growth.
   - **Diversification Constraints:** Constrains gold allocation between 10% and 25% for balanced hedging.
   - **Precision Normalization:** Normalizes weighted outputs so percentages total 100% and discrete monthly rupee allocations reconcile exactly to total surplus.

---

## Project Structure

```
SmartSave/
│
├── index.html         # Saving Predictor interface & parameter inputs
├── analytics.html     # Financial analytics dashboard & Chart.js charts
├── style.css          # Minimalist responsive stylesheet
├── script.js          # Client-side calculations, persistence & charts
└── README.md          # Application documentation
```

---

## Technologies Used

- **HTML5:** Semantic, accessible markup.
- **CSS3:** Modern CSS Grid, Flexbox, and CSS custom properties.
- **Vanilla JavaScript:** Native DOM management, algorithmic scoring, and `localStorage` synchronization.
- **Chart.js:** Lightweight data visualizations (Bar, Doughnut, and Line charts).

---

## Local Execution

### Direct Browser Launch
Open `index.html` directly in any standard modern web browser (Chrome, Firefox, Safari, Edge).

### Local Static Server (Optional)
```bash
# Using Python 3:
python3 -m http.server 3000

# Or using Node:
npx serve .
```
Navigate to `http://localhost:3000`.
