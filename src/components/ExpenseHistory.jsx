import { money } from '../utils.js';

export default function ExpenseHistory({ history, loading, error, groupName, members, onRefresh }) {
  return (
    <section className="panel results-panel" aria-live="polite">
      <div className="panel-heading"><div><span className="section-index">04 / EXPENSE HISTORY</span><h2>Saved expenses.</h2><p>Expense records for {groupName || 'your group'}.</p></div><button type="button" className="button button-outline" onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh history'}</button></div>
      {error && <div className="alert alert-error" role="alert"><span>!</span><p>{error}</p></div>}
      {!error && loading && <p role="status">Loading expense history…</p>}
      {!error && !loading && history.length === 0 && <p className="empty-settlement">No saved expenses yet.</p>}
      {!error && history.length > 0 && <div className="settlement-list">{history.map((expense, index) => (
        <article className="settlement-row" key={expense.id || `${expense.description || 'expense'}-${index}`}>
          <span className="settlement-avatar">₦</span>
          <div>
            <b>{expense.description || 'Shared expense'}</b>
            <small>{expense.payments.map((item) => {
              const member = members.find((savedMember) => savedMember.id === item.memberId);
              return `${member?.name || 'Member'}: ${money(item.amountPaid)}`;
            }).join(' · ')}</small>
          </div>
          <strong>{money(expense.total)}</strong>
        </article>
      ))}</div>}
    </section>
  );
}
