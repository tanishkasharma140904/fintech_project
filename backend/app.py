from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app, origins="*")

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"csv"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── In-Memory Session Storage ────────────────────────────────

session_store = {
    "all_transactions": [],
    "uploaded_files": [],
}

# ── Constants ────────────────────────────────────────────────

CATEGORY_KEYWORDS = {
    "Food & Dining": ["swiggy", "zomato", "restaurant", "cafe", "food", "eat", "dominos", "pizza", "mcdonalds", "kfc", "burger", "starbucks", "chaayos", "biryani", "dine", "bigbasket", "blinkit", "grofer", "grocery", "groceries", "mess", "canteen", "bakery", "dairy", "milk", "bread", "kitchen", "cook"],
    "Shopping": ["amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "mall", "market", "shop", "purchase", "buy", "h&m", "zara", "decathlon", "ikea", "croma", "reliance digital", "electronics"],
    "Transport": ["uber", "ola", "rapido", "metro", "petrol", "fuel", "diesel", "parking", "toll", "cab", "auto", "train", "railway", "irctc", "flight", "airline", "travel"],
    "Entertainment": ["netflix", "hotstar", "prime", "spotify", "youtube", "movie", "pvr", "inox", "gaming", "subscription", "disney", "zee5", "jiocinema"],
    "Bills & Utilities": ["electricity", "water", "gas", "internet", "broadband", "wifi", "mobile", "recharge", "dth", "phone", "jio", "airtel", "vi ", "vodafone", "postpaid", "prepaid", "bill", "cylinder", "piped"],
    "Healthcare": ["pharmacy", "hospital", "medical", "doctor", "clinic", "medicine", "health", "lab", "diagnostic", "apollo", "medplus", "1mg", "pharmeasy", "netmeds"],
    "Rent & Housing": ["rent", "housing", "maintenance", "society", "flat", "apartment", "pg ", "hostel", "landlord"],
    "Education": ["course", "udemy", "coursera", "college", "school", "tuition", "book", "library", "exam", "fee"],
    "Transfer": ["transfer", "neft", "imps", "upi", "rtgs", "sent to", "paid to"],
    "Income": ["salary", "refund", "cashback", "interest", "dividend", "received from", "credited", "credit"],
}

INCOME_CATEGORIES = {"Income"}

CATEGORY_COLORS = [
    "#00d4aa", "#4d9fff", "#f5a623", "#c084fc", "#10d078",
    "#ff4d6a", "#e879f9", "#38bdf8", "#facc15", "#fb923c",
]

DATE_COLUMNS = ["Date", "date", "Txn Date", "Transaction Date", "Value Date", "VALUE DATE", "DATE"]
AMOUNT_COLUMNS = ["Amount", "amount", "Txn Amount", "Transaction Amount", "AMOUNT", "Amount (INR)"]
DESCRIPTION_COLUMNS = ["Description", "Narration", "description", "narration", "Particulars", "PARTICULARS", "Details", "DESCRIPTION"]
CATEGORY_COLUMNS = ["Category", "category", "Type", "CATEGORY"]
DEBIT_COLUMNS = ["Debit", "Withdrawal Amt", "Withdrawal", "DEBIT"]
CREDIT_COLUMNS = ["Credit", "Deposit Amt", "Deposit", "CREDIT"]


# ── Helpers ──────────────────────────────────────────────────

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def detect_column(df_columns, candidates):
    for c in candidates:
        if c in df_columns:
            return c
    # Also try case-insensitive matching
    lower_map = {col.lower().strip(): col for col in df_columns}
    for c in candidates:
        if c.lower().strip() in lower_map:
            return lower_map[c.lower().strip()]
    return None


def clean_amount(val):
    if pd.isna(val):
        return 0.0
    if isinstance(val, (int, float, np.integer, np.floating)):
        return float(val)
    s = str(val).replace(",", "").replace("₹", "").replace("$", "").strip()
    # Handle parentheses as negative: (1234) -> -1234
    if s.startswith("(") and s.endswith(")"):
        s = "-" + s[1:-1]
    try:
        return float(s) if s else 0.0
    except ValueError:
        return 0.0


def categorize(description):
    desc = str(description).lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in desc for kw in keywords):
            return category
    return "Other"


