// Admin Dashboard Manager
let adminUser = null;
let currentActiveComplaintId = null;

document.addEventListener('DOMContentLoaded', () => {
    adminUser = checkAuth('ADMIN');
    if (!adminUser) return;

    loadAdminStats();
    loadAdminComplaints();

    // Attach Search & Filter Listeners
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const filterPriority = document.getElementById('filterPriority');
    const filterCategory = document.getElementById('filterCategory');
    const btnResetFilter = document.getElementById('btnResetFilter');

    if (searchInput) searchInput.addEventListener('input', debounce(loadAdminComplaints, 300));
    if (filterStatus) filterStatus.addEventListener('change', loadAdminComplaints);
    if (filterPriority) filterPriority.addEventListener('change', loadAdminComplaints);
    if (filterCategory) filterCategory.addEventListener('change', loadAdminComplaints);

    if (btnResetFilter) {
        btnResetFilter.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (filterStatus) filterStatus.value = '';
            if (filterPriority) filterPriority.value = '';
            if (filterCategory) filterCategory.value = '';
            loadAdminComplaints();
        });
    }

    // Modal Form Submissions
    const statusForm = document.getElementById('updateStatusForm');
    if (statusForm) statusForm.addEventListener('submit', submitStatusUpdate);

    const assignForm = document.getElementById('assignTechnicianForm');
    if (assignForm) assignForm.addEventListener('submit', submitAssignTechnician);

    const priorityForm = document.getElementById('updatePriorityForm');
    if (priorityForm) priorityForm.addEventListener('submit', submitPriorityUpdate);
});

async function loadAdminStats() {
    try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) throw new Error('Failed to load dashboard metrics');
        const stats = await res.json();

        document.getElementById('statTotal').innerText = stats.totalComplaints;
        document.getElementById('statOpen').innerText = stats.openComplaints;
        document.getElementById('statInProgress').innerText = stats.inProgressComplaints;
        document.getElementById('statResolved').innerText = stats.resolvedComplaints;
        document.getElementById('statClosed').innerText = stats.closedComplaints;
        document.getElementById('statHighPriority').innerText = stats.highPriorityComplaints;
    } catch (err) {
        console.error(err);
    }
}

async function loadAdminComplaints() {
    const tableBody = document.getElementById('adminComplaintsTable');
    if (!tableBody) return;

    const status = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : '';
    const priority = document.getElementById('filterPriority') ? document.getElementById('filterPriority').value : '';
    const category = document.getElementById('filterCategory') ? document.getElementById('filterCategory').value : '';
    const search = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';

    const queryParams = new URLSearchParams({ status, priority, category, search });

    try {
        const res = await fetch(`/api/admin/complaints?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to load complaints list');

        const complaints = await res.json();

        if (complaints.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        No matching complaints found. Try adjusting your filter criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = complaints.map(c => `
            <tr>
                <td><strong>#CMP-${c.id}</strong></td>
                <td>${escapeHtml(c.userName)}<br><small style="color:var(--text-secondary);">${escapeHtml(c.userEmail)}</small></td>
                <td>${escapeHtml(c.category)}</td>
                <td>
                    <span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority}</span>
                    <button class="btn btn-sm" style="padding:0; margin-left:4px;" onclick="openPriorityModal(${c.id}, '${c.priority}')" title="Change Priority">✏️</button>
                </td>
                <td>
                    <span class="badge badge-${c.status.toLowerCase()}">${c.status.replace('_', ' ')}</span>
                    <button class="btn btn-sm" style="padding:0; margin-left:4px;" onclick="openStatusModal(${c.id}, '${c.status}')" title="Change Status">✏️</button>
                </td>
                <td>
                    ${c.assignedTo ? escapeHtml(c.assignedTo) : '<em style="color:var(--text-secondary);">Unassigned</em>'}
                    <button class="btn btn-sm" style="padding:0; margin-left:4px;" onclick="openAssignModal(${c.id}, '${escapeHtml(c.assignedTo || '')}')" title="Assign Technician">👤</button>
                </td>
                <td>${formatDate(c.createdAt)}</td>
                <td>
                    <div style="display:flex; gap:0.4rem;">
                        <a href="complaint.html?id=${c.id}" class="btn btn-sm btn-secondary" title="View Details">
                            👁️ View
                        </a>
                        <button onclick="deleteComplaint(${c.id})" class="btn btn-sm btn-danger" title="Delete Complaint">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="8" style="color: red; text-align: center;">Error loading admin dataset.</td></tr>`;
    }
}

// Modal Control Functions
function openStatusModal(id, currentStatus) {
    currentActiveComplaintId = id;
    document.getElementById('statusModalCmpId').innerText = `#CMP-${id}`;
    document.getElementById('newStatusSelect').value = currentStatus;
    document.getElementById('statusModal').style.display = 'flex';
}

function openAssignModal(id, currentAssignee) {
    currentActiveComplaintId = id;
    document.getElementById('assignModalCmpId').innerText = `#CMP-${id}`;
    document.getElementById('assignedToInput').value = currentAssignee || '';
    document.getElementById('assignModal').style.display = 'flex';
}

function openPriorityModal(id, currentPriority) {
    currentActiveComplaintId = id;
    document.getElementById('priorityModalCmpId').innerText = `#CMP-${id}`;
    document.getElementById('newPrioritySelect').value = currentPriority;
    document.getElementById('priorityModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    currentActiveComplaintId = null;
}

async function submitStatusUpdate(e) {
    e.preventDefault();
    if (!currentActiveComplaintId) return;

    const newStatus = document.getElementById('newStatusSelect').value;

    try {
        const res = await fetch(`/api/admin/complaints/${currentActiveComplaintId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update status');

        showAlert('Status updated successfully!', 'success');
        closeModal('statusModal');
        loadAdminStats();
        loadAdminComplaints();
    } catch (err) {
        alert(err.message);
    }
}

async function submitAssignTechnician(e) {
    e.preventDefault();
    if (!currentActiveComplaintId) return;

    const assignedTo = document.getElementById('assignedToInput').value.trim();

    try {
        const res = await fetch(`/api/admin/complaints/${currentActiveComplaintId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignedTo })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to assign technician');

        showAlert('Technician assigned successfully!', 'success');
        closeModal('assignModal');
        loadAdminStats();
        loadAdminComplaints();
    } catch (err) {
        alert(err.message);
    }
}

async function submitPriorityUpdate(e) {
    e.preventDefault();
    if (!currentActiveComplaintId) return;

    const priority = document.getElementById('newPrioritySelect').value;

    try {
        const res = await fetch(`/api/admin/complaints/${currentActiveComplaintId}/priority`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update priority');

        showAlert('Priority updated successfully!', 'success');
        closeModal('priorityModal');
        loadAdminStats();
        loadAdminComplaints();
    } catch (err) {
        alert(err.message);
    }
}

async function deleteComplaint(id) {
    if (!confirm(`Are you sure you want to delete complaint #CMP-${id}?`)) return;

    try {
        const res = await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete complaint');

        showAlert(`Complaint #CMP-${id} deleted cleanly.`, 'success');
        loadAdminStats();
        loadAdminComplaints();
    } catch (err) {
        alert(err.message);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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
