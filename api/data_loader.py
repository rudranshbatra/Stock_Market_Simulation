"""
Data loader module for StockAgent Dashboard.
Reads Excel files from the simulation's res/ directory and returns
JSON-serialisable lists of dicts (or aggregated KPIs).
"""

import os
import math
import pandas as pd
import numpy as np

RES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'Stock_agent', 'res'
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _val(v):
    """Convert any numpy/pandas scalar or NaN to native Python JSON-safe types."""
    if v is None:
        return None
    if isinstance(v, (float, np.floating)):
        if math.isnan(v):
            return None
        return float(v)
    if isinstance(v, (int, np.integer)):
        return int(v)
    if pd.isna(v):
        return None
    return v


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def load_stocks() -> list[dict]:
    """Read stocks.xlsx → list of dicts with keys: day, session, stockA, stockB."""
    path = os.path.join(RES_DIR, 'stocks.xlsx')
    if not os.path.exists(path):
        return []
    df = pd.read_excel(path, engine='openpyxl')
    records = []
    for _, row in df.iterrows():
        records.append({
            'day': _val(row.get('Trading Day')),
            'session': _val(row.get('Trading Session')),
            'stockA': _val(row.get('Stock A Price After Session')),
            'stockB': _val(row.get('Stock B Price After Session')),
        })
    return records


def load_trades() -> list[dict]:
    """Read trades.xlsx → list of dicts. Returns [] if the file doesn't exist."""
    path = os.path.join(RES_DIR, 'trades.xlsx')
    if not os.path.exists(path):
        return []
    df = pd.read_excel(path, engine='openpyxl')
    records = []
    for _, row in df.iterrows():
        records.append({
            'day': _val(row.get('Trading Day')),
            'session': _val(row.get('Trading Session')),
            'stock': _val(row.get('Stock Type')),
            'buyer': _val(row.get('Buyer Trader')),
            'seller': _val(row.get('Seller Trader')),
            'volume': _val(row.get('Trade Volume')),
            'price': _val(row.get('Trade Price')),
        })
    return records


def load_agent_daily() -> list[dict]:
    """Read agent_day_record.xlsx → list of dicts."""
    path = os.path.join(RES_DIR, 'agent_day_record.xlsx')
    if not os.path.exists(path):
        return []
    df = pd.read_excel(path, engine='openpyxl')
    records = []
    for _, row in df.iterrows():
        records.append({
            'agentId': _val(row.get('Trader ID')),
            'day': _val(row.get('Trading Day')),
            'loanTaken': _val(row.get('Loan Taken')),
            'loanType': _val(row.get('Loan Type')),
            'loanAmount': _val(row.get('Loan Amount')),
            'predictLoan': _val(row.get('Predict Loan Tomorrow')),
            'predictBuyA': _val(row.get('Predict Buy A Tomorrow')),
            'predictSellA': _val(row.get('Predict Sell A Tomorrow')),
            'predictBuyB': _val(row.get('Predict Buy B Tomorrow')),
            'predictSellB': _val(row.get('Predict Sell B Tomorrow')),
        })
    return records


def load_agent_sessions() -> list[dict]:
    """Read agent_session_record.xlsx → list of dicts."""
    path = os.path.join(RES_DIR, 'agent_session_record.xlsx')
    if not os.path.exists(path):
        return []
    df = pd.read_excel(path, engine='openpyxl')
    records = []
    for _, row in df.iterrows():
        records.append({
            'agentId': _val(row.get('Trader ID')),
            'day': _val(row.get('Trading Day')),
            'session': _val(row.get('Trading Session')),
            'totalAssets': _val(row.get('Total Assets Before Trade')),
            'cash': _val(row.get('Cash Before Trade')),
            'stockAValue': _val(row.get('Stock A Value Before Trade')),
            'stockBValue': _val(row.get('Stock B Value Before Trade')),
            'orderType': _val(row.get('Order Type')),
            'orderStock': _val(row.get('Order Stock')),
            'orderQuantity': _val(row.get('Order Quantity')),
            'orderPrice': _val(row.get('Order Price')),
        })
    return records


# ---------------------------------------------------------------------------
# Aggregations
# ---------------------------------------------------------------------------

def get_summary() -> dict:
    """Compute high-level KPIs across all data files."""
    stocks = load_stocks()
    trades = load_trades()
    sessions = load_agent_sessions()

    # Stock price stats
    stock_a_prices = [s['stockA'] for s in stocks if s['stockA'] is not None]
    stock_b_prices = [s['stockB'] for s in stocks if s['stockB'] is not None]

    avg_a = float(round(float(sum(stock_a_prices)) / len(stock_a_prices), 2)) if stock_a_prices else 0.0
    avg_b = float(round(float(sum(stock_b_prices)) / len(stock_b_prices), 2)) if stock_b_prices else 0.0

    # Latest prices (last row by day+session)
    latest_a = float(stock_a_prices[-1]) if stock_a_prices else 0.0
    latest_b = float(stock_b_prices[-1]) if stock_b_prices else 0.0

    # Distinct trading days
    days = {int(s['day']) for s in stocks if s['day'] is not None}

    # Active agents & top agent (by highest final totalAssets)
    agent_ids = {int(s['agentId']) for s in sessions if s['agentId'] is not None}

    top_agent = None
    if sessions:
        best_assets = -float('inf')
        for aid in agent_ids:
            agent_rows = [s for s in sessions if s['agentId'] == aid]
            agent_rows.sort(key=lambda r: (r['day'] or 0, r['session'] or 0))
            last = agent_rows[-1]
            if last['totalAssets'] is not None and float(last['totalAssets']) > best_assets:
                best_assets = float(last['totalAssets'])
                top_agent = int(aid)

    return {
        'totalTrades': int(len(trades)),
        'avgStockAPrice': avg_a,
        'avgStockBPrice': avg_b,
        'activeAgents': int(len(agent_ids)),
        'totalDays': int(len(days)),
        'latestStockAPrice': latest_a,
        'latestStockBPrice': latest_b,
        'topAgent': top_agent,
    }


def get_events() -> list[dict]:
    """Return hard-coded macro-economic events from the simulation."""
    return [
        {
            'day': 78,
            'type': 'rate_cut',
            'label': 'Interest Rate Cut',
            'description': 'Central bank cuts interest rates, stimulating borrowing and investment.',
        },
        {
            'day': 144,
            'type': 'rate_hike',
            'label': 'Interest Rate Hike',
            'description': 'Central bank raises interest rates, tightening monetary policy.',
        },
    ]
