package com.example.smartcomplaint.service;

import com.example.smartcomplaint.dto.ComplaintRequest;
import com.example.smartcomplaint.dto.ComplaintResponse;
import com.example.smartcomplaint.entity.Complaint;
import com.example.smartcomplaint.entity.User;
import com.example.smartcomplaint.exception.BadRequestException;
import com.example.smartcomplaint.exception.ResourceNotFoundException;
import com.example.smartcomplaint.repository.ComplaintRepository;
import com.example.smartcomplaint.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ComplaintServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ComplaintService complaintService;

    private User sampleUser;
    private Complaint sampleComplaint;

    @BeforeEach
    void setUp() {
        sampleUser = new User("Rahul Sharma", "student@service.com", "password123", "USER");
        sampleUser.setId(1L);

        sampleComplaint = new Complaint(sampleUser, "Internet", "Wi-Fi down", "HIGH", "OPEN");
        sampleComplaint.setId(101L);
    }

    @Test
    void testCreateComplaint_Success() {
        ComplaintRequest request = new ComplaintRequest(1L, "Internet", "Wi-Fi down", "HIGH");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(complaintRepository.save(any(Complaint.class))).thenReturn(sampleComplaint);

        ComplaintResponse response = complaintService.createComplaint(request);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("Internet", response.getCategory());
        assertEquals("OPEN", response.getStatus());
        verify(complaintRepository, times(1)).save(any(Complaint.class));
    }

    @Test
    void testGetComplaintById_Success() {
        when(complaintRepository.findById(101L)).thenReturn(Optional.of(sampleComplaint));

        ComplaintResponse response = complaintService.getComplaintById(101L);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("Internet", response.getCategory());
    }

    @Test
    void testGetComplaintById_NotFound() {
        when(complaintRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> complaintService.getComplaintById(999L));
    }

    @Test
    void testUpdateStatus_ValidTransition() {
        when(complaintRepository.findById(101L)).thenReturn(Optional.of(sampleComplaint));
        when(complaintRepository.save(any(Complaint.class))).thenReturn(sampleComplaint);

        ComplaintResponse response = complaintService.updateStatus(101L, "IN_PROGRESS");

        assertNotNull(response);
        verify(complaintRepository, times(1)).save(sampleComplaint);
    }

    @Test
    void testUpdateStatus_InvalidClosedTransition() {
        sampleComplaint.setStatus("CLOSED");
        when(complaintRepository.findById(101L)).thenReturn(Optional.of(sampleComplaint));

        assertThrows(BadRequestException.class, () -> complaintService.updateStatus(101L, "IN_PROGRESS"));
    }
}
