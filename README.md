# Andras Invoice Generator

Andras is a browser-based invoice generator for freelancers and small businesses.

## What it does

- Guided business setup
- Country-aware invoice numbers and currency defaults
- Manual client entry
- Invoice style accents
- Payment detail fields for bank transfer/IBAN/routing details
- PDF invoice export
- Optional email sending through Cloudflare Pages Functions + Brevo

## Privacy model

By default, this MVP works as a browser workspace: invoice data is saved on the user's device and PDF generation happens locally in the browser.

When email sending is configured and the user clicks **Send invoice email**, the app sends the recipient, reply-to address, message, and PDF attachment to the Cloudflare Pages Function at `/api/send-invoice`. The function forwards the email through Brevo.

## Email sending

Create a free Brevo account, activate Transactional Email, verify a sender/domain, then add these Cloudflare Pages environment variables:

```text
BREVO_API_KEY=...
FROM_EMAIL=invoices@yourdomain.com
FROM_NAME=Andras
```

The email is sent from `FROM_NAME <FROM_EMAIL>`, and replies go to the business email entered during setup.

If those variables are missing, the app keeps working and shows a configuration message while PDF download remains available.

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
