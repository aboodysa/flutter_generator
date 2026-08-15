# inventory — CDP walkthrough

## 1. Initial (list) screen AX
      [RootWebArea] Generated app
      [heading] Products
      [group] 
      [StaticText] Products
      [InlineTextBox] Products
      [button] inStock Sample Product 0.00 · 0
      [button] inStock Sample Product 1 150.00 · 1
      [button] inStock Sample Product 2 250.00 · 2
      [StaticText] inStock Sample Product 0.00 · 0
      [StaticText] inStock Sample Product 1 150.00 · 1
      [StaticText] inStock Sample Product 2 250.00 · 2
      [InlineTextBox] inStock Sample Product 0.00 · 0
      [InlineTextBox] inStock Sample Product 1 150.00 · 1
      [InlineTextBox] inStock Sample Product 2 250.00 · 2

**Buttons:** inStock Sample Product 0.00 · 0, inStock Sample Product 1 150.00 · 1, inStock Sample Product 2 250.00 · 2

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

## 3. Create form — NO 'New' button found (list-only or placeholder screen)

## 4. Field-visibility audit (owner's logical-problem check)
Entity `Product` fields: id, name, sku, price, quantity, unit, status, category, warehouses
  - `id`: NOT SEEN
  - `name`: NOT SEEN
  - `sku`: NOT SEEN
  - `price`: NOT SEEN
  - `quantity`: NOT SEEN
  - `unit`: NOT SEEN
  - `status`: NOT SEEN
  - `category`: NOT SEEN
  - `warehouses`: NOT SEEN

## 5. Console/errors
  none
