# Minesweeper

A dependency-free Minesweeper game using HTML, CSS and vanilla JavaScript.

- **Always medium:** 16 × 16 board, 40 mines (no difficulty selector).
- First reveal protects the clicked tile and its 8 neighboring tiles.
- Timer begins with your first reveal and stops when you win or lose.
- Personal best is saved in browser `localStorage` and shown at the top. It is per browser/device, not shared between devices.
- Left click/tap to reveal; right click/long press to flag; optional Flag mode for touchscreen play.
- Click a revealed number when it has the right number of adjacent flags to open its surrounding squares.
- New game restarts the board and timer without deleting your best.

## Play

Once GitHub Pages is enabled with **Settings → Pages → Source → GitHub Actions**, the `main` branch is deployed automatically to:

https://jonatannorrby.github.io/minesweeper/

## Development

No build tools required. Serve the repository with a static web server (ES modules should not be loaded directly from a `file://` URL).

Run game-rule tests with Node 22+:

```sh
node --test tests/*.test.mjs
```

The GitHub Actions workflow runs tests before deploying the static site.
