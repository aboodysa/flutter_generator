# kids_quiz CDP input-field probe (2026-08-19)

Drives every text input: focus → type → readback; and search-filter narrowing where applicable.
Note: CDP is desktop Chromium — it CANNOT reproduce iOS-Safari keyboard-opening suppression; it verifies fields are focusable/typeable/functional.

```
  ✓ searchbox:Search Questions typed 'pen' -> value='pen'
  home search filter: 0 cards visible after 'pen'
  ✓ textbox:Player Name typed 'Sara' -> value='Sara'
  wizard Next button present after typing: True
  quiz-run-list text fields: [('searchbox', 'Search Quiz Runs')]
  ✓ searchbox:Search Quiz Runs typed 'test' -> value='test'
  achievement-list text fields: [('searchbox', 'Search Achievements')]
  ✓ searchbox:Search Achievements typed 'badge' -> value='badge'
  quiz-run/new AX fields (textbox/button): ['animals', 'Create', 'Player Name', 'Create']
  ✓ textbox:Player Name typed 'Ali' -> value='Ali'
```
