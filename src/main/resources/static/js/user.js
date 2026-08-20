// User Dashboard Logic (Interactive Live Demo Supported)
let currentUser = null;

const INITIAL_DEMO_COMPLAINTS = [
    { id: 101, userId: 2, userName: 'Rahul Sharma', userEmail: 'student@service.com', category: 'Internet', description: 'Wi-Fi is not working in Hostel Block B Room 304. Signal drops continuously during online classes.', priority: 'HIGH', status: 'OPEN', assignedTo: null, createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), updatedAt: new Date().toISOString() },
    { id: 102, userId: 2, userName: 'Rahul Sharma', userEmail: 'student@service.com', category: 'Electrical', description: 'Ceiling fan making loud buzzing noise and running slowly.', priority: 'MEDIUM', status: 'ASSIGNED', assignedTo: 'Ramesh Electrician', createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), updatedAt: new Date().toISOString() },
    { id: 103, userId: 3, userName: 'Alex Smith', userEmail: 'alex@service.com', category: 'Plumbing', description: 'Water leakage in washroom pipe on 2nd floor.', priority: 'HIGH', status: 'IN_PROGRESS', assignedTo: 'Suresh Plumber', createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), updatedAt: new Date().toISOString() },
    { id: 104, userId: 2, userName: 'Rahul Sharma', userEmail: 'student@service.com', category: 'Furniture', description: 'Study table leg broken in Room 304.', priority: 'LOW', status: 'RESOLVED', assignedTo: 'Carpentry Staff', createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), updatedAt: new Date().toISOString() },
    { id: 105, userId: 3, userName: 'Alex Smith', userEmail: 'alex@service.com', category: 'Cleaning', description: 'Dustbins overflowing near Hostel C entrance.', priority: 'MEDIUM', status: 'CLOSED', assignedTo: 'Sanitation Dept', createdAt: new Date(Date.now() - 3600000 * 96).toISOString(), updatedAt: new Date().toISOString() }
];

function getStoredComplaints() {
    const raw = localStorage.getItem('demo_complaints');
    if (!raw) {
        localStorage.setItem('demo_complaints', JSON.stringify(INITIAL_DEMO_COMPLAINTS));
        return INITIAL_DEMO_COMPLAINTS;
    }
    return JSON.parse(raw);
}

function saveStoredComplaints(complaints) {
    localStorage.setItem('demo_complaints', JSON.stringify(complaints));
}

document.addEventListener('DOMContentLoaded', () => {
    currentUser = checkAuth('USER');
    if (!currentUser) return;

    const welcomeUser = document.getElementById('welcomeUserName');
    if (welcomeUser) welcomeUser.innerText = currentUser.name;

    loadUserComplaints();

    const raiseComplaintForm = document.getElementById('raiseComplaintForm');
    if (raiseComplaintForm) {
        raiseComplaintForm.addEventListener('submit', handleRaiseComplaint);
    }

    const params = new URLSearchParams(window.location.search);
    const complaintId = params.get('id');
    if (complaintId && document.getElementById('complaintDetailsCard')) {
        loadComplaintDetails(complaintId);
    }
});

