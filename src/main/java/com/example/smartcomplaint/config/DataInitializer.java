package com.example.smartcomplaint.config;

import com.example.smartcomplaint.entity.Complaint;
import com.example.smartcomplaint.entity.User;
import com.example.smartcomplaint.repository.ComplaintRepository;
import com.example.smartcomplaint.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(UserRepository userRepository, ComplaintRepository complaintRepository) {
        this.userRepository = userRepository;
        this.complaintRepository = complaintRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Seed Admin User
            User admin = new User(
                    "System Admin",
                    "admin@service.com",
                    passwordEncoder.encode("admin123"),
                    "ADMIN"
            );
            userRepository.save(admin);

            // Seed Student User
            User student = new User(
                    "Rahul Sharma",
                    "student@service.com",
                    passwordEncoder.encode("student123"),
                    "USER"
            );
            userRepository.save(student);

            User alex = new User(
                    "Alex Smith",
                    "alex@service.com",
                    passwordEncoder.encode("student123"),
                    "USER"
            );
            userRepository.save(alex);

            // Seed Sample Complaints
            Complaint c1 = new Complaint(
                    student,
                    "Internet",
                    "Wi-Fi is not working in Hostel Block B Room 304. Signals keep dropping frequently during online classes.",
                    "HIGH",
                    "OPEN"
            );
            complaintRepository.save(c1);

            Complaint c2 = new Complaint(
                    student,
                    "Electrical",
                    "Ceiling fan in study hall is making loud buzzing noise and operating at very low speed.",
                    "MEDIUM",
                    "ASSIGNED"
            );
            c2.setAssignedTo("Ramesh Electrician");
            complaintRepository.save(c2);

            Complaint c3 = new Complaint(
                    alex,
                    "Plumbing",
                    "Water leakage in 2nd floor washroom pipe causing water pool near entrance.",
                    "HIGH",
                    "IN_PROGRESS"
            );
            c3.setAssignedTo("Suresh Plumber");
            complaintRepository.save(c3);

            Complaint c4 = new Complaint(
                    student,
                    "Furniture",
                    "Study table leg broken in Room 304. Needs urgent repair or replacement.",
                    "LOW",
                    "RESOLVED"
            );
            c4.setAssignedTo("Carpentry Team");
            complaintRepository.save(c4);

            Complaint c5 = new Complaint(
                    alex,
                    "Cleaning",
                    "Dustbins near Hostel C entrance are overflowing and require scheduled clearance.",
                    "MEDIUM",
                    "CLOSED"
            );
            c5.setAssignedTo("Sanitation Staff");
            complaintRepository.save(c5);

            System.out.println("✅ Sample data successfully initialized!");
            System.out.println("   Admin Login: admin@service.com / admin123");
            System.out.println("   User Login : student@service.com / student123");
        }
    }
}
