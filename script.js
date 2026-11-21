const bookingForm = document.querySelector('#bookingForm');
const formMessage = document.querySelector('#formMessage');
const preferredDate = bookingForm?.querySelector('[name="preferred_date"]');

if (preferredDate) {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  preferredDate.min = localToday;
}

function showFormMessage(message, isError = false) {
  if (!formMessage) return;
  formMessage.textContent = message;
  formMessage.classList.toggle('error', isError);
  formMessage.hidden = false;
}

bookingForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!bookingForm.reportValidity()) return;

  // Netlify processes this form on a deployed site. A local preview cannot deliver requests.
  if (['localhost', '127.0.0.1', ''].includes(window.location.hostname)) {
    showFormMessage('The booking form is ready, but requests are only delivered after this site is deployed with Netlify Forms enabled. Your details have not been sent.', true);
    return;
  }

  const submitButton = bookingForm.querySelector('[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = 'SENDING REQUEST…';

  try {
    const formData = new FormData(bookingForm);
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    });
    if (!response.ok) throw new Error('Booking submission failed');

    bookingForm.reset();
    showFormMessage('Thanks — your request has been sent. The ALMECH team will contact you to confirm availability and your appointment.');
  } catch {
    showFormMessage('We couldn’t send your request just now. Please try again or call +254 700 000 000.', true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  }
});

const useLocationButton = document.querySelector('#useLocation');
const bookingLocation = document.querySelector('#bookingLocation');
useLocationButton?.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showFormMessage('Location sharing is not available in this browser. Please enter your address or landmark.', true);
    bookingLocation?.focus();
    return;
  }

  useLocationButton.disabled = true;
  useLocationButton.textContent = 'Finding location…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (bookingLocation) {
        bookingLocation.value = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        bookingLocation.dispatchEvent(new Event('input', { bubbles: true }));
      }
      useLocationButton.disabled = false;
      useLocationButton.textContent = 'Location added';
    },
    () => {
      useLocationButton.disabled = false;
      useLocationButton.textContent = 'Use my location';
      showFormMessage('We couldn’t get your location. Please type the vehicle’s address or a nearby landmark.', true);
      bookingLocation?.focus();
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
