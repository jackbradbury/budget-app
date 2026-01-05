"use client";

import { useState, useEffect } from "react";

const labelClass = "text-sm font-medium text-gray-700";

const inputClass =
	"w-full border-b border-gray-300 bg-transparent px-0 py-1 text-sm " +
	"placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-blue-500 " +
	"disabled:bg-transparent disabled:text-gray-400 text-right";

const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

type BudgetRow = {
	id: number;
	label: string;
	planned: string;
	actual: string;
};

type MonthData = {
	expenseRows: BudgetRow[];
	incomeRows: BudgetRow[];
	startingBalance?: number;
};

const initialExpenseRows: BudgetRow[] = [
	{ id: 1, label: "Housing", planned: "", actual: "" },
	{ id: 2, label: "Food", planned: "", actual: "" },
	{ id: 3, label: "Transportation", planned: "", actual: "" },
];

const initialIncomeRows: BudgetRow[] = [
	{ id: 1, label: "Salary", planned: "", actual: "" },
	{ id: 2, label: "Bonus", planned: "", actual: "" },
	{ id: 3, label: "Other", planned: "", actual: "" },
];

// Helper functions for localStorage
const getStorageKey = (monthIndex: number, year?: number) => {
	const currentYear = year || new Date().getFullYear();
	return `budget-data-${currentYear}-${monthIndex}`;
};

const loadMonthData = (monthIndex: number): MonthData | null => {
	if (typeof window === "undefined") return null;
	try {
		const key = getStorageKey(monthIndex);
		const data = localStorage.getItem(key);
		if (data) {
			return JSON.parse(data);
		}
	} catch (error) {
		console.error("Error loading month data:", error);
	}
	return null;
};

const saveMonthData = (monthIndex: number, data: MonthData) => {
	if (typeof window === "undefined") return;
	try {
		const key = getStorageKey(monthIndex);
		localStorage.setItem(key, JSON.stringify(data));
	} catch (error) {
		console.error("Error saving month data:", error);
	}
};

const clearAllBudgetData = () => {
	if (typeof window === "undefined") return;
	try {
		const currentYear = new Date().getFullYear();
		// Clear all months for current year
		for (let i = 0; i < 12; i++) {
			const key = getStorageKey(i, currentYear);
			localStorage.removeItem(key);
		}
		// Also clear previous year if it exists
		for (let i = 0; i < 12; i++) {
			const key = getStorageKey(i, currentYear - 1);
			localStorage.removeItem(key);
		}
		console.log("All budget data cleared");
	} catch (error) {
		console.error("Error clearing budget data:", error);
	}
};

