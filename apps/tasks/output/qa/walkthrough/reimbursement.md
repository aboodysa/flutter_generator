# reimbursement — CDP walkthrough

## 1. Initial (list) screen AX
      [RootWebArea] Generated app
      [progressbar] 25
      [button] Category
      [button] Next
      [heading] Expense Claims
      [StaticText] Submit Expense Claim
      [textbox] Employee
      [textbox] Amount
      [StaticText] Category
      [button] Next
      [StaticText] Expense Claims
      [InlineTextBox] Submit Expense Claim
      [InlineTextBox] Category
      [StaticText] Next
      [InlineTextBox] Expense Claims
      [InlineTextBox] Next

**Buttons:** Category, Next, Next
**Search/text inputs on list:** Employee, Amount

## 3. Create form — NO 'New' button found (list-only or placeholder screen)

## 4. Field-visibility audit (owner's logical-problem check)
Entity `ExpenseClaim` fields: id, name, amount, category, managerApproved, financeApproved, status
  - `id`: NOT SEEN
  - `name`: NOT SEEN
  - `amount`: FORM+DISPLAY
  - `category`: FORM+DISPLAY
  - `managerApproved`: NOT SEEN
  - `financeApproved`: NOT SEEN
  - `status`: NOT SEEN

## 5. Console/errors
  none
