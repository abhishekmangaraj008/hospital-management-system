package com.hospital.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class DoctorResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String departmentName;
    private String specialization;
    private String qualification;
    private Integer experienceYears;
}
