package com.example.smartcomplaint.repository;

import com.example.smartcomplaint.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // Derived Query Methods - Demonstrates Spring Data JPA naming conventions
    List<Complaint> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Complaint> findByStatus(String status);

    List<Complaint> findByPriority(String priority);

    long countByStatus(String status);

    long countByPriority(String priority);

    // Custom JPQL Query for Search and Multi-field Filtering
    @Query("SELECT c FROM Complaint c WHERE " +
           "(:status IS NULL OR :status = '' OR c.status = :status) AND " +
           "(:priority IS NULL OR :priority = '' OR c.priority = :priority) AND " +
           "(:category IS NULL OR :category = '' OR c.category = :category) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " CAST(c.id AS string) LIKE CONCAT('%', :keyword, '%') OR " +
           " LOWER(c.user.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY c.createdAt DESC")
    List<Complaint> searchAndFilterComplaints(
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("category") String category,
            @Param("keyword") String keyword
    );
}
