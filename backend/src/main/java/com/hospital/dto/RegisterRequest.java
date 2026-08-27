package com.hospital.dto;

import com.hospital.entity.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String phone;

    @NotNull(message = "Role is required")
    private Role role; // PATIENT or DOCTOR (ADMIN created manually/seeded)

    // Optional doctor-only fields
    private Long departmentId;
    private String specialization;
    private String qualification;
    private Integer experienceYears;
}
