type Expense = {
  id: string;
  user: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
};

const expenses = new Map<string, Expense>();

export const ExpenseRepository = {
  create(expense: Expense) {
    expenses.set(expense.id, expense);
    return expense;
  },
  updateStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    const expense = expenses.get(id);
    if (expense) {
      expense.status = status;
      expenses.set(id, expense);
    }
    return expense;
  },
  get(id: string) {
    return expenses.get(id);
  },
  list() {
    return Array.from(expenses.values());
  }
}; 