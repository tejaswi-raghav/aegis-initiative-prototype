const roles = {
  vanguard: {
    name: 'Vanguard',
    callsigns: ['Northstar', 'Axiom', 'Vector', 'Halcyon'],
    bio: 'Selected for instinctive leadership and an uncommon ability to find a path through impossible conditions. Your field record begins where conventional rescue ends.',
    quote: 'When the horizon broke, everyone looked for an exit. You looked for the people who still needed one.',
    mission: 'A chain reaction beneath Meridian City is collapsing its power grid. You will lead the extraction corridor while Unit 07 stabilizes the core.'
  },
  spectral: {
    name: 'Spectral',
    callsigns: ['Lumen', 'Cipher', 'Parallax', 'Signal'],
    bio: 'Your ability to recognize patterns inside noise marked you for Spectral Division. You see the threat before it knows it has been seen.',
    quote: 'The loudest signal in the room is rarely the truth. You were the one person who listened past it.',
    mission: 'An unknown transmission is rewriting the city’s autonomous network. Trace its origin before the signal reaches the defense grid.'
  },
  forge: {
    name: 'Forge',
    callsigns: ['Arc', 'Keystone', 'Foundry', 'Helix'],
    bio: 'A builder under pressure, you turn unfinished systems into impossible solutions. Forge Division has cleared you for experimental field technology.',
    quote: 'Others saw a machine that had failed. You saw the one component it had always been missing.',
    mission: 'The prototype Meridian shield has six minutes of power remaining. Rebuild its failing heart while Unit 07 holds the perimeter.'
  }
};

const form = document.querySelector('#identityForm');
const photoInput = document.querySelector('#photoInput');
const uploadZone = document.querySelector('#uploadZone');
const uploadPreview = document.querySelector('#uploadPreview');
const uploadHint = document.querySelector('#uploadHint');
const story = document.querySelector('#story');
const intake = document.querySelector('#intake');
const formStatus = document.querySelector('#formStatus');
const heroImage = document.querySelector('#heroImage');
let currentImage = '';
let currentIdentity = null;

function safeFile(file) {
  return file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 10 * 1024 * 1024;
}

function loadPhoto(file) {
  if (!safeFile(file)) {
    formStatus.textContent = 'Choose a JPG, PNG or WebP image under 10 MB.';
    return;
  }
  if (currentImage) URL.revokeObjectURL(currentImage);
  currentImage = URL.createObjectURL(file);
  uploadPreview.style.backgroundImage = `url("${currentImage}")`;
  uploadPreview.classList.add('has-image');
  uploadHint.textContent = file.name;
  formStatus.textContent = '';
}

document.querySelector('#choosePhoto').addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', () => loadPhoto(photoInput.files[0]));

['dragenter', 'dragover'].forEach(type => uploadZone.addEventListener(type, event => {
  event.preventDefault();
  uploadZone.classList.add('is-dragging');
}));
['dragleave', 'drop'].forEach(type => uploadZone.addEventListener(type, event => {
  event.preventDefault();
  uploadZone.classList.remove('is-dragging');
}));
uploadZone.addEventListener('drop', event => {
  const file = event.dataTransfer.files[0];
  if (safeFile(file)) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    photoInput.files = transfer.files;
  }
  loadPhoto(file);
});

function chooseCallsign(name, role) {
  const seed = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  const list = roles[role].callsigns;
  return list[seed % list.length];
}

function applyIdentity({ name, callsign, role }) {
  const profile = roles[role];
  document.querySelectorAll('[data-person-name]').forEach(node => { node.textContent = name; });
  document.querySelectorAll('[data-callsign]').forEach(node => { node.textContent = callsign; });
  document.querySelectorAll('[data-role-name]').forEach(node => { node.textContent = profile.name; });
  document.querySelector('[data-bio]').textContent = profile.bio;
  document.querySelector('[data-quote]').textContent = `“${profile.quote}”`;
  document.querySelector('[data-mission]').textContent = profile.mission;
  document.querySelectorAll('.person-photo').forEach(image => { image.src = currentImage; });
  document.querySelector('#certificateDate').textContent = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date());
}

function generateIdentity(input) {
  const name = String(input.name || '').trim().slice(0, 42);
  const role = roles[input.role] ? input.role : 'vanguard';
  const callsign = String(input.callsign || '').trim().slice(0, 22) || chooseCallsign(name, role);
  if (!name) throw new Error('Enter your name to continue.');
  if (!currentImage) throw new Error('Add a portrait to continue.');
  if (!document.querySelector('#consentInput').checked && !input.skipConsent) throw new Error('Confirm the photo consent statement to continue.');
  currentIdentity = { name, callsign, role };
  applyIdentity(currentIdentity);
  story.classList.add('is-visible');
  story.setAttribute('aria-hidden', 'false');
  localStorage.setItem('aegis-profile', JSON.stringify(currentIdentity));
  requestAnimationFrame(() => document.querySelector('#hero').scrollIntoView({ behavior: 'smooth' }));
  return currentIdentity;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  formStatus.textContent = 'Decrypting personnel file…';
  const data = new FormData(form);
  window.setTimeout(() => {
    try {
      generateIdentity({ name: data.get('name'), callsign: data.get('callsign'), role: data.get('role') });
      formStatus.textContent = '';
    } catch (error) {
      formStatus.textContent = error.message;
    }
  }, 420);
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
}, { threshold: .18 });
document.querySelectorAll('.reveal-section').forEach(section => observer.observe(section));

