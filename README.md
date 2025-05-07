# TI‑Basic App Composer

*A drag‑and‑drop React web-application for assembling multi‑module TI‑Basic programs for TI‑84 Plus & family graphing calculators.*

![](examples/Screenshot%202025-05-07%20045711.png)

---

## Features

This application attempts to simplify the process of creating/managing common recurring TI-Basic code structures, such as menus and notes, to create frameworks for more complex calculator programs!

The website is composed of four main panels:
- **App Structure**: Provides a tree view of the program’s menu structure.
  - Add, remove, and reorder items.
  - Drag and drop to nest items.
  - Auto‑inserts *Back* and *Quit* items.
  - Automatically caps menu items to 8 entries (configurable).
- **Editor**: A text editor for writing notes and code blocks.
  - Allows direct editing of notes and code content
  - Automatically wraps displayed text to fit the calculator screen.
  - Adds `Pause` commands to break up long notes.
  - Detects and warns about bad tokens within Note/Code content.
- **Calculator Preview**: A simulated TI‑84 screen that visualizes the selected **menu** and **note**.
  - Generated from the TI-Basic code commands, so it stays true to the calculator’s display.
  - Intuitive visualizations for pauses and clear-screens
  - Supports real-time updates as you edit.
- **Generated TI-Basic Code**: Displays the generated TI-Basic code for the entire program.
  - Code is valid copy-pasted directly into TI Connect CE.
  - Allows imports and exports of TI-Basic code into the app for full-state recovery.

---

## Installation

```bash
git clone https://github.com/jakedog228/tibasic‑app-composer.git
cd tibasic‑app-composer
npm start
# then open http://localhost:3000
```

---

## Workflow

### 1. Build the App Structure

Create a hierarchical menu system, keeping in mind TI‑Basic menus only support **9 items** on‑screen (entries + Back/Quit). 
All items are inserted within a **Menu** node by clicking on their respective icons. We have:

| Icon  | Name        | Description                                                                  |
|-------| ----------- |------------------------------------------------------------------------------|
| `📁+` | **Menu**    | A navigation window with sub-elements                                        |
| `📝+` | **Note**    | A script which displays raw text with no extra logic                         |
| `💻+` | **Code**    | An element that executes any provided TI-Basic code in the program's context |
| `🗑️` | **Delete**  | Removes the selected item from the tree                                      |

### 2. Edit Element Content

- **Menus**: The only option is to rename the menu. This changes how it appears in its parent menu.
- **Notes**: Rename the note and include any length of text to display within the note. Newlines are handled:
  - *Single* line‑breaks cause the text to wrap.
  - *Double* line‑breaks insert a `Pause`.
  - *Triple* line‑breaks `Pause` **and** `ClrHome` to clear the screen.
- **Code blocks**: raw TI‑Basic injected verbatim. Lines starting without `:` are auto‑prefixed. The parent menu is returned to if the code block finishes.

### 3. Save Regularly

Click **Export** to save your Generated TI-Basic Code, which you can Import later to continue working from the same spot. 

WARNING: The app attempts to re-inflate the tree structure based on the known token format, but can fail if the TI-Basic code is tampered with, or in some cases with very bizarre Code blocks.
This application does not auto-save your work.

### 4. [Deploy to Calculator](https://education.ti.com/en/customer-support/knowledge-base/sofware-apps/product-usage/11492)

Once you are happy with the program, click **Export** to copy the generated TI-Basic code to your clipboard. You can then paste it into TI Connect CE or TI‑Basic Studio to send it to your calculator.

A rough example with **TI Connect CE**:
![](examples/Screenshot%202025-05-07%20182554.png)
1. Enter program editor workspace
2. Change program name (how it will appear under `prgm` on the calculator)
3. Paste in the TI-Basic code
4. Click **Send to TI Device**
5. Select your calculator (make sure it's connected to your computer and turned on)
6. Click **Send** to send the program to your calculator

---

## Examples

### Interactive Text-based RPG ([code](examples/the-room.txt))
![](examples/Screenshot%202025-05-07%20050016.png)
- Uses a nested menu system to simulate navigation between rooms.
- Code blocks are used to track and update the player’s inventory and overall game state.
- TI-Basic's diverse [set of commands](http://tibasicdev.wikidot.com/command-index) are used in various ways to create narrative effects, e.g. the `Goto` command within code blocks is used to create infinite looping rooms.
- Notes are used to create set pieces and flavor text, which are displayed when the player interacts with them.

### Randomized Flashcards ([code](examples/derivative-flashcards.txt))
![](examples/Screenshot%202025-05-07%20162829.png)
- A simple program that selects a flashcard at random from a list of notes using a single code block!
- Uses `randInt` to select a random note, and `Goto` to display it.
- Compartmentalizes the notes in a menu structure, allowing for easy extensibility (e.g. nest the menus!).

---

## Advanced

### Token Validation

A bundled **Tokens.xml** (by Shaun McFall from [CEMETECH's IDE](https://www.cemetech.net/sc/xml/Tokens.xml)) lists every canonical & alt token. While you type, the webapp scans for unrecognized tokens and flags them in *red*.

### Understanding Line‑Break Analysis

For long notes the editor hints when:

- Text **wraps** past `chars_per_line`
- A `Pause` is auto‑inserted after exceeding `lines_per_screen`.

These appear as info bubbles in the editor, to let you know that the final calculator screen may show something different from expected:


### Configurable Settings

The following settings can be found and modified under the header (UI label *Settings*):

| Name                 | Default | Meaning                                         |
| -------------------- | ------- | ----------------------------------------------- |
| `chars_per_line`     | 26      | Horizontal wrap width                           |
| `lines_per_screen`   | 9       | Vertical lines before an auto‑pause             |
| `max_items_per_menu` | 8       | Child items allowed before *Back/Quit* overflow |

> **Tip:** Defaults were set for the TI-84 Plus CE, lower these to target monochrome models (e.g. TI‑83+) with smaller screens.
