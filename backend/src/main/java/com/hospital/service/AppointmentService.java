package com.hospital.service;

import com.hospital.dto.AppointmentRequest;
import com.hospital.dto.AppointmentResponse;
import com.hospital.entity.*;
import com.hospital.exception.BadRequestException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.repository.AppointmentRepository;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private static final LocalTime CLINIC_OPENS = LocalTime.of(9, 0);
    private static final LocalTime CLINIC_CLOSES = LocalTime.of(17, 0);

    // Which statuses "hold" a slot, i.e. block a second booking at the same doctor/date/time.
    private static final List<AppointmentStatus> ACTIVE_STATUSES = List.of(
            AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED);

    // Valid doctor-driven status transitions. Anything not listed here is rejected.
    private static final Map<AppointmentStatus, Set<AppointmentStatus>> ALLOWED_TRANSITIONS = Map.of(
            AppointmentStatus.PENDING, EnumSet.of(AppointmentStatus.ACCEPTED, AppointmentStatus.REJECTED),
            AppointmentStatus.ACCEPTED, EnumSet.of(AppointmentStatus.COMPLETED),
            AppointmentStatus.REJECTED, EnumSet.noneOf(AppointmentStatus.class),
            AppointmentStatus.CANCELLED, EnumSet.noneOf(AppointmentStatus.class),
            AppointmentStatus.COMPLETED, EnumSet.noneOf(AppointmentStatus.class)
    );

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Transactional
    public AppointmentResponse bookAppointment(String patientEmail, AppointmentRequest request) {
        Patient patient = patientRepository.findByUserEmail(patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + request.getDoctorId()));

        validateSlot(request.getAppointmentDate(), request.getAppointmentTime());

        boolean slotTaken = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
                doctor.getId(), request.getAppointmentDate(), request.getAppointmentTime(), ACTIVE_STATUSES);
        if (slotTaken) {
            throw new BadRequestException("This doctor already has an appointment at that date and time. Please choose another slot.");
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .reason(request.getReason())
                .status(AppointmentStatus.PENDING)
                .build();

        appointment = appointmentRepository.save(appointment);
        return toResponse(appointment);
    }

    private void validateSlot(LocalDate date, LocalTime time) {
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) {
            throw new BadRequestException("Appointment date cannot be in the past");
        }
        if (date.isEqual(today) && time.isBefore(LocalTime.now())) {
            throw new BadRequestException("Appointment time cannot be in the past");
        }
        if (time.isBefore(CLINIC_OPENS) || time.isAfter(CLINIC_CLOSES)) {
            throw new BadRequestException("Appointments can only be booked between 9:00 AM and 5:00 PM");
        }
    }

    @Transactional
    public AppointmentResponse cancelAppointment(String patientEmail, Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getPatient().getUser().getEmail().equals(patientEmail)) {
            throw new BadRequestException("You can only cancel your own appointments");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED
                || appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new BadRequestException("This appointment can no longer be cancelled (current status: "
                    + appointment.getStatus() + ")");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse updateStatus(String doctorEmail, Long appointmentId, AppointmentStatus newStatus) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getDoctor().getUser().getEmail().equals(doctorEmail)) {
            throw new BadRequestException("You can only update your own appointments");
        }

        AppointmentStatus current = appointment.getStatus();
        Set<AppointmentStatus> allowedNext = ALLOWED_TRANSITIONS.getOrDefault(current, Set.of());
        if (!allowedNext.contains(newStatus)) {
            throw new BadRequestException(
                    "Cannot change appointment status from " + current + " to " + newStatus);
        }

        appointment.setStatus(newStatus);
        return toResponse(appointmentRepository.save(appointment));
    }

    /** Only the patient themselves, the treating doctor, or an admin can view a patient's appointment list. */
    public List<AppointmentResponse> getByPatient(Long patientId, Authentication authentication) {
        if (!SecurityUtils.hasRole(authentication, "ADMIN")) {
            String email = authentication.getName();
            if (SecurityUtils.hasRole(authentication, "PATIENT")) {
                Patient patient = patientRepository.findByUserEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
                if (!patient.getId().equals(patientId)) {
                    throw new AccessDeniedException("You can only view your own appointments");
                }
            } else if (SecurityUtils.hasRole(authentication, "DOCTOR")) {
                Doctor doctor = doctorRepository.findByUserEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
                if (!appointmentRepository.existsByDoctorIdAndPatientId(doctor.getId(), patientId)) {
                    throw new AccessDeniedException("You do not have permission to view this patient's appointments");
                }
            } else {
                throw new AccessDeniedException("You do not have permission to view these appointments");
            }
        }
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId)
                .stream().map(this::toResponse).toList();
    }

    /** Only the doctor themselves or an admin can view a doctor's full appointment list. */
    public List<AppointmentResponse> getByDoctor(Long doctorId, Authentication authentication) {
        if (!SecurityUtils.hasRole(authentication, "ADMIN")) {
            if (!SecurityUtils.hasRole(authentication, "DOCTOR")) {
                throw new AccessDeniedException("You do not have permission to view these appointments");
            }
            Doctor doctor = doctorRepository.findByUserEmail(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
            if (!doctor.getId().equals(doctorId)) {
                throw new AccessDeniedException("You can only view your own appointments");
            }
        }
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDesc(doctorId)
                .stream().map(this::toResponse).toList();
    }

    public List<AppointmentResponse> getAll() {
        return appointmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getUser().getFullName())
                .doctorId(a.getDoctor().getId())
                .doctorName(a.getDoctor().getUser().getFullName())
                .departmentName(a.getDoctor().getDepartment() != null ? a.getDoctor().getDepartment().getName() : null)
                .appointmentDate(a.getAppointmentDate())
                .appointmentTime(a.getAppointmentTime())
                .reason(a.getReason())
                .status(a.getStatus())
                .build();
    }
}
