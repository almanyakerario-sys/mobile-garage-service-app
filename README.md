# ALMECH

A responsive single-page landing website for ALMECH, a mobile mechanic service. The page includes service information, how-it-works steps, FAQs, location controls, booking request demo, and an admin sign-in placeholder.

## Preview locally

Open `index.html` in a browser, or start a local static server from the project directory:

```sh
python -m http.server 8000
```

Then visit http://localhost:8000.

## Current limitations

- Booking requests are saved only in the current browser's local storage. They are **not sent to ALMECH**. Connect a backend or form provider before accepting real customer bookings.
- Admin sign-in is a visual placeholder and does not authenticate users. Do not enter real credentials.
- The current service grid highlights the first nine services; add the remaining service cards to `index.html` as needed.
- The website is static and can be deployed with GitHub Pages, Netlify, or another static host.
