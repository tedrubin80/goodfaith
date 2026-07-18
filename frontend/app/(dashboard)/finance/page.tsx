"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { canAccessERP, canManageERP, isArtistRole, useAuth } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  RECOUPMENT_ENTRY_TYPES,
  type Artist,
  type Budget,
  type ExpenseCategory,
  type LabelExpense,
  type RecoupmentBalance,
  type RecoupmentEntry,
  type RecoupmentEntryType,
  type Release,
} from "@/lib/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]";
const labelClassName = "block text-sm font-medium";

type Tab = "expenses" | "budgets" | "recoupment";

const emptyExpense = {
  label: "",
  artist: "",
  release: "",
  category: "other" as ExpenseCategory,
  description: "",
  amount: "",
  currency: "USD",
  incurred_on: "",
  is_recoupable: true,
  notes: "",
};

const emptyBudget = {
  label: "",
  artist: "",
  release: "",
  name: "",
  category: "other" as ExpenseCategory,
  amount: "",
  currency: "USD",
  period_start: "",
  period_end: "",
  notes: "",
};

const emptyRecoup = {
  label: "",
  artist: "",
  release: "",
  expense: "",
  entry_type: "charge" as RecoupmentEntryType,
  amount: "",
  currency: "USD",
  effective_on: "",
  description: "",
};

