package com.hospital.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PatientUpdateRequest {
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String bloodGroup;
    private String phone;
}
