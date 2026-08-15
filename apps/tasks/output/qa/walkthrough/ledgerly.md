# ledgerly — CDP walkthrough

## 1. Initial (list) screen AX
      [RootWebArea] Generated app
      [heading] Users
      [group] 
      [StaticText] Users
      [InlineTextBox] Users
      [button] Sample User S Sample User employee
      [button] Sample User 1 S Sample User 1 employee
      [button] Sample User 2 S Sample User 2 employee
      [StaticText] Sample User S Sample User employee
      [StaticText] Sample User 1 S Sample User 1 employee
      [StaticText] Sample User 2 S Sample User 2 employee
      [InlineTextBox] Sample User S Sample User employee
      [InlineTextBox] Sample User 1 S Sample User 1 employee
      [InlineTextBox] Sample User 2 S Sample User 2 employee

**Buttons:** Sample User S Sample User employee, Sample User 1 S Sample User 1 employee, Sample User 2 S Sample User 2 employee

## 2. Detail screen AX (after tapping first row)
      [RootWebArea] Generated app
      [button] Home
      [button] Back
      [heading] Page Not Found
      [textbox] 
      [StaticText] Home
      [StaticText] Back
      [StaticText] Page Not Found
      [InlineTextBox] Home
      [InlineTextBox] Back
      [InlineTextBox] Page Not Found

## 4. Field-visibility audit (owner's logical-problem check)
Entity `ExpenseClaim` fields: id, name, amount, status
  - `id`: NOT SEEN
  - `name`: NOT SEEN
  - `amount`: NOT SEEN
  - `status`: NOT SEEN

## 5. Console/errors
  none