export default function FinancePage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<Tab>("expenses");
  const [expenses, setExpenses] = useState<LabelExpense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [entries, setEntries] = useState<RecoupmentEntry[]>([]);
  const [balances, setBalances] = useState<RecoupmentBalance[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [labels, setLabels] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [budgetForm, setBudgetForm] = useState(emptyBudget);
  const [recoupForm, setRecoupForm] = useState(emptyRecoup);

  const hasAccess = user && canAccessERP(user.role);
  const canManage = user && canManageERP(user.role);
  const isArtist = user && isArtistRole(user.role);

  useEffect(() => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [expenseData, budgetData, entryData, balanceData] = await Promise.all([
          apiFetch<LabelExpense[]>("/api/erp/expenses/", {}, token!),
          apiFetch<Budget[]>("/api/erp/budgets/", {}, token!),
          apiFetch<RecoupmentEntry[]>("/api/erp/recoupment/", {}, token!),
          apiFetch<RecoupmentBalance[]>("/api/erp/recoupment/balances/", {}, token!),
        ]);
        setExpenses(expenseData);
        setBudgets(budgetData);
        setEntries(entryData);
        setBalances(balanceData);
        if (canManage) {
          const [artistData, releaseData, labelData] = await Promise.all([
            apiFetch<Artist[]>("/api/catalog/artists/", {}, token!),
            apiFetch<Release[]>("/api/catalog/releases/", {}, token!),
            apiFetch<{ id: number; name: string }[]>("/api/catalog/labels/", {}, token!),
          ]);
          setArtists(artistData);
          setReleases(releaseData);
          setLabels(labelData);
          const defaultLabel = labelData.length === 1 ? String(labelData[0].id) : "";
          if (defaultLabel) {
            setExpenseForm((c) => ({ ...c, label: defaultLabel }));
            setBudgetForm((c) => ({ ...c, label: defaultLabel }));
            setRecoupForm((c) => ({ ...c, label: defaultLabel }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load finance data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, hasAccess, canManage]);

  function resetForms(labelId?: string) {
    const label = labelId ?? (labels.length === 1 ? String(labels[0].id) : "");
    setExpenseForm({ ...emptyExpense, label });
    setBudgetForm({ ...emptyBudget, label });
    setRecoupForm({ ...emptyRecoup, label });
    setShowForm(false);
  }

  async function handleExpenseSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !expenseForm.label || !expenseForm.description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await apiFetch<LabelExpense>(
        "/api/erp/expenses/",
        {
          method: "POST",
          body: JSON.stringify({
            label: Number(expenseForm.label),
            artist: expenseForm.artist ? Number(expenseForm.artist) : null,
            release: expenseForm.release ? Number(expenseForm.release) : null,
            category: expenseForm.category,
            description: expenseForm.description.trim(),
            amount: expenseForm.amount,
            currency: expenseForm.currency,
            incurred_on: expenseForm.incurred_on,
            is_recoupable: expenseForm.is_recoupable,
            notes: expenseForm.notes.trim(),
          }),
        },
        token,
      );
      setExpenses((current) => [saved, ...current]);
      resetForms(expenseForm.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBudgetSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !budgetForm.label || !budgetForm.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await apiFetch<Budget>(
        "/api/erp/budgets/",
        {
          method: "POST",
          body: JSON.stringify({
            label: Number(budgetForm.label),
            artist: budgetForm.artist ? Number(budgetForm.artist) : null,
            release: budgetForm.release ? Number(budgetForm.release) : null,
            name: budgetForm.name.trim(),
            category: budgetForm.category,
            amount: budgetForm.amount,
            currency: budgetForm.currency,
            period_start: budgetForm.period_start || null,
            period_end: budgetForm.period_end || null,
            notes: budgetForm.notes.trim(),
          }),
        },
        token,
      );
      setBudgets((current) => [saved, ...current]);
      resetForms(budgetForm.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save budget.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecoupSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !recoupForm.label || !recoupForm.artist) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await apiFetch<RecoupmentEntry>(
        "/api/erp/recoupment/",
        {
          method: "POST",
          body: JSON.stringify({
            label: Number(recoupForm.label),
            artist: Number(recoupForm.artist),
            release: recoupForm.release ? Number(recoupForm.release) : null,
            expense: recoupForm.expense ? Number(recoupForm.expense) : null,
            entry_type: recoupForm.entry_type,
            amount: recoupForm.amount,
            currency: recoupForm.currency,
            effective_on: recoupForm.effective_on,
            description: recoupForm.description.trim(),
          }),
        },
        token,
      );
      setEntries((current) => [saved, ...current]);
      const balanceData = await apiFetch<RecoupmentBalance[]>(
        "/api/erp/recoupment/balances/",
        {},
        token,
      );
      setBalances(balanceData);
      resetForms(recoupForm.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recoupment entry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to finance data.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "expenses", label: "Expenses" },
    { id: "budgets", label: "Budgets" },
    { id: "recoupment", label: "Recoupment" },
  ];

  return (
    <>
      <PageHeader
        title={isArtist ? "My finances" : "Finance"}
        description={
          isArtist
            ? "Your expenses, budgets, and unrecouped balances."
            : "Label expenses, budgets, and artist recoupment ledgers."
        }
        action={
          canManage ? (
            <button
              type="button"
              onClick={() => {
                if (showForm) resetForms();
                else setShowForm(true);
              }}
              className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)]"
            >
              {showForm
                ? "Cancel"
                : tab === "expenses"
                  ? "New expense"
                  : tab === "budgets"
                    ? "New budget"
                    : "New entry"}
            </button>
          ) : undefined
        }
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setShowForm(false);
            }}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-medium border",
              tab === item.id
                ? "border-[var(--color-primary-fill)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-border)] text-[var(--color-muted)]",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showForm && canManage && tab === "expenses" ? (
        <form
          onSubmit={handleExpenseSubmit}
          className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
        >
          <h2 className="font-semibold">New expense</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {labels.length > 1 ? (
              <label className={labelClassName}>
                Label
                <select
                  required
                  value={expenseForm.label}
                  onChange={(e) => setExpenseForm((c) => ({ ...c, label: e.target.value }))}
                  className={inputClassName}
                >
                  <option value="">Select label</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className={labelClassName}>
              Description
              <input
                required
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((c) => ({ ...c, description: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Category
              <select
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm((c) => ({
                    ...c,
                    category: e.target.value as ExpenseCategory,
                  }))
                }
                className={inputClassName}
              >
                {EXPENSE_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Amount
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((c) => ({ ...c, amount: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Incurred on
              <input
                required
                type="date"
                value={expenseForm.incurred_on}
                onChange={(e) => setExpenseForm((c) => ({ ...c, incurred_on: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Artist
              <select
                value={expenseForm.artist}
                onChange={(e) => setExpenseForm((c) => ({ ...c, artist: e.target.value }))}
                className={inputClassName}
              >
                <option value="">None</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Release
              <select
                value={expenseForm.release}
                onChange={(e) => setExpenseForm((c) => ({ ...c, release: e.target.value }))}
                className={inputClassName}
              >
                <option value="">None</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium mt-6">
              <input
                type="checkbox"
                checked={expenseForm.is_recoupable}
                onChange={(e) =>
                  setExpenseForm((c) => ({ ...c, is_recoupable: e.target.checked }))
                }
              />
              Recoupable
            </label>
          </div>
          <label className={labelClassName}>
            Notes
            <textarea
              rows={2}
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm((c) => ({ ...c, notes: e.target.value }))}
              className={inputClassName}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)] disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Add expense"}
          </button>
        </form>
      ) : null}

      {showForm && canManage && tab === "budgets" ? (
        <form
          onSubmit={handleBudgetSubmit}
          className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
        >
          <h2 className="font-semibold">New budget</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {labels.length > 1 ? (
              <label className={labelClassName}>
                Label
                <select
                  required
                  value={budgetForm.label}
                  onChange={(e) => setBudgetForm((c) => ({ ...c, label: e.target.value }))}
                  className={inputClassName}
                >
                  <option value="">Select label</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className={labelClassName}>
              Name
              <input
                required
                value={budgetForm.name}
                onChange={(e) => setBudgetForm((c) => ({ ...c, name: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Category
              <select
                value={budgetForm.category}
                onChange={(e) =>
                  setBudgetForm((c) => ({
                    ...c,
                    category: e.target.value as ExpenseCategory,
                  }))
                }
                className={inputClassName}
              >
                {EXPENSE_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Amount
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={budgetForm.amount}
                onChange={(e) => setBudgetForm((c) => ({ ...c, amount: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Period start
              <input
                type="date"
                value={budgetForm.period_start}
                onChange={(e) => setBudgetForm((c) => ({ ...c, period_start: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Period end
              <input
                type="date"
                value={budgetForm.period_end}
                onChange={(e) => setBudgetForm((c) => ({ ...c, period_end: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Artist
              <select
                value={budgetForm.artist}
                onChange={(e) => setBudgetForm((c) => ({ ...c, artist: e.target.value }))}
                className={inputClassName}
              >
                <option value="">None</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Release
              <select
                value={budgetForm.release}
                onChange={(e) => setBudgetForm((c) => ({ ...c, release: e.target.value }))}
                className={inputClassName}
              >
                <option value="">None</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)] disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Add budget"}
          </button>
        </form>
      ) : null}

      {showForm && canManage && tab === "recoupment" ? (
        <form
          onSubmit={handleRecoupSubmit}
          className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
        >
          <h2 className="font-semibold">New recoupment entry</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {labels.length > 1 ? (
              <label className={labelClassName}>
                Label
                <select
                  required
                  value={recoupForm.label}
                  onChange={(e) => setRecoupForm((c) => ({ ...c, label: e.target.value }))}
                  className={inputClassName}
                >
                  <option value="">Select label</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className={labelClassName}>
              Artist
              <select
                required
                value={recoupForm.artist}
                onChange={(e) => setRecoupForm((c) => ({ ...c, artist: e.target.value }))}
                className={inputClassName}
              >
                <option value="">Select artist</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Type
              <select
                value={recoupForm.entry_type}
                onChange={(e) =>
                  setRecoupForm((c) => ({
                    ...c,
                    entry_type: e.target.value as RecoupmentEntryType,
                  }))
                }
                className={inputClassName}
              >
                {RECOUPMENT_ENTRY_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Amount
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={recoupForm.amount}
                onChange={(e) => setRecoupForm((c) => ({ ...c, amount: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Effective on
              <input
                required
                type="date"
                value={recoupForm.effective_on}
                onChange={(e) => setRecoupForm((c) => ({ ...c, effective_on: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Description
              <input
                required
                value={recoupForm.description}
                onChange={(e) => setRecoupForm((c) => ({ ...c, description: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Release
              <select
                value={recoupForm.release}
                onChange={(e) => setRecoupForm((c) => ({ ...c, release: e.target.value }))}
                className={inputClassName}
              >
                <option value="">None</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)] disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Add entry"}
          </button>
        </form>
      ) : null}

      {tab === "expenses" ? (
        expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description={
              canManage
                ? "Log advances, recording, marketing, and other label spend."
                : "Expenses linked to you will appear here."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Artist</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Recoupable</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3 font-medium">{expense.description}</td>
                    <td className="px-4 py-3">{expense.category_display}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {expense.artist_name || "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatMoney(expense.amount, expense.currency)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDate(expense.incurred_on)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {expense.is_recoupable ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {tab === "budgets" ? (
        budgets.length === 0 ? (
          <EmptyState
            title="No budgets yet"
            description={
              canManage
                ? "Set spend envelopes by artist, release, or category."
                : "Budgets linked to you will appear here."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Artist</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => (
                  <tr key={budget.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3 font-medium">{budget.name}</td>
                    <td className="px-4 py-3">{budget.category_display}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {budget.artist_name || "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatMoney(budget.amount, budget.currency)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {budget.period_start ? formatDate(budget.period_start) : "—"}
                      {budget.period_end ? ` → ${formatDate(budget.period_end)}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {tab === "recoupment" ? (
        <div className="space-y-8">
          {balances.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold mb-3">Unrecouped balances</h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Artist</th>
                      <th className="px-4 py-3 font-medium">Unrecouped</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((row) => (
                      <tr key={row.artist} className="border-t border-[var(--color-border)]">
                        <td className="px-4 py-3 font-medium">{row.artist_name}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatMoney(row.unrecouped, row.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {entries.length === 0 ? (
            <EmptyState
              title="No recoupment entries"
              description={
                canManage
                  ? "Charge advances and credit royalty recoveries against artist balances."
                  : "Your recoupment ledger will appear here."
              }
            />
          ) : (
            <div>
              <h2 className="text-sm font-semibold mb-3">Ledger</h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Artist</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-t border-[var(--color-border)]">
                        <td className="px-4 py-3 text-[var(--color-muted)]">
                          {formatDate(entry.effective_on)}
                        </td>
                        <td className="px-4 py-3 font-medium">{entry.artist_name}</td>
                        <td className="px-4 py-3">{entry.entry_type_display}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatMoney(entry.signed_amount, entry.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
