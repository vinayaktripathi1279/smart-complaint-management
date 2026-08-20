package com.example.smartcomplaint.service;

import com.example.smartcomplaint.dto.ComplaintRequest;
import com.example.smartcomplaint.dto.ComplaintResponse;
import com.example.smartcomplaint.dto.DashboardStatsResponse;
import com.example.smartcomplaint.entity.Complaint;
import com.example.smartcomplaint.entity.User;
import com.example.smartcomplaint.exception.BadRequestException;
import com.example.smartcomplaint.exception.ResourceNotFoundException;
import com.example.smartcomplaint.repository.ComplaintRepository;
import com.example.smartcomplaint.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    private static final List<String> VALID_PRIORITIES = Arrays.asList("LOW", "MEDIUM", "HIGH");
    private static final List<String> VALID_STATUSES = Arrays.asList("OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED");

    @Autowired
    public ComplaintService(ComplaintRepository complaintRepository, UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));

        validatePriority(request.getPriority());

        Complaint complaint = new Complaint(
                user,
                request.getCategory(),
                request.getDescription(),
                request.getPriority().toUpperCase(),
                "OPEN"
        );

        Complaint savedComplaint = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(savedComplaint);
    }

    public ComplaintResponse getComplaintById(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + id));
        return ComplaintResponse.fromEntity(complaint);
    }

    public List<ComplaintResponse> getComplaintsByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }
        return complaintRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ComplaintResponse> searchAndFilterComplaints(String status, String priority, String category, String keyword) {
        return complaintRepository.searchAndFilterComplaints(status, priority, category, keyword).stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ComplaintResponse updateStatus(Long complaintId, String newStatus) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + complaintId));

        String formattedStatus = newStatus.toUpperCase();
        validateStatus(formattedStatus);
        validateStatusTransition(complaint.getStatus(), formattedStatus);

        complaint.setStatus(formattedStatus);
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(updatedComplaint);
    }

    @Transactional
    public ComplaintResponse updatePriority(Long complaintId, String newPriority) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + complaintId));

        String formattedPriority = newPriority.toUpperCase();
        validatePriority(formattedPriority);

        complaint.setPriority(formattedPriority);
        Complaint updatedComplaint = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(updatedComplaint);
    }

    @Transactional
    public ComplaintResponse assignComplaint(Long complaintId, String assignedTo) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + complaintId));

        if (assignedTo == null || assignedTo.trim().isEmpty()) {
            throw new BadRequestException("Assignee name cannot be empty");
        }

        complaint.setAssignedTo(assignedTo.trim());
        if ("OPEN".equals(complaint.getStatus())) {
            complaint.setStatus("ASSIGNED");
        }

        Complaint updatedComplaint = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(updatedComplaint);
    }

    @Transactional
    public void deleteComplaint(Long complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + complaintId));
        complaintRepository.delete(complaint);
    }

    public DashboardStatsResponse getDashboardStats() {
        long total = complaintRepository.count();
        long open = complaintRepository.countByStatus("OPEN");
        long inProgress = complaintRepository.countByStatus("IN_PROGRESS");
        long resolved = complaintRepository.countByStatus("RESOLVED");
        long closed = complaintRepository.countByStatus("CLOSED");
        long highPriority = complaintRepository.countByPriority("HIGH");

        return new DashboardStatsResponse(total, open, inProgress, resolved, closed, highPriority);
    }

    private void validatePriority(String priority) {
        if (priority == null || !VALID_PRIORITIES.contains(priority.toUpperCase())) {
            throw new BadRequestException("Invalid priority value '" + priority + "'. Allowed values: LOW, MEDIUM, HIGH");
        }
    }

    private void validateStatus(String status) {
        if (status == null || !VALID_STATUSES.contains(status.toUpperCase())) {
            throw new BadRequestException("Invalid status value '" + status + "'. Allowed values: OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED");
        }
    }

    private void validateStatusTransition(String currentStatus, String targetStatus) {
        if (currentStatus.equalsIgnoreCase(targetStatus)) {
            return;
        }

        if ("CLOSED".equalsIgnoreCase(currentStatus)) {
            throw new BadRequestException("Invalid status transition: A CLOSED complaint cannot be reopened or changed to " + targetStatus);
        }

        if ("RESOLVED".equalsIgnoreCase(currentStatus) && ("OPEN".equalsIgnoreCase(targetStatus) || "ASSIGNED".equalsIgnoreCase(targetStatus) || "IN_PROGRESS".equalsIgnoreCase(targetStatus))) {
            throw new BadRequestException("Invalid status transition: RESOLVED complaint can only move to CLOSED status");
        }
    }
}
