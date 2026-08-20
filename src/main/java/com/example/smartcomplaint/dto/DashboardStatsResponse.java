package com.example.smartcomplaint.dto;

public class DashboardStatsResponse {

    private long totalComplaints;
    private long openComplaints;
    private long inProgressComplaints;
    private long resolvedComplaints;
    private long closedComplaints;
    private long highPriorityComplaints;

    public DashboardStatsResponse() {
    }

    public DashboardStatsResponse(long totalComplaints, long openComplaints, long inProgressComplaints,
                                  long resolvedComplaints, long closedComplaints, long highPriorityComplaints) {
        this.totalComplaints = totalComplaints;
        this.openComplaints = openComplaints;
        this.inProgressComplaints = inProgressComplaints;
        this.resolvedComplaints = resolvedComplaints;
        this.closedComplaints = closedComplaints;
        this.highPriorityComplaints = highPriorityComplaints;
    }

    public long getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(long totalComplaints) {
        this.totalComplaints = totalComplaints;
    }

    public long getOpenComplaints() {
        return openComplaints;
    }

    public void setOpenComplaints(long openComplaints) {
        this.openComplaints = openComplaints;
    }

    public long getInProgressComplaints() {
        return inProgressComplaints;
    }

    public void setInProgressComplaints(long inProgressComplaints) {
        this.inProgressComplaints = inProgressComplaints;
    }

    public long getResolvedComplaints() {
        return resolvedComplaints;
    }

    public void setResolvedComplaints(long resolvedComplaints) {
        this.resolvedComplaints = resolvedComplaints;
    }

    public long getClosedComplaints() {
        return closedComplaints;
    }

    public void setClosedComplaints(long closedComplaints) {
        this.closedComplaints = closedComplaints;
    }

    public long getHighPriorityComplaints() {
        return highPriorityComplaints;
    }

    public void setHighPriorityComplaints(long highPriorityComplaints) {
        this.highPriorityComplaints = highPriorityComplaints;
    }
}
