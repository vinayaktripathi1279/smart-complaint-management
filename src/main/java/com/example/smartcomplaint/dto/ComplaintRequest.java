package com.example.smartcomplaint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class ComplaintRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Category cannot be empty")
    private String category;

    @NotBlank(message = "Description cannot be empty")
    private String description;

    @NotBlank(message = "Priority must be LOW, MEDIUM or HIGH")
    @Pattern(regexp = "^(LOW|MEDIUM|HIGH)$", message = "Priority must be LOW, MEDIUM or HIGH")
    private String priority;

    public ComplaintRequest() {
    }

    public ComplaintRequest(Long userId, String category, String description, String priority) {
        this.userId = userId;
        this.category = category;
        this.description = description;
        this.priority = priority;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }
}
