import { useCallback, useEffect, useRef, useState } from 'react';
import { request } from '../api.js';
import { fromKobo } from '../utils.js';

function isKoboAmount(value) {
  return (typeof value === 'number' || (typeof value === 'string' && value.trim() !== ''))
    && Number.isSafeInteger(Number(value))
    && Number(value) >= 0;
}

function convertExpenseFromKobo(expense) {
  return {
    ...expense,
    total: fromKobo(expense.total),
    payments: expense.payments.map((item) => ({
      ...item,
      amountPaid: fromKobo(item.amountPaid),
    })),
  };
}

function parseExpenseHistory(data) {
  if (!Array.isArray(data.expenses)) {
    throw new Error('The API response must include an expenses array.');
  }
  if (data.expenses.some((expense) => !expense
    || !isKoboAmount(expense.total)
    || Number(expense.total) === 0
    || !Array.isArray(expense.payments)
    || expense.payments.some((item) => !item || !item.memberId || !isKoboAmount(item.amountPaid)))) {
    throw new Error('The API returned an invalid expense history item.');
  }
  return data.expenses.map(convertExpenseFromKobo);
}

export default function useExpenseHistory({ groupId }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);
  const history = state?.groupId === groupId ? state.expenses : [];

  const refreshHistory = useCallback(async (id = groupId) => {
    if (!id) {
      latestRequest.current += 1;
      setState(null);
      setError('');
      return;
    }
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    try {
      const data = await request(`/groups/${encodeURIComponent(id)}/expenses`);
      if (requestId !== latestRequest.current) return false;
      setState({ groupId: id, expenses: parseExpenseHistory(data) });
      return true;
    } catch (err) {
      if (requestId === latestRequest.current) setError(err.message || 'Could not load expense history.');
      return false;
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    let active = true;
    if (!groupId) {
      latestRequest.current += 1;
      setState(null);
      setError('');
      return undefined;
    }

    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    request(`/groups/${encodeURIComponent(groupId)}/expenses`)
      .then((data) => {
        if (active && requestId === latestRequest.current) {
          setState({ groupId, expenses: parseExpenseHistory(data) });
        }
      })
      .catch((err) => {
        if (active && requestId === latestRequest.current) setError(err.message || 'Could not load expense history.');
      })
      .finally(() => {
        if (active && requestId === latestRequest.current) setLoading(false);
      });

    return () => {
      active = false;
      if (requestId === latestRequest.current) latestRequest.current += 1;
    };
  }, [groupId]);

  return { history, loading, error, refreshHistory };
}
