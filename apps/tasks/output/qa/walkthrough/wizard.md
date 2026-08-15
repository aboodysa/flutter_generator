# wizard — CDP walkthrough

## 1. Initial (list) screen AX
      [RootWebArea] Generated app
      [progressbar] 33
      [button] Next
      [heading] Signups
      [StaticText] What's your name?
      [textbox] Name
      [button] Next
      [StaticText] Signups
      [InlineTextBox] What's your name?
      [StaticText] Next
      [InlineTextBox] Signups
      [InlineTextBox] Next

**Buttons:** Next, Next
**Search/text inputs on list:** Name

## 3. Create form — NO 'New' button found (list-only or placeholder screen)

## 4. Field-visibility audit (owner's logical-problem check)
Entity `Signup` fields: id, name, email
  - `id`: NOT SEEN
  - `name`: FORM+DISPLAY
  - `email`: NOT SEEN

## 5. Console/errors
  none