async function loadUserComplaints() {
    const tableBody = document.getElementById('userComplaintsTable');
    if (!tableBody) return;

    let complaints = [];
    try {
        const res = await fetch(`/api/complaints?userId=${currentUser.id}`);
        if (res.ok) {
            complaints = await res.json();
        } else {
            throw new Error('API offline');
        }
    } catch (e) {
        const all = getStoredComplaints();
        complaints = all.filter(c => c.userId == currentUser.id || currentUser.role === 'ADMIN');
    }

    renderUserStats(complaints);

    if (complaints.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    No complaints raised yet. Click "Raise New Complaint" to create one.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = complaints.map(c => `
        <tr>
            <td><strong>#CMP-${c.id}</strong></td>
            <td>${escapeHtml(c.category)}</td>
            <td><span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority}</span></td>
            <td><span class="badge badge-${c.status.toLowerCase()}">${c.status.replace('_', ' ')}</span></td>
            <td>${formatDate(c.createdAt)}</td>
            <td>
                <a href="complaint.html?id=${c.id}" class="btn btn-sm btn-secondary">
                    👁️ View
                </a>
            </td>
        </tr>
    `).join('');
}

function renderUserStats(complaints) {
    const totalEl = document.getElementById('statTotal');
    const openEl = document.getElementById('statOpen');
    const inProgressEl = document.getElementById('statInProgress');
    const resolvedEl = document.getElementById('statResolved');
    const closedEl = document.getElementById('statClosed');

    if (!totalEl) return;

    totalEl.innerText = complaints.length;
    if (openEl) openEl.innerText = complaints.filter(c => c.status === 'OPEN').length;
    if (inProgressEl) inProgressEl.innerText = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
    if (resolvedEl) resolvedEl.innerText = complaints.filter(c => c.status === 'RESOLVED').length;
    if (closedEl) closedEl.innerText = complaints.filter(c => c.status === 'CLOSED').length;
}

async function handleRaiseComplaint(e) {
    e.preventDefault();
    const category = document.getElementById('category').value;
    const priority = document.getElementById('priority').value;
    const description = document.getElementById('description').value.trim();

    let newCmp = null;
    try {
        const res = await fetch('/api/complaints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, category, priority, description })
        });
        if (res.ok) {
            newCmp = await res.json();
        } else {
            throw new Error('API offline');
        }
    } catch (err) {
        const all = getStoredComplaints();
        newCmp = {
            id: 100 + all.length + 1,
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            category,
            priority,
            description,
            status: 'OPEN',
            assignedTo: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        all.unshift(newCmp);
        saveStoredComplaints(all);
    }

    showAlert(`Complaint created successfully! Complaint ID: #${newCmp.id}`, 'success');
    document.getElementById('raiseComplaintForm').reset();
    document.getElementById('raiseComplaintModal').style.display = 'none';
    loadUserComplaints();
}

async function loadComplaintDetails(id) {
    let c = null;
    try {
        const res = await fetch(`/api/complaints/${id}`);
        if (res.ok) {
            c = await res.json();
        } else {
            throw new Error('API offline');
        }
    } catch (err) {
        const all = getStoredComplaints();
        c = all.find(item => item.id == id) || all[0];
    }

    document.getElementById('cmpId').innerText = `#CMP-${c.id}`;
    document.getElementById('cmpUser').innerText = `${c.userName} (${c.userEmail})`;
    document.getElementById('cmpCategory').innerText = c.category;
    document.getElementById('cmpDescription').innerText = c.description;
    document.getElementById('cmpPriority').innerHTML = `<span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority}</span>`;
    document.getElementById('cmpStatus').innerHTML = `<span class="badge badge-${c.status.toLowerCase()}">${c.status.replace('_', ' ')}</span>`;
    document.getElementById('cmpAssignedTo').innerText = c.assignedTo || 'Unassigned';
    document.getElementById('cmpCreatedAt').innerText = formatDate(c.createdAt);
    document.getElementById('cmpUpdatedAt').innerText = formatDate(c.updatedAt);

    updateTimelineTracker(c.status);
}

function updateTimelineTracker(status) {
    const steps = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const currentIndex = steps.indexOf(status);

    steps.forEach((step, idx) => {
        const stepEl = document.getElementById(`step-${step}`);
        if (!stepEl) return;
        stepEl.className = 'timeline-step';
        if (idx === currentIndex) {
            stepEl.classList.add('active');
        } else if (idx < currentIndex) {
            stepEl.classList.add('completed');
        }
    });
}

function formatDate(dtStr) {
    if (!dtStr) return 'N/A';
    const dt = new Date(dtStr);
    return dt.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}
