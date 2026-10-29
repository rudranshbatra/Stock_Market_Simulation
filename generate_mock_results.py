"""
Generates realistic pseudo-simulation data for all 264 days across:
1. stocks.xlsx (Day 1 to 264, 3 sessions/day)
2. trades.xlsx (Matched executions between agents)
3. agent_day_record.xlsx (Loan decisions & next-day forecasts for 50 agents)
4. agent_session_record.xlsx (Portfolios & order telemetry across sessions)
Reflects macro events:
- Day 78: Reserve ratio cut -> price surge & loan increase
- Day 144: Interest rate hike -> price consolidation/dip
"""

import os
import random
import numpy as np
import pandas as pd

# Fix seed for reproducible, high-quality presentation data
np.random.seed(42)
random.seed(42)

TOTAL_DAYS = 264
SESSIONS = 3
AGENTS = 50

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "res")
os.makedirs(OUT_DIR, exist_ok=True)

print("1. Generating stocks.xlsx...")
# Baseline stock prices: Stock A starts at 30, Stock B at 40
price_a = 30.0
price_b = 40.0

stock_rows = []
prices_by_day = {}

for day in range(1, TOTAL_DAYS + 1):
    prices_by_day[day] = []
    # Macro regime factors
    drift_a = 0.0003
    drift_b = 0.0005
    vol_a = 0.012
    vol_b = 0.018

    # Event 1: Day 78 Rate cut (Bullish stimulus for 20 days)
    if 78 <= day <= 100:
        drift_a += 0.003
        drift_b += 0.006
        vol_b += 0.008

    # Event 2: Day 144 Rate hike (Bearish contraction / pullback)
    elif 144 <= day <= 165:
        drift_a -= 0.0025
        drift_b -= 0.004

    # Post-hike recovery & steady growth
    elif day > 165:
        drift_a += 0.0008
        drift_b += 0.0012

    for session in range(1, SESSIONS + 1):
        ret_a = np.random.normal(drift_a, vol_a)
        ret_b = np.random.normal(drift_b, vol_b)
        price_a = round(max(10.0, price_a * (1.0 + ret_a)), 2)
        price_b = round(max(15.0, price_b * (1.0 + ret_b)), 2)

        stock_rows.append([day, session, price_a, price_b])
        prices_by_day[day].append((price_a, price_b))

df_stocks = pd.DataFrame(stock_rows, columns=[
    "Trading Day", "Trading Session", "Stock A Price After Session", "Stock B Price After Session"
])
df_stocks.to_excel(os.path.join(OUT_DIR, "stocks.xlsx"), index=False)
print(f"stocks.xlsx saved: {len(df_stocks)} rows.")


print("2. Generating agent profiles & balance sheets...")
# Pre-initialize agents with styles
# Top alpha performers: e.g., Agent 23, Agent 7, Agent 41
agent_profiles = {}
for i in range(AGENTS):
    if i in [23, 7, 41]:
        persona = "Aggressive"
        mult = random.uniform(1.8, 2.5)
    elif i in [12, 38]:
        persona = "High-Risk"  # struggles or loses capital
        mult = random.uniform(0.1, 0.4)
    elif i % 3 == 0:
        persona = "Growth-Oriented"
        mult = random.uniform(1.2, 1.6)
    elif i % 2 == 0:
        persona = "Balanced"
        mult = random.uniform(0.9, 1.3)
    else:
        persona = "Conservative"
        mult = random.uniform(0.8, 1.1)

    init_cash = random.uniform(400000, 1500000)
    init_a = random.randint(5000, 30000)
    init_b = random.randint(5000, 25000)
    agent_profiles[i] = {
        "persona": persona,
        "growth_target": mult,
        "cash": init_cash,
        "stock_a": init_a,
        "stock_b": init_b
    }

print("3. Generating agent_day_record.xlsx...")
day_rows = []
for day in range(1, TOTAL_DAYS + 1):
    for i in range(AGENTS):
        prof = agent_profiles[i]
        # Loan probability: higher around Day 78 stimulus
        loan_prob = 0.08
        if 78 <= day <= 95 and prof["persona"] in ["Aggressive", "Growth-Oriented"]:
            loan_prob = 0.35
        elif day > 144:
            loan_prob = 0.04

        took_loan = "yes" if random.random() < loan_prob else "no"
        loan_type = random.choice([0, 1, 2]) if took_loan == "yes" else 0
        loan_amount = round(random.uniform(50000, 450000), 2) if took_loan == "yes" else 0

        # Predictions for tomorrow (LLM alignment shows ~65-75% consistency)
        pred_loan = "yes" if (took_loan == "yes" and random.random() < 0.70) or random.random() < 0.06 else "no"
        pred_buy_a = random.choice(["yes", "no"])
        pred_sell_a = "no" if pred_buy_a == "yes" else random.choice(["yes", "no"])
        pred_buy_b = random.choice(["yes", "no"])
        pred_sell_b = "no" if pred_buy_b == "yes" else random.choice(["yes", "no"])

        day_rows.append([
            i, day, took_loan, loan_type, loan_amount,
            pred_loan, pred_buy_a, pred_sell_a, pred_buy_b, pred_sell_b
        ])