def is_income_category(category):
    return category in INCOME_CATEGORIES


def read_csv_flexible(file_path):
    for encoding in ("utf-8", "latin-1", "cp1252"):
        try:
            return pd.read_csv(file_path, encoding=encoding)
        except (UnicodeDecodeError, pd.errors.ParserError):
            continue
    raise ValueError("Unable to read CSV with any supported encoding")


def format_month_label(period):
    """Convert a pandas Period to a short label like 'Jan 24' or 'Feb 26'."""
    try:
        dt = period.to_timestamp()
        return dt.strftime("%b %y")
    except Exception:
        return str(period)


def parse_transactions(df):
    cols = list(df.columns)

    date_col = detect_column(cols, DATE_COLUMNS)
    amount_col = detect_column(cols, AMOUNT_COLUMNS)
    desc_col = detect_column(cols, DESCRIPTION_COLUMNS)
    cat_col = detect_column(cols, CATEGORY_COLUMNS)
    debit_col = detect_column(cols, DEBIT_COLUMNS)
    credit_col = detect_column(cols, CREDIT_COLUMNS)

    # Parse dates
    if date_col:
        raw_dates = df[date_col].astype(str)
        parsed = pd.to_datetime(raw_dates, format="%Y-%m-%d", errors="coerce")
        mask = parsed.isna()
        if mask.any():
            parsed[mask] = pd.to_datetime(raw_dates[mask], dayfirst=True, format="mixed", errors="coerce")
        df["_date"] = parsed
    else:
        df["_date"] = pd.NaT

    # Parse amounts
    has_separate_columns = debit_col is not None and credit_col is not None
    if has_separate_columns:
        df["_debit"] = df[debit_col].apply(clean_amount)
        df["_credit"] = df[credit_col].apply(clean_amount)
        df["_amount"] = df["_credit"] - df["_debit"]
    elif amount_col:
        df["_amount"] = df[amount_col].apply(clean_amount)
    else:
        df["_amount"] = 0.0

    # Parse descriptions
    df["_description"] = df[desc_col].astype(str).str.strip() if desc_col else "Unknown"

    # Parse/detect categories
    if cat_col:
        df["_category"] = df[cat_col].astype(str).str.strip()
        mask = df["_category"].isin(["", "nan", "None", "NaN"])
        df.loc[mask, "_category"] = df.loc[mask, "_description"].apply(categorize)
    else:
        df["_category"] = df["_description"].apply(categorize)

    # ── CRITICAL: Smart sign detection ──
    # If we DON'T have separate debit/credit columns, we need to figure out
    # which transactions are expenses vs income based on category.
    # Many bank CSVs have all amounts as positive numbers.
    if not has_separate_columns:
        # Check if amounts are already mixed (has both positive and negative)
        has_negative = (df["_amount"] < 0).any()
        has_positive = (df["_amount"] > 0).any()

        if has_negative and has_positive:
            # Amounts already have proper signs — just refine income detection
            income_keywords = CATEGORY_KEYWORDS.get("Income", [])
            for idx, row in df.iterrows():
                if row["_amount"] > 0:
                    desc_lower = str(row["_description"]).lower()
                    if any(kw in desc_lower for kw in income_keywords) or row["_amount"] > 50000:
                        df.at[idx, "_category"] = "Income"
        else:
            # ALL amounts are same sign (likely all positive) — use category to determine sign
            income_keywords = CATEGORY_KEYWORDS.get("Income", [])
            for idx, row in df.iterrows():
                cat = row["_category"]
                desc_lower = str(row["_description"]).lower()
                amt = row["_amount"]

                # Determine if this is income
                is_income = (
                    is_income_category(cat) or
                    any(kw in desc_lower for kw in income_keywords) or
                    "salary" in desc_lower or
                    "credited" in desc_lower
                )

                if is_income:
                    df.at[idx, "_category"] = "Income"
                    df.at[idx, "_amount"] = abs(amt)  # Income is positive
                else:
                    df.at[idx, "_amount"] = -abs(amt)  # Expenses are negative
    else:
        # With separate debit/credit columns, the sign is already correct
        # Just detect income categories
        income_keywords = CATEGORY_KEYWORDS.get("Income", [])
        for idx, row in df.iterrows():
            if row["_amount"] > 0:
                desc_lower = str(row["_description"]).lower()
                if any(kw in desc_lower for kw in income_keywords) or row["_amount"] > 50000:
                    df.at[idx, "_category"] = "Income"

    # Set type based on final amount sign
    df["_type"] = df["_amount"].apply(lambda x: "credit" if x > 0 else "debit")

    transactions = []
    for _, row in df.iterrows():
        date_val = row["_date"]
        transactions.append({
            "date": date_val.strftime("%Y-%m-%d") if pd.notna(date_val) else None,
            "description": row["_description"],
            "category": row["_category"],
            "amount": round(row["_amount"], 2),
            "type": row["_type"],
        })

    return transactions