export default function Home() {
	const [expenseRows, setExpenseRows] = useState<BudgetRow[]>(initialExpenseRows);
	const [incomeRows, setIncomeRows] = useState<BudgetRow[]>(initialIncomeRows);
	const [monthIndex, setMonthIndex] = useState<number>(new Date().getMonth());
	const [startingBalance, setStartingBalance] = useState<number>(1579);
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		//clearAllBudgetData();
		
		const currentMonthIndex = new Date().getMonth();
		const savedData = loadMonthData(currentMonthIndex);
		
		// January (monthIndex 0) always starts with initial value, never from December
		if (currentMonthIndex === 0) {
			if (savedData) {
				setExpenseRows(savedData.expenseRows);
				setIncomeRows(savedData.incomeRows);
				// January always uses 1579 if not set, or the saved value if it exists
				setStartingBalance(savedData.startingBalance ?? 1579);
				if (savedData.startingBalance === undefined) {
					saveMonthData(currentMonthIndex, {
						...savedData,
						startingBalance: 1579,
					});
				}
			} else {
				setExpenseRows(initialExpenseRows);
				setIncomeRows(initialIncomeRows);
				setStartingBalance(1579);
				saveMonthData(currentMonthIndex, {
					expenseRows: initialExpenseRows,
					incomeRows: initialIncomeRows,
					startingBalance: 1579,
				});
			}
		} else {
			// For all other months, load saved data or calculate from previous month
			if (savedData) {
				setExpenseRows(savedData.expenseRows);
				setIncomeRows(savedData.incomeRows);
				// Use saved startingBalance - never recalculate if it exists
				if (savedData.startingBalance !== undefined) {
					setStartingBalance(savedData.startingBalance);
				} else {
					// Only calculate from previous month if startingBalance doesn't exist
					const prevMonthIndex = currentMonthIndex - 1;
					const prevData = loadMonthData(prevMonthIndex);
					let newStarting = 1579;
					if (prevData && prevData.startingBalance !== undefined) {
						const prevIncome = prevData.incomeRows.reduce(
							(sum, row) => sum + (row.actual ? Number(row.actual) : 0),
							0,
						);
						const prevExpense = prevData.expenseRows.reduce(
							(sum, row) => sum + (row.actual ? Number(row.actual) : 0),
							0,
						);
						newStarting = prevData.startingBalance + prevIncome - prevExpense;
					}
					setStartingBalance(newStarting);
					// Save it immediately so it's never recalculated again
					saveMonthData(currentMonthIndex, {
						...savedData,
						startingBalance: newStarting,
					});
				}
			} else {
				// No saved data - calculate from previous month or use default
				setExpenseRows(initialExpenseRows);
				setIncomeRows(initialIncomeRows);
				const prevMonthIndex = currentMonthIndex - 1;
				const prevData = loadMonthData(prevMonthIndex);
				let newStarting = 1579;
				if (prevData && prevData.startingBalance !== undefined) {
					const prevIncome = prevData.incomeRows.reduce(
						(sum, row) => sum + (row.actual ? Number(row.actual) : 0),
						0,
					);
					const prevExpense = prevData.expenseRows.reduce(
						(sum, row) => sum + (row.actual ? Number(row.actual) : 0),
						0,
					);
					newStarting = prevData.startingBalance + prevIncome - prevExpense;
				}
				setStartingBalance(newStarting);
				saveMonthData(currentMonthIndex, {
					expenseRows: initialExpenseRows,
					incomeRows: initialIncomeRows,
					startingBalance: newStarting,
				});
			}
		}
		setMonthIndex(currentMonthIndex);
		setIsInitialized(true);
	}, []);

	// Load new month data when month changes - startingBalance is set by navigation handlers
	useEffect(() => {
		if (!isInitialized) return;
		
		const savedData = loadMonthData(monthIndex);
		if (savedData) {
			setExpenseRows(savedData.expenseRows);
			setIncomeRows(savedData.incomeRows);
			// Only use saved startingBalance - never recalculate
			if (savedData.startingBalance !== undefined) {
				setStartingBalance(savedData.startingBalance);
			}
		} else {
			// If no saved data exists, navigation handlers should have created it
			// But as a fallback, load initial values (startingBalance was set by handlers)
			setExpenseRows(initialExpenseRows);
			setIncomeRows(initialIncomeRows);
		}
	}, [monthIndex, isInitialized]);

	// Save data whenever expenseRows or incomeRows change (but not during initialization)
	// startingBalance is saved separately and never changes after being set for a month
	useEffect(() => {
		if (!isInitialized) return;
		
		// Load current saved data to preserve the saved startingBalance
		const currentSaved = loadMonthData(monthIndex);
		const balanceToSave = currentSaved?.startingBalance ?? startingBalance;
		
		saveMonthData(monthIndex, {
			expenseRows,
			incomeRows,
			startingBalance: balanceToSave,
		});
	}, [expenseRows, incomeRows, monthIndex, isInitialized]);

	const expenseTotalPlanned = expenseRows.reduce(
		(sum, row) => sum + (row.planned ? Number(row.planned) : 0),
		0,
	);
	const expenseTotalActual = expenseRows.reduce(
		(sum, row) => sum + (row.actual ? Number(row.actual) : 0),
		0,
	);

	const incomeTotalPlanned = incomeRows.reduce(
		(sum, row) => sum + (row.planned ? Number(row.planned) : 0),
		0,
	);
	const incomeTotalActual = incomeRows.reduce(
		(sum, row) => sum + (row.actual ? Number(row.actual) : 0),
		0,
	);

	// Calculate current balance
	const currentBalance = startingBalance + incomeTotalActual - expenseTotalActual;

	// Calculate max value for balance bar chart
	const maxBalanceValue = Math.max(expenseTotalActual, incomeTotalActual, Math.abs(currentBalance)) || 1;

	// Data for expenses pie chart (based on actual values)
	const expenseActualValues = expenseRows.map((row) =>
		row.actual ? Math.max(0, Number(row.actual)) : 0,
	);
	const expenseActualTotal = expenseActualValues.reduce((sum, v) => sum + v, 0);

	// Shared max value for planned/actual bar chart scaling
	const maxExpenseValue =
		expenseRows.reduce((max, row) => {
			const planned = row.planned ? Number(row.planned) : 0;
			const actual = row.actual ? Number(row.actual) : 0;
			return Math.max(max, planned, actual);
		}, 0) || 1;

	const pieColors = [
		"#3b82f6", // blue-500
		"#22c55e", // green-500
		"#f97316", // orange-500
		"#e11d48", // rose-600
		"#a855f7", // purple-500
		"#0ea5e9", // sky-500
		"#facc15", // yellow-400
	];

	let startAngle = 0;
	const segments = expenseRows.map((row, index) => {
		const value = expenseActualValues[index];
		if (!expenseActualTotal || value <= 0) {
			return null;
		}
		const angle = (value / expenseActualTotal) * 360;
		const endAngle = startAngle + angle;
		const color = pieColors[index % pieColors.length];
		const segment = {
			color,
			from: startAngle,
			to: endAngle,
			label: row.label,
			value,
		};
		startAngle = endAngle;
		return segment;
	}).filter(Boolean) as {
		color: string;
		from: number;
		to: number;
		label: string;
		value: number;
	}[];

	const pieGradient =
		segments.length === 0
			? "conic-gradient(#e5e7eb 0deg, #e5e7eb 360deg)" // gray-200 when empty
			: `conic-gradient(${segments
					.map((s) => `${s.color} ${s.from}deg ${s.to}deg`)
					.join(", ")})`;

	const handlePreviousMonth = () => {
		if (isInitialized) {
			// Save current month's data before switching
			saveMonthData(monthIndex, {
				expenseRows,
				incomeRows,
				startingBalance,
			});
			// Don't update previous month's starting balance - just load what's saved
		}
		setMonthIndex((prev) => (prev - 1 + monthNames.length) % monthNames.length);
	};

	const handleNextMonth = () => {
		if (isInitialized) {
			// Save current month's data first
			saveMonthData(monthIndex, {
				expenseRows,
				incomeRows,
				startingBalance,
			});
			
			// Calculate ending balance of current month
			const endingBalance = startingBalance + incomeTotalActual - expenseTotalActual;
			
			// Set ending balance as next month's starting balance (carry over)
			const nextMonthIndex = (monthIndex + 1) % monthNames.length;
			
			// January (monthIndex 0) always starts with initial value, not from December
			if (nextMonthIndex === 0) {
				const nextData = loadMonthData(nextMonthIndex);
				if (nextData) {
					// January already exists - only update if startingBalance is not set
					if (nextData.startingBalance === undefined) {
						saveMonthData(nextMonthIndex, {
							...nextData,
							startingBalance: 1579,
						});
					}
				} else {
					// Create January with initial starting balance
					saveMonthData(nextMonthIndex, {
						expenseRows: initialExpenseRows,
						incomeRows: initialIncomeRows,
						startingBalance: 1579,
					});
				}
			} else {
				// For all other months, carry over the ending balance
				const nextData = loadMonthData(nextMonthIndex);
				if (nextData) {
					// Update existing month with new starting balance from current month's ending balance
					saveMonthData(nextMonthIndex, {
						...nextData,
						startingBalance: endingBalance,
					});
				} else {
					// Create new month with ending balance as starting balance
					saveMonthData(nextMonthIndex, {
						expenseRows: initialExpenseRows,
						incomeRows: initialIncomeRows,
						startingBalance: endingBalance,
					});
				}
			}
		}
		setMonthIndex((prev) => (prev + 1) % monthNames.length);
	};

	return (
		<main className="min-h-screen bg-zinc-50 px-2 py-2 font-sans text-gray-900">
			<div className="mx-auto max-w-screen space-y-2">
				<header className="mb-2 flex items-center justify-between gap-2 px-1">
					<button
						type="button"
						className="rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
						onClick={handlePreviousMonth}
					>
						&lt;
					</button>
					<div className="flex-1 text-center text-sm font-semibold tracking-tight text-zinc-900">
						{monthNames[monthIndex]}
					</div>
					<button
						type="button"
						className="rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
						onClick={handleNextMonth}
					>
						&gt;
					</button>
				</header>

				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
					{/* Balance card */}
					<section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
						<header className="mb-4 flex items-baseline justify-between gap-2">
							<h2 className="text-sm font-semibold tracking-tight text-zinc-900">
								Account Balance
							</h2>
						</header>

						<div className="flex flex-col gap-4">
							<div className="text-3xl font-bold tracking-tight text-zinc-900">
								${currentBalance.toFixed(2)}
							</div>

							{/* Bar chart */}
							<div className="space-y-2">
								<div className="space-y-1">
									<div className="flex items-center justify-between text-xs text-zinc-600">
										<span>Income</span>
										<span className="tabular-nums">${incomeTotalActual.toFixed(2)}</span>
									</div>
									<div className="relative h-4 rounded-full bg-zinc-100">
										<div
											className="absolute inset-y-0 left-0 rounded-full bg-green-500"
											style={{ width: `${Math.min((incomeTotalActual / maxBalanceValue) * 100, 100)}%` }}
										/>
									</div>
								</div>
								<div className="space-y-1">
									<div className="flex items-center justify-between text-xs text-zinc-600">
										<span>Spending</span>
										<span className="tabular-nums">${expenseTotalActual.toFixed(2)}</span>
									</div>
									<div className="relative h-4 rounded-full bg-zinc-100">
										<div
											className="absolute inset-y-0 left-0 rounded-full bg-red-500"
											style={{ width: `${Math.min((expenseTotalActual / maxBalanceValue) * 100, 100)}%` }}
										/>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Expenses pie chart */}
					<section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
						<header className="mb-4 flex items-baseline justify-between gap-2">
							<h2 className="text-sm font-semibold tracking-tight text-zinc-900">
								Spending summary
							</h2>
						</header>

						<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div
								className="h-40 w-40 rounded-full border border-zinc-200 shadow-sm"
								style={{ backgroundImage: pieGradient }}
							/>
							<ul className="flex-1 space-y-1 text-xs text-zinc-600">
								{segments.length === 0 && (
									<li className="text-zinc-400">No expenses entered</li>
								)}
								{segments.map((segment, index) => (
									<li key={segment.label + index} className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<span
												className="inline-block h-2.5 w-2.5 rounded-sm"
												style={{ backgroundColor: segment.color }}
											/>
											<span className="truncate">{segment.label || "(no label)"}</span>
										</div>
										<div className="tabular-nums text-zinc-500">
											{segment.value.toFixed(2)}
										</div>
									</li>
								))}
							</ul>
						</div>
					</section>

					{/* Expenses card */}
					<div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
						<header className="mb-3 flex items-center justify-between gap-2">
							<h1 className="text-sm font-semibold tracking-tight text-zinc-900">
								Expenses
							</h1>
						</header>

						<section className="space-y-3">
							<div className="grid grid-cols-[1.4fr_1fr_1fr] items-end gap-2 text-[11px] font-medium text-zinc-500">
								<div className="text-zinc-600">Category</div>
								<div className="text-right">Planned</div>
								<div className="text-right">Actual</div>
							</div>

							{expenseRows.map((row) => (
								<div
									key={row.id}
									className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2"
								>
									<div className="flex items-center justify-between gap-1.5">
										<input
											className={`${labelClass} bg-transparent border-none px-0 text-xs focus:outline-none focus:ring-0`}
											value={row.label}
											onChange={(e) =>
												setExpenseRows((prev) =>
													prev.map((r) =>
														r.id === row.id
															? { ...r, label: e.target.value }
															: r,
														),
													)
												}
										/>
										<button
											type="button"
											className="text-[10px] text-zinc-400 hover:text-red-500"
											onClick={() =>
												setExpenseRows((prev) =>
													prev.filter((r) => r.id !== row.id),
												)
											}
										>
											x
										</button>
									</div>
									<input
										className={`${inputClass} no-spin`}
										type="number"
										placeholder="0.00"
										value={row.planned}
										onChange={(e) =>
											setExpenseRows((prev) =>
												prev.map((r) =>
													r.id === row.id
														? { ...r, planned: e.target.value }
														: r,
													),
											)
										}
									/>
									<input
										className={`${inputClass} no-spin`}
										type="number"
										placeholder="0.00"
										value={row.actual}
										onChange={(e) =>
											setExpenseRows((prev) =>
												prev.map((r) =>
													r.id === row.id
														? { ...r, actual: e.target.value }
														: r,
													),
											)
										}
									/>
								</div>
							))}

							<div className="mt-2 flex justify-between">
								<button
									type="button"
									className="text-xs font-medium text-blue-600 hover:text-blue-700"
									onClick={() =>
										setExpenseRows((prev) => {
											const nextId = prev.length
												? Math.max(...prev.map((r) => r.id)) + 1
												: 1;
											return [
												...prev,
												{ id: nextId, label: "New category", planned: "", actual: "" },
											];
										})
									}
								>
									+ Add row
								</button>
							</div>
						</section>

						<footer className="mt-3 border-t pt-3">
							<div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 text-xs font-medium text-zinc-700">
								<div>Total</div>
								<div className="text-right text-zinc-900">
									{expenseTotalPlanned.toFixed(2)}
								</div>
								<div className="text-right text-zinc-900">
									{expenseTotalActual.toFixed(2)}
								</div>
							</div>
						</footer>
					</div>

					{/* Income card */}
					<div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
						<header className="mb-3 flex items-center justify-between gap-2">
							<h1 className="text-sm font-semibold tracking-tight text-zinc-900">
								Income
							</h1>
						</header>

						<section className="space-y-3">
							<div className="grid grid-cols-[1.4fr_1fr_1fr] items-end gap-2 text-[11px] font-medium text-zinc-500">
								<div className="text-zinc-600">Category</div>
								<div className="text-right">Planned</div>
								<div className="text-right">Actual</div>
							</div>

							{incomeRows.map((row) => (
								<div
									key={row.id}
									className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2"
								>
									<div className="flex items-center justify-between gap-1.5">
										<input
											className={`${labelClass} bg-transparent border-none px-0 text-xs focus:outline-none focus:ring-0`}
											value={row.label}
											onChange={(e) =>
												setIncomeRows((prev) =>
													prev.map((r) =>
														r.id === row.id
															? { ...r, label: e.target.value }
															: r,
														),
												)
											}
										/>
										<button
											type="button"
											className="text-[10px] text-zinc-400 hover:text-red-500"
											onClick={() =>
												setIncomeRows((prev) =>
													prev.filter((r) => r.id !== row.id),
												)
											}
										>
											x
										</button>
									</div>
									<input
										className={`${inputClass} no-spin`}
										type="number"
										placeholder="0.00"
										value={row.planned}
										onChange={(e) =>
											setIncomeRows((prev) =>
												prev.map((r) =>
													r.id === row.id
														? { ...r, planned: e.target.value }
														: r,
													),
											)
										}
									/>
									<input
										className={`${inputClass} no-spin`}
										type="number"
										placeholder="0.00"
										value={row.actual}
										onChange={(e) =>
											setIncomeRows((prev) =>
												prev.map((r) =>
													r.id === row.id
														? { ...r, actual: e.target.value }
														: r,
													),
											)
										}
									/>
								</div>
							))}

							<div className="mt-2 flex justify-between">
								<button
									type="button"
									className="text-xs font-medium text-blue-600 hover:text-blue-700"
									onClick={() =>
										setIncomeRows((prev) => {
											const nextId = prev.length
												? Math.max(...prev.map((r) => r.id)) + 1
												: 1;
											return [
												...prev,
												{ id: nextId, label: "New income", planned: "", actual: "" },
											];
										})
									}
								>
									+ Add row
								</button>
							</div>
						</section>

						<footer className="mt-3 border-t pt-3">
							<div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 text-xs font-medium text-zinc-700">
								<div>Total</div>
								<div className="text-right text-zinc-900">
									{incomeTotalPlanned.toFixed(2)}
								</div>
								<div className="text-right text-zinc-900">
									{incomeTotalActual.toFixed(2)}
								</div>
							</div>
						</footer>
					</div>
				</div>

				{/* Spending Limits chart row */}
				<section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
					<header className="mb-4 flex items-baseline justify-between gap-2">
						<h2 className="text-sm font-semibold tracking-tight text-zinc-900">
							Spending Limits
						</h2>
					</header>

					<div className="space-y-3">
						{expenseRows.length === 0 && (
							<p className="text-xs text-zinc-400">No expense categories yet</p>
						)}

						{expenseRows.map((row) => {
							const planned = row.planned ? Math.max(0, Number(row.planned)) : 0;
							const actual = row.actual ? Math.max(0, Number(row.actual)) : 0;
							const plannedPct = (planned / maxExpenseValue) * 100;
							const actualPct = (actual / maxExpenseValue) * 100;
							const isOver = actual > planned;

							return (
								<div key={`limits-${row.id}`} className="space-y-1">
									<div className="flex items-baseline justify-between gap-2 text-xs">
										<span className="truncate text-zinc-700">
											{row.label || "(no label)"}
										</span>
										<div className="flex items-baseline gap-3 tabular-nums text-[11px] text-zinc-500">
											<span>Planned {planned.toFixed(2)}</span>
											<span>Actual {actual.toFixed(2)}</span>
										</div>
									</div>

									<div className="relative h-5 rounded-full bg-zinc-100">
										{/* Planned marker (line) */}
										<div
											className="absolute inset-y-1 mx-px w-px rounded-full bg-zinc-500"
											style={{ left: `${plannedPct}%` }}
										/>
										{/* Actual bar */}
										<div
											className={`absolute inset-y-1 rounded-full ${
												isOver ? "bg-red-500" : "bg-emerald-500"
											}`}
											style={{ width: `${actualPct}%` }}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			</div>
		</main>
	);
}
