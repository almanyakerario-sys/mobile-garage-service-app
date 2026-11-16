const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  const button = item.querySelector('.faq-question');
  button?.addEventListener('click', () => {
    const wasOpen = item.classList.contains('active');
    faqItems.forEach((faq) => {
      faq.classList.remove('active');
      faq.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('active');
      button.setAttribute('aria-expanded', 'true');
    }
  });
  button?.setAttribute('aria-expanded', item.classList.contains('active') ? 'true' : 'false');
});

function showMessage(form, message, isError = false) {
  let status = form.querySelector('.form-message');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-message';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.append(status);
  }
  status.textContent = message;
  status.classList.toggle('error', isError);
}

const bookingForm = document.querySelector('#bookingForm');
bookingForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!bookingForm.reportValidity()) return;

  const booking = Object.fromEntries(new FormData(bookingForm).entries());
  try {
    const requests = JSON.parse(localStorage.getItem('almech-demo-requests') || '[]');
    requests.push({ ...booking, submittedAt: new Date().toISOString() });
    localStorage.setItem('almech-demo-requests', JSON.stringify(requests));
    showMessage(
      bookingForm,
      'Thanks — your request is saved on this device. This demo does not send it to Almech yet; connect a booking service to receive requests.'
    );
    bookingForm.reset();
  } catch {
    showMessage(bookingForm, 'Your request could not be saved in this browser. Please try again.', true);
  }
});

const adminForm = document.querySelector('.admin-form');
adminForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  showMessage(adminForm, 'Admin sign-in is a visual demo and is not connected to an authentication service.', true);
});

const locationButton = document.querySelector('.location-input-wrap .btn');
const locationInput = document.querySelector('#locationInput');
locationButton?.addEventListener('click', () => {
  if (!navigator.geolocation) {
    locationInput?.focus();
    return;
  }
  locationButton.textContent = 'Finding location…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (locationInput) {
        locationInput.value = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        locationInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      locationButton.textContent = 'Location added';
    },
    () => {
      locationButton.textContent = 'Use my location';
      if (locationInput) {
        locationInput.placeholder = 'Location unavailable — enter address';
        locationInput.focus();
      }
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') {
      event.preventDefault();
      return;
    }
    const target = document.querySelector(id);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
