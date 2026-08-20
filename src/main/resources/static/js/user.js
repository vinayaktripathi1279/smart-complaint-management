// User Dashboard Logic
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = checkAuth('USER');
    if (!currentUser) return;

    // Greeting
    const welcomeUser = document.getElementById('welcomeUserName');
    if (welcomeUser) welcomeUser.innerText = currentUser.name;

    // Load User Complaints & Calculate User Stats
    loadUserComplaints();

    // Form submission
    const raiseComplaintForm = document.getElementById('raiseComplaintForm');
    if (raiseComplaintForm) {
        raiseComplaintForm.addEventListener('submit', handleRaiseComplaint);
    }

    // Complaint details page loader
    const params = new URLSearchParams(window.location.search);
    const complaintId = params.get('id');
    if (complaintId && document.getElementById('complaintDetailsCard')) {
        loadComplaintDetails(complaintId);
    }
});

async function loadUserComplaints() {
    const tableBody = document.getElementById('userComplaintsTable');
    if (!tableBody) return;

    try {
        const res = await fetch(`/api/complaints?userId=${currentUser.id}`);
        if (!res.ok) throw new Error('Failed to fetch complaints');

        const complaints = await res.json();
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
                        <i class="bi bi-eye"></i> View
                    </a>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Failed to load complaints.</td></tr>`;
    }
}

function renderUserStats(complaints) {
    const totalEl = document.getElementById('statTotal');
    const openEl = document.getElementById('statOpen');
    const inProgressEl = document.getElementById('statInProgress');
    const resolvedEl = document.getElementById('statResolved');
    const closedEl = document.getElementById('statClosed');

    if (!totalEl) return;

    const total = complaints.length;
    const open = complaints.filter(c => c.status === 'OPEN').length;
    const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
    const resolved = complaints.filter(c => c.status === 'RESOLVED').length;
    const closed = complaints.filter(c => c.status === 'CLOSED').length;

    totalEl.innerText = total;
    if (openEl) openEl.innerText = open;
    if (inProgressEl) inProgressEl.innerText = inProgress;
    if (resolvedEl) resolvedEl.innerText = resolved;
    if (closedEl) closedEl.innerText = closed;
}

async function handleRaiseComplaint(e) {
    e.preventDefault();
    const category = document.getElementById('category').value;
    const priority = document.getElementById('priority').value;
    const description = document.getElementById('description').value.trim();

    try {
        const res = await fetch('/api/complaints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                category,
                priority,
                description
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create complaint');

        showAlert(`Complaint created successfully! Complaint ID: #${data.id}`, 'success');
        document.getElementById('raiseComplaintForm').reset();
        
        // Refresh list
        loadUserComplaints();

        // Close modal if bootstrap/custom modal used
        const modal = document.getElementById('raiseComplaintModal');
        if (modal) modal.style.display = 'none';

    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

async function loadComplaintDetails(id) {
    try {
        const res = await fetch(`/api/complaints/${id}`);
        if (!res.ok) throw new Error('Complaint not found');
        const c = await res.json();

        document.getElementById('cmpId').innerText = `#CMP-${c.id}`;
        document.getElementById('cmpUser').innerText = `${c.userName} (${c.userEmail})`;
        document.getElementById('cmpCategory').innerText = c.category;
        document.getElementById('cmpDescription').innerText = c.description;
        document.getElementById('cmpPriority').innerHTML = `<span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority}</span>`;
        document.getElementById('cmpStatus').innerHTML = `<span class="badge badge-${c.status.toLowerCase()}">${c.status.replace('_', ' ')}</span>`;
        document.getElementById('cmpAssignedTo').innerText = c.assignedTo || 'Unassigned';
        document.getElementById('cmpCreatedAt').innerText = formatDate(c.createdAt);
        document.getElementById('cmpUpdatedAt').innerText = formatDate(c.updatedAt);

        // Render Status Timeline Tracker
        updateTimelineTracker(c.status);

    } catch (err) {
        document.getElementById('complaintDetailsCard').innerHTML = `
            <div class="alert alert-danger" style="display:block;">${err.message}</div>
        `;
    }
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
