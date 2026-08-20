// Admin Dashboard Manager (Supports Instant Interactive Live Web Demo)
let adminUser = null;
let currentActiveComplaintId = null;

document.addEventListener('DOMContentLoaded', () => {
    adminUser = checkAuth('ADMIN');
    if (!adminUser) return;

    loadAdminStats();
    loadAdminComplaints();

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
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('statTotal').innerText = stats.totalComplaints;
            document.getElementById('statOpen').innerText = stats.openComplaints;
            document.getElementById('statInProgress').innerText = stats.inProgressComplaints;
            document.getElementById('statResolved').innerText = stats.resolvedComplaints;
            document.getElementById('statClosed').innerText = stats.closedComplaints;
            document.getElementById('statHighPriority').innerText = stats.highPriorityComplaints;
            return;
        }
    } catch (err) {}

    // Fallback metrics calculation for live web demo
    const complaints = getStoredComplaints();
    document.getElementById('statTotal').innerText = complaints.length;
    document.getElementById('statOpen').innerText = complaints.filter(c => c.status === 'OPEN').length;
    document.getElementById('statInProgress').innerText = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
    document.getElementById('statResolved').innerText = complaints.filter(c => c.status === 'RESOLVED').length;
    document.getElementById('statClosed').innerText = complaints.filter(c => c.status === 'CLOSED').length;
    document.getElementById('statHighPriority').innerText = complaints.filter(c => c.priority === 'HIGH').length;
}

async function loadAdminComplaints() {
    const tableBody = document.getElementById('adminComplaintsTable');
    if (!tableBody) return;

    const status = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : '';
    const priority = document.getElementById('filterPriority') ? document.getElementById('filterPriority').value : '';
    const category = document.getElementById('filterCategory') ? document.getElementById('filterCategory').value : '';
    const search = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim().toLowerCase() : '';

    let complaints = [];
    try {
        const queryParams = new URLSearchParams({ status, priority, category, search });
        const res = await fetch(`/api/admin/complaints?${queryParams.toString()}`);
        if (res.ok) {
            complaints = await res.json();
        } else {
            throw new Error('API offline');
        }
    } catch (err) {
        complaints = getStoredComplaints();
        if (status) complaints = complaints.filter(c => c.status === status);
        if (priority) complaints = complaints.filter(c => c.priority === priority);
        if (category) complaints = complaints.filter(c => c.category === category);
        if (search) {
            complaints = complaints.filter(c => 
                c.id.toString().includes(search) || 
                c.userName.toLowerCase().includes(search) || 
                c.description.toLowerCase().includes(search)
            );
        }
    }

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
}

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
        if (!res.ok) throw new Error('API error');
    } catch (err) {
        const all = getStoredComplaints();
        const target = all.find(c => c.id == currentActiveComplaintId);
        if (target) {
            if (target.status === 'CLOSED') {
                alert('Invalid transition: A CLOSED complaint cannot be modified!');
                return;
            }
            target.status = newStatus;
            target.updatedAt = new Date().toISOString();
            saveStoredComplaints(all);
        }
    }

    closeModal('statusModal');
    loadAdminStats();
    loadAdminComplaints();
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
        if (!res.ok) throw new Error('API error');
    } catch (err) {
        const all = getStoredComplaints();
        const target = all.find(c => c.id == currentActiveComplaintId);
        if (target) {
            target.assignedTo = assignedTo;
            if (target.status === 'OPEN') target.status = 'ASSIGNED';
            target.updatedAt = new Date().toISOString();
            saveStoredComplaints(all);
        }
    }

    closeModal('assignModal');
    loadAdminStats();
    loadAdminComplaints();
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
        if (!res.ok) throw new Error('API error');
    } catch (err) {
        const all = getStoredComplaints();
        const target = all.find(c => c.id == currentActiveComplaintId);
        if (target) {
            target.priority = priority;
            target.updatedAt = new Date().toISOString();
            saveStoredComplaints(all);
        }
    }

    closeModal('priorityModal');
    loadAdminStats();
    loadAdminComplaints();
}

async function deleteComplaint(id) {
    if (!confirm(`Are you sure you want to delete complaint #CMP-${id}?`)) return;

    try {
        await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
    } catch (err) {}

    const all = getStoredComplaints();
    const filtered = all.filter(c => c.id != id);
    saveStoredComplaints(filtered);

    loadAdminStats();
    loadAdminComplaints();
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
