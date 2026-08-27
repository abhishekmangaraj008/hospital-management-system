package com.hospital.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@Builder
public class PrescriptionResponse {
    private Long id;
    private Long appointmentId;
    private String patientName;
    private String doctorName;
    private String diagnosis;
    private String medicines;
    private String notes;
    private LocalDate issuedDate;
}
