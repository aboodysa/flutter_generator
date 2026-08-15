# expense.semantic — CDP walkthrough

## 1. Initial (list) screen AX
      [RootWebArea] Generated app
      [button] New Transaction
      [heading] Transactions
      [group] 
      [StaticText] New Transaction
      [StaticText] Transactions
      [InlineTextBox] New 
      [InlineTextBox] Transaction
      [InlineTextBox] Transactions
      [button] Untitled U Untitled 0.00 · 2024-01-01
      [button] Sample Transaction 1 S Sample Transaction 1 150.00 · 20
      [button] Sample Transaction 2 S Sample Transaction 2 250.00 · 20
      [button] Delete
      [button] Delete
      [button] Delete
      [StaticText] Delete
      [StaticText] Delete
      [StaticText] Delete
      [InlineTextBox] Delete
      [InlineTextBox] Delete
      [InlineTextBox] Delete

**Buttons:** New Transaction, Untitled U Untitled 0.00 · 2024-01-01, Sample Transaction 1 S Sample Transaction 1 150.00 · 2025-01-01, Sample Transaction 2 S Sample Transaction 2 250.00 · 2025-01-01, Delete, Delete, Delete

## 2. Detail screen AX (after tapping first row)
      [RootWebArea] Generated app
      [button] Back
      [heading] Edit Transaction
      [group] 
      [StaticText] Back
      [StaticText] Edit Transaction
      [button] cash
      [button] Save
      [InlineTextBox] Back
      [InlineTextBox] Edit Transaction
      [textbox] Amount
      [textbox] Date
      [textbox] Merchant
      [StaticText] cash
      [textbox] Note
      [button] Save
      [InlineTextBox] cash
      [StaticText] Save
      [InlineTextBox] Save

## 3. Create form — NO 'New' button found (list-only or placeholder screen)

## 4. Field-visibility audit (owner's logical-problem check)
Entity `Transaction` fields: id, amount, date, merchant, category, paymentMethod, note, items, attachments
  - `id`: NOT SEEN
  - `amount`: FORM+DISPLAY
  - `date`: FORM+DISPLAY
  - `merchant`: FORM+DISPLAY
  - `category`: NOT SEEN
  - `paymentMethod`: NOT SEEN
  - `note`: FORM+DISPLAY
  - `items`: NOT SEEN
  - `attachments`: NOT SEEN

## 5. Console/errors
  none
