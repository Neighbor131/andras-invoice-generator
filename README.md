# Andras Invoice Generator

Andras is a browser-based invoice generator for freelancers and small businesses.

## What it does

- Guided business setup
- Country-aware invoice numbers and currency defaults
- Manual client entry
- Invoice style accents
- Payment detail fields for bank transfer/IBAN/routing details
- PDF invoice export

## Privacy model

This MVP works as a browser workspace: invoice data is saved on the user's device and PDF generation happens locally in the browser. No email provider or backend account flow is required.

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