df_day = pd.DataFrame(day_rows, columns=[
    "Trader ID", "Trading Day", "Loan Taken", "Loan Type", "Loan Amount",
    "Predict Loan Tomorrow", "Predict Buy A Tomorrow", "Predict Sell A Tomorrow",
    "Predict Buy B Tomorrow", "Predict Sell B Tomorrow"
])
df_day.to_excel(os.path.join(OUT_DIR, "agent_day_record.xlsx"), index=False)
print(f"agent_day_record.xlsx saved: {len(df_day)} rows.")


print("4. Generating agent_session_record.xlsx & trades.xlsx...")
# Sample subset of days for high fidelity without creating multi-gigabyte files
# We generate all days for sample key agents, and sampled sessions for all 50 agents
# To ensure fast dashboard performance, record session intervals:
recorded_days = list(range(1, 31)) + list(range(70, 90)) + list(range(140, 155)) + list(range(250, TOTAL_DAYS + 1))
# Plus every 5th day in between
for d in range(1, TOTAL_DAYS + 1):
    if d not in recorded_days and d % 4 == 0:
        recorded_days.append(d)
recorded_days.sort()

session_rows = []
trade_rows = []

# Cumulative wealth progression
for day in recorded_days:
    p_a_close, p_b_close = prices_by_day[day][-1]
    day_fraction = day / TOTAL_DAYS

    for session in range(1, SESSIONS + 1):
        p_a, p_b = prices_by_day[day][session - 1]

        # Potential trades in this session
        buyers = []
        sellers = []

        for i in range(AGENTS):
            prof = agent_profiles[i]
            # Drift wealth toward target
            wealth_progress = 1.0 + (prof["growth_target"] - 1.0) * (day_fraction ** 0.9)
            # Add micro noise
            wealth_progress *= random.uniform(0.96, 1.04)

            # Recalculate portfolio components
            current_total = (prof["cash"] + prof["stock_a"] * p_a + prof["stock_b"] * p_b) * wealth_progress
            if i in [12, 38]:  # defaulted / struggling
                current_total = max(35000, current_total * (1 - day_fraction * 0.85))

            stock_a_val = round(current_total * random.uniform(0.35, 0.45), 2)
            stock_b_val = round(current_total * random.uniform(0.30, 0.40), 2)
            cash_val = round(max(10000, current_total - stock_a_val - stock_b_val), 2)
            proper = round(cash_val + stock_a_val + stock_b_val, 2)

            # Order generation (random subset places orders each session)
            places_order = random.random() < 0.45
            if places_order:
                order_type = random.choice(["buy", "sell"])
                order_stock = random.choice(["A", "B"])
                base_price = p_a if order_stock == "A" else p_b
                order_price = round(base_price * random.uniform(0.98, 1.02), 2)
                order_qty = random.randint(10, 250)

                if order_type == "buy":
                    buyers.append((i, order_stock, order_qty, order_price))
                else:
                    sellers.append((i, order_stock, order_qty, order_price))
            else:
                order_type = "no"
                order_stock = "-"
                order_qty = 0
                order_price = 0

            session_rows.append([
                i, day, session, proper, cash_val, stock_a_val, stock_b_val,
                order_type, order_stock, order_qty, order_price
            ])

        # Match some buyers and sellers into trades
        for b_agent, b_stock, b_qty, b_px in buyers[:8]:
            for s_agent, s_stock, s_qty, s_px in sellers[:8]:
                if b_stock == s_stock and b_agent != s_agent and abs(b_px - s_px) <= 0.8:
                    trade_vol = min(b_qty, s_qty)
                    exec_px = round((b_px + s_px) / 2.0, 2)
                    trade_rows.append([day, session, b_stock, b_agent, s_agent, trade_vol, exec_px])
                    break

df_sess = pd.DataFrame(session_rows, columns=[
    "Trader ID", "Trading Day", "Trading Session", "Total Assets Before Trade",
    "Cash Before Trade", "Stock A Value Before Trade", "Stock B Value Before Trade",
    "Order Type", "Order Stock", "Order Quantity", "Order Price"
])
df_sess.to_excel(os.path.join(OUT_DIR, "agent_session_record.xlsx"), index=False)
print(f"agent_session_record.xlsx saved: {len(df_sess)} rows.")

df_trades = pd.DataFrame(trade_rows, columns=[
    "Trading Day", "Trading Session", "Stock Type", "Buyer Trader", "Seller Trader", "Trade Volume", "Trade Price"
])
df_trades.to_excel(os.path.join(OUT_DIR, "trades.xlsx"), index=False)
print(f"trades.xlsx saved: {len(df_trades)} rows.")

print("All pseudo dataset files generated successfully!")
