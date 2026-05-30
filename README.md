# Andras Invoice Generator

Andras is a browser-based invoice generator for freelancers and small businesses.

## What it does

- Guided business setup
- Country-aware invoice numbers and currency defaults
- Client selection and manual client entry
- Invoice style accents
- Payment detail fields for bank transfer/IBAN/routing details
- PDF invoice export
- Send-flow prototype and invoice tracking states

## Privacy model

This MVP runs entirely in the browser. Invoice data is not sent to a server or stored by this repository. PDF generation happens locally in the user's browser.

## Hosting on Cloudflare Pages

Use these settings:

```text
Framework preset: None
Build command: leave empty
Output directory: /
```

After deployment, Cloudflare will provide a public URL like:

```text
https://andras-invoice-generator.pages.dev
```

## Local preview

Run a static server from the project folder:

```bash
python3 -m http.server 8074
```

Then open:

```text
http://127.0.0.1:8074/
```