def compute_analytics(transactions):
    if not transactions:
        return _empty_analytics()

    df = pd.DataFrame(transactions)
    df["amount"] = df["amount"].astype(float)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["month"] = df["date"].dt.to_period("M")

    spending = df[df["amount"] < 0]["amount"].sum()
    total_spending = abs(spending)
    total_income = df[df["amount"] > 0]["amount"].sum()
    net_savings = total_income - total_spending
    savings_rate = round((net_savings / total_income) * 100, 2) if total_income > 0 else 0.0

    unique_months = df["month"].dropna().nunique()
    avg_monthly_spending = round(total_spending / max(unique_months, 1), 2)

    # Monthly spending series for trend analysis
    monthly_groups = df.dropna(subset=["date"]).groupby("month")
    monthly_spending_series = monthly_groups.apply(
        lambda g: abs(g[g["amount"] < 0]["amount"].sum())
    ).sort_index()

    if len(monthly_spending_series) >= 2:
        first, last = monthly_spending_series.iloc[0], monthly_spending_series.iloc[-1]
        expense_growth_pct = round(((last - first) / first) * 100, 2) if first > 0 else 0.0
    else:
        expense_growth_pct = 0.0

    summary = {
        "total_spending": round(total_spending, 2),
        "total_income": round(total_income, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate": savings_rate,
        "avg_monthly_spending": avg_monthly_spending,
        "expense_growth_pct": expense_growth_pct,
        "transaction_count": len(transactions),
    }

    # ── Category breakdown (expenses only, exclude Income) ──
    expenses_df = df[(df["amount"] < 0) & (df["category"] != "Income")].copy()
    expenses_df["abs_amount"] = expenses_df["amount"].abs()
    cat_totals = expenses_df.groupby("category")["abs_amount"].sum().sort_values(ascending=False)
    by_category = []
    for i, (cat, val) in enumerate(cat_totals.items()):
        by_category.append({
            "name": cat,
            "value": round(val, 2),
            "color": CATEGORY_COLORS[i % len(CATEGORY_COLORS)],
        })

    # ── Monthly breakdown with readable labels ──
    by_month = []
    monthly_trend = []
    prev_spending = None

    for period in sorted(df["month"].dropna().unique()):
        month_df = df[df["month"] == period]
        m_spending = round(abs(month_df[month_df["amount"] < 0]["amount"].sum()), 2)
        m_income = round(month_df[month_df["amount"] > 0]["amount"].sum(), 2)
        label = format_month_label(period)

        by_month.append({"month": label, "spending": m_spending, "income": m_income})

        change_pct = 0.0
        if prev_spending is not None and prev_spending > 0:
            change_pct = round(((m_spending - prev_spending) / prev_spending) * 100, 2)
        monthly_trend.append({"month": label, "change_pct": change_pct})
        prev_spending = m_spending

    # ── Top category ──
    if by_category:
        top = by_category[0]
        top_category = {
            "name": top["name"],
            "amount": top["value"],
            "percentage": round((top["value"] / total_spending) * 100, 2) if total_spending > 0 else 0,
        }
    else:
        top_category = {"name": "N/A", "amount": 0, "percentage": 0}

    dashboard_cards = _compute_dashboard_cards(summary, by_month, monthly_spending_series)
    insights = generate_insights(df, summary, by_category, by_month)

    return {
        "transactions": transactions,
        "summary": summary,
        "by_category": by_category,
        "by_month": by_month,
        "monthly_trend": monthly_trend,
        "top_category": top_category,
        "dashboard_cards": dashboard_cards,
        "insights": insights,
    }


def _compute_dashboard_cards(summary, by_month, monthly_spending):
    balance = round(summary["total_income"] - summary["total_spending"], 2)

    # Portfolio change: compare last two months' net
    portfolio_change = 0.0
    if len(by_month) >= 2:
        prev_net = by_month[-2]["income"] - by_month[-2]["spending"]
        curr_net = by_month[-1]["income"] - by_month[-1]["spending"]
        if prev_net != 0:
            portfolio_change = round(((curr_net - prev_net) / abs(prev_net)) * 100, 2)

    # Monthly savings: latest month income - spending
    monthly_savings = 0.0
    monthly_savings_change = 0.0
    if by_month:
        latest = by_month[-1]
        monthly_savings = round(latest["income"] - latest["spending"], 2)
        if len(by_month) >= 2:
            prev = by_month[-2]
            prev_sav = prev["income"] - prev["spending"]
            if prev_sav != 0:
                monthly_savings_change = round(((monthly_savings - prev_sav) / abs(prev_sav)) * 100, 2)

    # Risk score: based on spending volatility + savings rate
    if len(monthly_spending) >= 2 and monthly_spending.mean() > 0:
        volatility = float(monthly_spending.std() / monthly_spending.mean() * 100)
    else:
        volatility = 30  # Default moderate
    risk_raw = min(100, max(0, volatility + max(0, 50 - summary["savings_rate"])))
    risk_score = round(risk_raw, 1)

    # Financial health: composite score
    sr = summary["savings_rate"]
    health_score = round(min(100, max(0,
        (min(sr, 50) / 50 * 100 * 0.4) +
        (max(0, 100 - volatility) * 0.3) +
        (min(sr, 30) / 30 * 100 * 0.3)
    )), 1)

    return {
        "portfolio": {"value": balance, "change_pct": portfolio_change},
        "monthly_pnl": {"value": monthly_savings, "change_pct": monthly_savings_change},
        "risk_score": {"value": risk_score},
        "financial_health": {"value": health_score},
    }


def generate_insights(df, summary, by_category, by_month):
    insights = []
    insight_id = 1

    # 1. Top spending category
    if by_category:
        top = by_category[0]
        pct = round(top["value"] / summary["total_spending"] * 100, 1) if summary["total_spending"] > 0 else 0
        insights.append({
            "id": f"top-spending-{insight_id}",
            "icon": "🔥",
            "title": f"Top spending: {top['name']}",
            "detail": f"You spent ₹{top['value']:,.0f} on {top['name']}, making up {pct}% of total expenses.",
            "type": "alert",
        })
        insight_id += 1

    # 2. Weekend vs weekday spending
    expenses_df = df[df["amount"] < 0].copy()
    if df["date"].notna().any() and not expenses_df.empty:
        expenses_with_dates = expenses_df[expenses_df["date"].notna()].copy()
        if not expenses_with_dates.empty:
            expenses_with_dates["dow"] = expenses_with_dates["date"].dt.dayofweek
            weekend = expenses_with_dates[expenses_with_dates["dow"] >= 5]
            weekday = expenses_with_dates[expenses_with_dates["dow"] < 5]
            n_weeks = max(expenses_with_dates["date"].dt.isocalendar().week.nunique(), 1)
            wknd_avg = abs(weekend["amount"].sum()) / n_weeks
            wkdy_avg = abs(weekday["amount"].sum()) / n_weeks
            if wknd_avg > wkdy_avg * 1.5:
                insights.append({
                    "id": f"weekend-{insight_id}",
                    "icon": "🛍️",
                    "title": "Weekend overspending detected",
                    "detail": f"Weekend avg ₹{wknd_avg:,.0f}/week vs weekday ₹{wkdy_avg:,.0f}/week — {wknd_avg/max(wkdy_avg,1):.1f}× higher!",
                    "type": "warning",
                })
            elif wknd_avg > wkdy_avg * 1.2:
                insights.append({
                    "id": f"weekend-{insight_id}",
                    "icon": "📅",
                    "title": "Weekend spending is higher",
                    "detail": f"Weekend avg ₹{wknd_avg:,.0f}/week vs weekday ₹{wkdy_avg:,.0f}/week. Consider a weekend budget.",
                    "type": "warning",
                })
            else:
                insights.append({
                    "id": f"weekend-{insight_id}",
                    "icon": "✅",
                    "title": "Balanced spending pattern",
                    "detail": f"Weekend avg ₹{wknd_avg:,.0f}/week and weekday ₹{wkdy_avg:,.0f}/week — well balanced!",
                    "type": "info",
                })
            insight_id += 1

    # 3. Largest single expense
    if not expenses_df.empty:
        largest = expenses_df.loc[expenses_df["amount"].idxmin()]
        insights.append({
            "id": f"largest-{insight_id}",
            "icon": "⚠️",
            "title": "Largest single expense",
            "detail": f"₹{abs(largest['amount']):,.0f} on \"{largest['description']}\" ({largest['category']}). Verify this wasn't unexpected.",
            "type": "warning",
        })
        insight_id += 1

    # 4. Monthly spending trend
    if len(by_month) >= 2:
        last = by_month[-1]["spending"]
        prev = by_month[-2]["spending"]
        if prev > 0:
            change = round(((last - prev) / prev) * 100, 1)
            if change > 0:
                insights.append({
                    "id": f"trend-{insight_id}",
                    "icon": "📈",
                    "title": f"Spending up {abs(change)}%",
                    "detail": f"Spending increased from ₹{prev:,.0f} ({by_month[-2]['month']}) to ₹{last:,.0f} ({by_month[-1]['month']}).",
                    "type": "warning" if change > 15 else "info",
                })
            else:
                insights.append({
                    "id": f"trend-{insight_id}",
                    "icon": "📉",
                    "title": f"Spending down {abs(change)}%",
                    "detail": f"Spending decreased from ₹{prev:,.0f} ({by_month[-2]['month']}) to ₹{last:,.0f} ({by_month[-1]['month']}). Good progress!",
                    "type": "info",
                })
            insight_id += 1

    # 5. Savings rate evaluation
    sr = summary["savings_rate"]
    if sr >= 30:
        insights.append({"id": f"savings-{insight_id}", "icon": "🏆", "title": "Excellent savings rate", "detail": f"You're saving {sr}% of income — top-tier financial discipline!", "type": "info"})
    elif sr >= 10:
        insights.append({"id": f"savings-{insight_id}", "icon": "💡", "title": "Room to save more", "detail": f"Savings rate is {sr}%. Try to push towards 20-30% for better financial security.", "type": "info"})
    elif sr >= 0:
        insights.append({"id": f"savings-{insight_id}", "icon": "🚨", "title": "Low savings rate", "detail": f"Savings rate is only {sr}%. Review discretionary spending urgently.", "type": "alert"})
    else:
        insights.append({"id": f"savings-{insight_id}", "icon": "🚨", "title": "Spending exceeds income", "detail": f"You're spending more than you earn. Net savings is ₹{summary['net_savings']:,.0f}.", "type": "alert"})
    insight_id += 1

    # 6. Category spending spikes (>30% of total)
    if summary["total_spending"] > 0:
        for cat in by_category:
            pct = cat["value"] / summary["total_spending"] * 100
            if pct > 30:
                insights.append({
                    "id": f"spike-{cat['name']}-{insight_id}",
                    "icon": "📊",
                    "title": f"{cat['name']} dominates spending",
                    "detail": f"{cat['name']} accounts for {round(pct, 1)}% of total spending — significantly above average. Consider reducing.",
                    "type": "alert",
                })
                insight_id += 1

    # 7. Food delivery detection
    if not expenses_df.empty:
        food_keywords = ["swiggy", "zomato", "dominos", "pizza", "blinkit", "bigbasket"]
        food_delivery = expenses_df[expenses_df["description"].str.lower().str.contains("|".join(food_keywords), na=False)]
        if len(food_delivery) >= 3:
            food_total = abs(food_delivery["amount"].sum())
            insights.append({
                "id": f"food-delivery-{insight_id}",
                "icon": "🍕",
                "title": "Frequent food orders detected",
                "detail": f"{len(food_delivery)} food delivery orders totaling ₹{food_total:,.0f}. Home cooking could save significantly.",
                "type": "warning" if food_total > 3000 else "info",
            })
            insight_id += 1

    # Limit to 6 insights max
    return insights[:6]


def _empty_analytics():
    return {
        "transactions": [],
        "summary": {
            "total_spending": 0, "total_income": 0, "net_savings": 0,
            "savings_rate": 0, "avg_monthly_spending": 0,
            "expense_growth_pct": 0, "transaction_count": 0,
        },
        "by_category": [],
        "by_month": [],
        "monthly_trend": [],
        "top_category": {"name": "N/A", "amount": 0, "percentage": 0},
        "dashboard_cards": {
            "portfolio": {"value": 0, "change_pct": 0},
            "monthly_pnl": {"value": 0, "change_pct": 0},
            "risk_score": {"value": 50},
            "financial_health": {"value": 50},
        },
        "insights": [],
    }


# ── Routes ───────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "NovaTrade Flask backend is running 🚀",
    })


