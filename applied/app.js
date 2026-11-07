// Session and Data State Variables
let currentUser = sessionStorage.getItem('currentUser') || null;
let applications = [];

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const appContent = document.getElementById('app-content');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const currentUserDisplay = document.getElementById('current-user-display');

const appForm = document.getElementById('app-form');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const filterSelect = document.getElementById('filter');
const container = document.getElementById('applications-container');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statOpen = document.getElementById('stat-open');
const statInterview = document.getElementById('stat-interview');
const statClosing = document.getElementById('stat-closing');

// Check Session on Initial Load
if (currentUser) {
    loadUserWorkspace(currentUser);
}

// User Authentication Events
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim().toLowerCase();
    if (!username) {
        alert('Please enter a username to log in.');
        return;
    }
    sessionStorage.setItem('currentUser', username);
    currentUser = username;
    loadUserWorkspace(username);
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    applications = [];
    authScreen.style.display = 'block';
    appContent.style.display = 'none';
    usernameInput.value = '';
});

function loadUserWorkspace(username) {
    currentUserDisplay.textContent = username;
    authScreen.style.display = 'none';
    appContent.style.display = 'block';
    
    // Load local data specific only to this username
    applications = JSON.parse(localStorage.getItem(`apps_${username}`)) || [];
    renderApplications();
}

// Filter Options Event
filterSelect.addEventListener('change', () => {
    renderApplications();
});

// Save Application Functionality
saveBtn.addEventListener('click', () => {
    const jobTitle = document.getElementById('job-title').value.trim();
    const employer = document.getElementById('employer').value.trim();
    const deadline = document.getElementById('deadline').value;
    const status = document.getElementById('status').value;
    const jobLink = document.getElementById('job-link').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!jobTitle || !employer) {
        alert('Job title and Employer fields are required.');
        return;
    }

    // Capture documents checked
    const checkedDocs = [];
    document.querySelectorAll('.doc-checkbox:checked').forEach(cb => {
        checkedDocs.push(cb.value);
    });

    const newApp = {
        id: Date.now(),
        jobTitle,
        employer,
        deadline,
        status,
        jobLink,
        documents: checkedDocs,
        notes
    };

    applications.push(newApp);
    saveDataToLocalStorage();
    renderApplications();
    
    // Reset Form Fields
    appForm.reset();
});

// Clear Data Functionality
deleteBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all your application data?')) {
        applications = [];
        saveDataToLocalStorage();
        renderApplications();
    }
});

function saveDataToLocalStorage() {
    if (currentUser) {
        localStorage.setItem(`apps_${currentUser}`, JSON.stringify(applications));
    }
}

function renderApplications() {
    const activeFilter = filterSelect.value;
    container.innerHTML = '';

    // Filter Logic
    const filteredApps = applications.filter(app => {
        if (activeFilter === 'all') return true;
        return app.status === activeFilter;
    });

    // Update Top Overview Dashboard Figures
    updateDashboardStats();

    if (filteredApps.length === 0) {
        container.innerHTML = '<p class="no-apps">No matches found for this status view.</p>';
        return;
    }

    // Build Cards Layout
    filteredApps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'application-card';
        
        let docsHtml = app.documents.length > 0 
            ? app.documents.map(d => `<span class="tag tag-doc">${d}</span>`).join(' ')
            : '<span class="tag tag-none">No documents listed</span>';

        card.innerHTML = `
            <div class="card-main">
                <div class="card-meta">
                    <h3>${app.jobTitle}</h3>
                    <p class="company">${app.employer}</p>
                </div>
                <div class="card-status-pill ${app.status.toLowerCase()}">${app.status}</div>
            </div>
            <div class="card-details">
                <p><strong>Deadline:</strong> ${app.deadline ? app.deadline : 'None set'}</p>
                ${app.jobLink ? `<p><strong>Link:</strong> <a href="${app.jobLink}" target="_blank">View Posting</a></p>` : ''}
                <p class="doc-section"><strong>Materials:</strong> ${docsHtml}</p>
                ${app.notes ? `<p class="notes-block"><strong>Notes:</strong> ${app.notes}</p>` : ''}
            </div>
            <button class="delete-single-btn" onclick="deleteSingleApplication(${app.id})">Remove</button>
        `;
        container.appendChild(card);
    });
}

function deleteSingleApplication(id) {
    applications = applications.filter(app => app.id !== id);
    saveDataToLocalStorage();
    renderApplications();
}

function updateDashboardStats() {
    statTotal.textContent = applications.length;
    
    const openApps = applications.filter(app => app.status !== 'Rejected' && app.status !== 'Offer');
    statOpen.textContent = openApps.length;

    const interviewApps = applications.filter(app => app.status === 'Interview');
    statInterview.textContent = interviewApps.length;

    // Calculate deadlines upcoming inside next 7 days
    let closingSoonCount = 0;
    const today = new Date();
    const targetLimit = new Date();
    targetLimit.setDate(today.getDate() + 7);

    applications.forEach(app => {
        if (app.deadline) {
            const appDate = new Date(app.deadline);
            if (appDate >= today && appDate <= targetLimit && app.status !== 'Rejected') {
                closingSoonCount++;
            }
        }
    });
    statClosing.textContent = closingSoonCount;
}
