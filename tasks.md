Task ID: T-0005
Title: Modify Caption Display (Single Horizontal Line)
Status: IN-PROGRESS
Owner: Miles
Related repo or service: zoom-clone
Branch: main
Created: 2025-12-31 09:30
Last updated: 2025-12-31 09:30

START LOG (fill this before you start coding)

Timestamp: 2025-12-31 09:30
Current behavior or state:
- Captions are displayed as a vertical stack of up to 3 items.

Plan and scope for this task:
- Show only the latest caption.
- Ensure the display is a single horizontal line that doesn't increase in height (truncate if too long).

Files or modules expected to change:
- components/translator/captions-overlay.tsx

Risks or things to watch out for:
- Truncation might make long captions hard to read; however, this matches the user's specific "single horizontal line" request.

WORK CHECKLIST

- [x] Modify CaptionsOverlay to show only latest caption
- [x] Apply CSS to prevent wrapping and height increase
- [x] Verify build and functionality

END LOG (fill this after you finish coding and testing)

Timestamp: 2025-12-31 09:35
Summary of what actually changed:
- Updated `CaptionsOverlay` to show only the single latest caption.
- Applied `truncate` and `whitespace-nowrap` logic to ensure the display stays on one line and doesn't increase in height.
- Styled the speaker name to be inline with the text.

Files actually modified:
- components/translator/captions-overlay.tsx

How it was tested:
- Ran `npm run build` successfully.

Test result:
- PASS

Known limitations or follow-up tasks:
- Very long captions will be truncated with an ellipsis.

Timestamp: 2025-12-31 17:25
Summary of what actually changed:
- Created `constants/languages.ts` with over 130 languages and regional dialects.
- Updated `TranslatorSettingsForm` to imported expanded language lists.
- Added `max-h-[60vh]` and `overflow-y-auto` to the `TranslatorModal` settings container for better scrolling.

Files actually modified:
- constants/languages.ts
- components/translator/translator-settings-form.tsx
- components/translator/translator-modal.tsx

How it was tested:
- Ran `npm run build` and achieved a successful production build.

Test result:
- PASS

Known limitations or follow-up tasks:
- None