@app.route("/upload-expense", methods=["POST"])
def upload_expense():
    return _handle_upload(merge=False)


@app.route("/upload-merge", methods=["POST"])
def upload_merge():
    return _handle_upload(merge=True)


def _handle_upload(merge=False):
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file was sent. Make sure the field name is 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": f"File type not allowed. Please upload a .csv file. Got: {file.filename}"}), 400

    filename = file.filename
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(save_path)

    try:
        df = read_csv_flexible(save_path)
        new_transactions = parse_transactions(df)
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to parse CSV: {str(e)}"}), 400

    if merge:
        session_store["all_transactions"].extend(new_transactions)
    else:
        session_store["all_transactions"] = new_transactions

    if filename not in session_store["uploaded_files"]:
        session_store["uploaded_files"].append(filename)

    analytics = compute_analytics(session_store["all_transactions"])

    return jsonify({
        "status": "success",
        "message": f"Analyzed {len(session_store['all_transactions'])} transactions",
        "filename": filename,
        "analytics": analytics,
    })


@app.route("/analytics", methods=["GET"])
def get_analytics():
    if not session_store["all_transactions"]:
        return jsonify({"status": "error", "message": "No data uploaded yet. Upload a CSV first."}), 400

    analytics = compute_analytics(session_store["all_transactions"])
    return jsonify({
        "status": "success",
        "message": f"Analytics for {len(session_store['all_transactions'])} transactions",
        "uploaded_files": session_store["uploaded_files"],
        "analytics": analytics,
    })


# ── Error Handlers ───────────────────────────────────────────

@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": "error", "message": "Route not found. Check your URL."}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"status": "error", "message": "Wrong HTTP method. Check GET vs POST."}), 405


# ── Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    print("🚀 Starting NovaTrade Flask backend...")
    print("📁 Upload folder:", UPLOAD_FOLDER)
    print("🌐 Running at: http://localhost:5001\n")

    app.run(host="0.0.0.0", port=5001, debug=True)