window.addEventListener('scroll', () => {
  if (!story.classList.contains('is-visible') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.querySelector('#hero');
  const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / hero.offsetHeight));
  heroImage.style.transform = `scale(${1.1 + progress * .09}) translate3d(${progress * -3}%, ${progress * 2}%, 0)`;
}, { passive: true });

function resetExperience() {
  story.classList.remove('is-visible');
  story.setAttribute('aria-hidden', 'true');
  form.reset();
  uploadPreview.classList.remove('has-image');
  uploadPreview.style.backgroundImage = '';
  uploadHint.textContent = 'Drop a clear photo here or choose a file';
  if (currentImage) URL.revokeObjectURL(currentImage);
  currentImage = '';
  currentIdentity = null;
  localStorage.removeItem('aegis-profile');
  intake.scrollIntoView({ behavior: 'smooth' });
}
document.querySelector('#resetButton').addEventListener('click', resetExperience);
document.querySelector('#restartButton').addEventListener('click', resetExperience);

function drawCertificate() {
  if (!currentIdentity) return;
  const canvas = document.createElement('canvas');
  canvas.width = 1800;
  canvas.height = 1260;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e5e2d8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#344d54';
  ctx.lineWidth = 3;
  ctx.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);
  ctx.strokeRect(58, 58, canvas.width - 116, canvas.height - 116);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(20,50,60,.05)';
  ctx.font = '700 680px Arial';
  ctx.fillText('A', 900, 820);
  ctx.fillStyle = '#17313a';
  ctx.font = '600 25px monospace';
  ctx.letterSpacing = '6px';
  ctx.fillText('THE AEGIS INITIATIVE  ·  PERSONNEL APPOINTMENT', 900, 135);
  ctx.font = '28px Georgia';
  ctx.fillStyle = '#526167';
  ctx.fillText('This certifies that', 900, 360);
  ctx.fillStyle = '#111d22';
  ctx.font = '76px Georgia';
  ctx.fillText(currentIdentity.name, 900, 470);
  ctx.fillStyle = '#526167';
  ctx.font = '28px Georgia';
  ctx.fillText('has been appointed to the', 900, 555);
  ctx.fillStyle = '#17313a';
  ctx.font = '600 31px monospace';
  ctx.fillText(`${roles[currentIdentity.role].name.toUpperCase()} DIVISION`, 900, 635);
  ctx.fillStyle = '#526167';
  ctx.font = '25px Georgia';
  ctx.fillText('For exceptional judgment under pressure and service beyond the expected limits of duty.', 900, 740);
  ctx.strokeStyle = '#667b82';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(400, 980); ctx.lineTo(760, 980); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1040, 980); ctx.lineTo(1400, 980); ctx.stroke();
  ctx.fillStyle = '#17272d';
  ctx.font = 'italic 30px Georgia';
  ctx.fillText('Elian Voss', 580, 1025);
  ctx.font = '23px monospace';
  ctx.fillText(document.querySelector('#certificateDate').textContent, 1220, 1025);
  ctx.fillStyle = '#607177';
  ctx.font = '17px monospace';
  ctx.fillText('EXECUTIVE DIRECTOR', 580, 1065);
  ctx.fillText('DATE OF APPOINTMENT', 1220, 1065);
  const link = document.createElement('a');
  link.download = `${currentIdentity.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-aegis-certificate.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
document.querySelector('#downloadCertificate').addEventListener('click', drawCertificate);

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  try {
    context.registerTool({
      name: 'stage_aegis_identity',
      title: 'Stage Aegis identity',
      description: 'Fill the visible identity form with a name, optional callsign, and selected division. A portrait and consent must still be provided by the visitor.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 42 },
          callsign: { type: 'string', maxLength: 22 },
          role: { type: 'string', enum: ['vanguard', 'spectral', 'forge'] }
        },
        required: ['name', 'role'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input.name !== 'string' || !roles[input.role]) throw new Error('A valid name and division are required.');
        document.querySelector('#nameInput').value = input.name.slice(0, 42);
        document.querySelector('#callsignInput').value = String(input.callsign || '').slice(0, 22);
        document.querySelector(`input[name="role"][value="${input.role}"]`).checked = true;
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return { status: 'staged', name: input.name.slice(0, 42), role: input.role, next: 'Visitor must add their own portrait and confirm consent.' };
      }
    });
  } catch (_) { /* Experimental API: the visible experience remains fully functional. */ }
}
registerWebMCP();
