import { ExpenseRepository } from './repository';
import { ExpenseApprovalWorkflow } from './workflow';

export const submitExpense = async (input, env) => {
  const id = crypto.randomUUID();
  const expense = {
    id,
    user: input.user,
    amount: input.amount,
    description: input.description,
    status: 'pending'
  };
  ExpenseRepository.create(expense);

  // Start workflow
  await env.EXPENSE_WORKFLOW.create({
    id,
    params: {
      expenseId: id,
      user: input.user,
      amount: input.amount,
      description: input.description
    }
  });

  return expense;
};

export const approveExpense = async (input, env) => {
  // Send approval event to workflow
  const instance = await env.EXPENSE_WORKFLOW.get(input.expenseId);
  await instance.sendEvent('approval_action', 'approve');
  ExpenseRepository.updateStatus(input.expenseId, 'approved');
  return ExpenseRepository.get(input.expenseId);
};

export const rejectExpense = async (input, env) => {
  // Send rejection event to workflow
  const instance = await env.EXPENSE_WORKFLOW.get(input.expenseId);
  await instance.sendEvent('approval_action', 'reject');
  ExpenseRepository.updateStatus(input.expenseId, 'rejected');
  return ExpenseRepository.get(input.expenseId);
};

export const listExpenses = async (_input, _env) => {
  return ExpenseRepository.list();
}; 