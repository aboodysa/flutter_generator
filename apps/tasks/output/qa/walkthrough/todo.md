# todo — CDP walkthrough

## 1. Initial (list) screen AX
      [RootWebArea] Generated app
      [button] New Task
      [heading] Tasks
      [group] 
      [StaticText] New Task
      [StaticText] Tasks
      [InlineTextBox] New 
      [InlineTextBox] Task
      [InlineTextBox] Tasks
      [button] low Sample Task 2024-01-01 · low
      [button] low Sample Task 1 2025-01-01 · low
      [button] low Sample Task 2 2025-01-01 · low
      [StaticText] low Sample Task 2024-01-01 · low
      [StaticText] low Sample Task 1 2025-01-01 · low
      [StaticText] low Sample Task 2 2025-01-01 · low
      [InlineTextBox] low Sample Task 2024-01-01 · low
      [InlineTextBox] low Sample Task 1 2025-01-01 · low
      [InlineTextBox] low Sample Task 2 2025-01-01 · low

**Buttons:** New Task, low Sample Task 2024-01-01 · low, low Sample Task 1 2025-01-01 · low, low Sample Task 2 2025-01-01 · low

## 2. Detail screen AX (after tapping first row)
      [RootWebArea] Generated app
      [button] Back
      [heading] New Task
      [group] 
      [StaticText] Back
      [StaticText] New Task
      [button] Create
      [InlineTextBox] Back
      [InlineTextBox] New Task
      [textbox] Title
      [textbox] Description
      [textbox] Due Date
      [checkbox] low
      [checkbox] medium
      [checkbox] high
      [checkbox] Is Done
      [button] Create
      [StaticText] Create
      [InlineTextBox] Create

## 3. Create form — fields (AX)
      [RootWebArea] Generated app
      [button] Back
      [heading] New Task
      [group] 
      [StaticText] Back
      [StaticText] New Task
      [button] Create
      [InlineTextBox] Back
      [InlineTextBox] New Task
      [textbox] Title
      [textbox] Description
      [textbox] Due Date
      [checkbox] low
      [checkbox] medium
      [checkbox] high
      [checkbox] Is Done
      [button] Create
      [StaticText] Create
      [InlineTextBox] Create

**DOM inputs on form:**
text Title
text Description
text Due Date

## 4. Field-visibility audit (owner's logical-problem check)
Entity `Task` fields: id, title, description, dueDate, priority, isDone
  - `id`: NOT SEEN
  - `title`: FORM+DISPLAY
  - `description`: FORM+DISPLAY
  - `dueDate`: NOT SEEN
  - `priority`: NOT SEEN
  - `isDone`: NOT SEEN

## 5. Console/errors
  none
