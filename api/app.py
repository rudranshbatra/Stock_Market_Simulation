"""
Flask REST API for the StockAgent Dashboard.
Serves simulation data from Excel files as JSON endpoints.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS

from data_loader import (
    load_stocks,
    load_trades,
    load_agent_daily,
    load_agent_sessions,
    get_summary,
    get_events,
)

app = Flask(__name__)
CORS(app)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.route('/api/stocks', methods=['GET'])
def stocks():
    """Return stock price history.  Optional ?day=N filter."""
    try:
        data = load_stocks()
        day = request.args.get('day', type=int)
        if day is not None:
            data = [r for r in data if r['day'] == day]
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({'error': 'stocks.xlsx not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/trades', methods=['GET'])
def trades():
    """Return all executed trades."""
    try:
        return jsonify(load_trades())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/agents/daily', methods=['GET'])
def agents_daily():
    """Return agent daily records (loans, predictions)."""
    try:
        return jsonify(load_agent_daily())
    except FileNotFoundError:
        return jsonify({'error': 'agent_day_record.xlsx not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/agents/sessions', methods=['GET'])
def agents_sessions():
    """Return agent session records.  Optional ?agent=N filter."""
    try:
        data = load_agent_sessions()
        agent = request.args.get('agent', type=int)
        if agent is not None:
            data = [r for r in data if r['agentId'] == agent]
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({'error': 'agent_session_record.xlsx not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/agents/<int:agent_id>', methods=['GET'])
def agent_detail(agent_id: int):
    """Return combined session + daily data for a single agent."""
    try:
        sessions = [r for r in load_agent_sessions() if r['agentId'] == agent_id]
        daily = [r for r in load_agent_daily() if r['agentId'] == agent_id]
        return jsonify({'sessions': sessions, 'daily': daily})
    except FileNotFoundError:
        return jsonify({'error': 'Data files not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/summary', methods=['GET'])
def summary():
    """Return aggregated KPI summary."""
    try:
        return jsonify(get_summary())
    except FileNotFoundError:
        return jsonify({'error': 'Required data files not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/events', methods=['GET'])
def events():
    """Return macro-economic events."""
    return jsonify(get_events())


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    app.run(debug=True, port=5000)
