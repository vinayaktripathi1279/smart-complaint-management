package com.example.smartcomplaint.controller;

import com.example.smartcomplaint.dto.ComplaintResponse;
import com.example.smartcomplaint.dto.DashboardStatsResponse;
import com.example.smartcomplaint.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final ComplaintService complaintService;

    @Autowired
    public AdminController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "search", required = false) String search) {
        List<ComplaintResponse> complaints = complaintService.searchAndFilterComplaints(status, priority, category, search);
        return ResponseEntity.ok(complaints);
    }

    @PutMapping("/complaints/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        ComplaintResponse updated = complaintService.updateStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/complaints/{id}/priority")
    public ResponseEntity<ComplaintResponse> updatePriority(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String priority = payload.get("priority");
        ComplaintResponse updated = complaintService.updatePriority(id, priority);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/complaints/{id}/assign")
    public ResponseEntity<ComplaintResponse> assignComplaint(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String assignedTo = payload.get("assignedTo");
        ComplaintResponse updated = complaintService.assignComplaint(id, assignedTo);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        DashboardStatsResponse stats = complaintService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
}
