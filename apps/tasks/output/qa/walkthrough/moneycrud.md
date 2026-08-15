# moneycrud — CDP walkthrough

## 1. Initial (list) screen AX
      [RootWebArea] Generated app
      [button] New LineItem
      [heading] Line Items
      [group] 
      [StaticText] New LineItem
      [StaticText] Line Items
      [InlineTextBox] New 
      [InlineTextBox] LineItem
      [InlineTextBox] Line Items
      [button] Sample LineItem S Sample LineItem 0.00 SAR
      [button] Sample LineItem 1 S Sample LineItem 1 150.00 SAR
      [button] Sample LineItem 2 S Sample LineItem 2 250.00 SAR
      [StaticText] Sample LineItem S Sample LineItem 0.00 SAR
      [StaticText] Sample LineItem 1 S Sample LineItem 1 150.00 SAR
      [StaticText] Sample LineItem 2 S Sample LineItem 2 250.00 SAR
      [InlineTextBox] Sample LineItem S Sample LineItem 0.00 SAR
      [InlineTextBox] Sample LineItem 1 S Sample LineItem 1 150.00 SAR
      [InlineTextBox] Sample LineItem 2 S Sample LineItem 2 250.00 SAR

**Buttons:** New LineItem, Sample LineItem S Sample LineItem 0.00 SAR, Sample LineItem 1 S Sample LineItem 1 150.00 SAR, Sample LineItem 2 S Sample LineItem 2 250.00 SAR

## 2. Detail screen AX (after tapping first row)
      [RootWebArea] Generated app
      [button] Back
      [heading] New LineItem
      [group] 
      [StaticText] Back
      [StaticText] New LineItem
      [button] Create
      [InlineTextBox] Back
      [InlineTextBox] New LineItem
      [textbox] Amount
      [textbox] Title
      [button] Create
      [StaticText] Create
      [InlineTextBox] Create

## 3. Create form — fields (AX)
      [RootWebArea] Generated app
      [button] Back
      [heading] New LineItem
      [group] 
      [StaticText] Back
      [StaticText] New LineItem
      [button] Create
      [InlineTextBox] Back
      [InlineTextBox] New LineItem
      [textbox] Amount
      [textbox] Title
      [button] Create
      [StaticText] Create
      [InlineTextBox] Create

**DOM inputs on form:**
text Amount
text Title

## 4. Field-visibility audit (owner's logical-problem check)
Entity `LineItem` fields: id, amount, title
  - `id`: NOT SEEN
  - `amount`: FORM+DISPLAY
  - `title`: FORM+DISPLAY

## 5. Console/errors
  none
