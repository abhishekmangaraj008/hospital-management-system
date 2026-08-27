package com.hospital.dto;

import com.hospital.entity.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentStatusUpdateRequest {

    @NotNull
    private AppointmentStatus status;
}
