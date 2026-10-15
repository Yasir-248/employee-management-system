
package com.kloudspot.employeemanagement.service;

import com.kloudspot.employeemanagement.exception.ResourceNotFoundException;
import com.kloudspot.employeemanagement.model.Employee;
import com.kloudspot.employeemanagement.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    // Create an employee.
    public Employee createEmployee(Employee employee) {
        validateEmployee(employee);
        normalizeEmployee(employee);

        if (employeeRepository.existsByEmployeeId(
                employee.getEmployeeId())) {
            throw new IllegalArgumentException(
                    "Employee ID already exists");
        }

        if (employeeRepository.existsByEmailIgnoreCase(
                employee.getEmail())) {
            throw new IllegalArgumentException(
                    "Email already exists");
        }

        // Let MongoDB generate a new document ID.
        employee.setId(null);

        return employeeRepository.save(employee);
    }

    // Search, filter, sort, and paginate employees.
    public Page<Employee> getEmployees(
            String search,
            String department,
            Employee.EmploymentStatus status,
            int page,
            int size) {

        if (page < 0) {
            throw new IllegalArgumentException(
                    "Page number cannot be negative");
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException(
                    "Page size must be between 1 and 100");
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.ASC, "fullName")
        );

        return employeeRepository.searchEmployees(
                search,
                department,
                status,
                pageable
        );
    }

    // Retrieve an employee by MongoDB document ID.
    public Employee getEmployeeById(String id) {
        return employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with ID: " + id));
    }

    // Update an existing employee.
    public Employee updateEmployee(
            String id,
            Employee updatedEmployee) {

        validateEmployee(updatedEmployee);
        normalizeEmployee(updatedEmployee);

        Employee existing = getEmployeeById(id);

        employeeRepository.findByEmployeeId(
                        updatedEmployee.getEmployeeId())
                .filter(employee ->
                        !employee.getId().equals(id))
                .ifPresent(employee -> {
                    throw new IllegalArgumentException(
                            "Employee ID already exists");
                });

        employeeRepository.findByEmailIgnoreCase(
                        updatedEmployee.getEmail())
                .filter(employee ->
                        !employee.getId().equals(id))
                .ifPresent(employee -> {
                    throw new IllegalArgumentException(
                            "Email already exists");
                });

        existing.setEmployeeId(updatedEmployee.getEmployeeId());
        existing.setFullName(updatedEmployee.getFullName());
        existing.setEmail(updatedEmployee.getEmail());
        existing.setPhoneNumber(updatedEmployee.getPhoneNumber());
        existing.setDepartment(updatedEmployee.getDepartment());
        existing.setDesignation(updatedEmployee.getDesignation());
        existing.setDateOfJoining(updatedEmployee.getDateOfJoining());
        existing.setSalary(updatedEmployee.getSalary());
        existing.setEmploymentStatus(
                updatedEmployee.getEmploymentStatus());

        return employeeRepository.save(existing);
    }

    // Delete an existing employee.
    public void deleteEmployee(String id) {
        Employee employee = getEmployeeById(id);
        employeeRepository.delete(employee);
    }

    // Validate employee fields before saving.
    private void validateEmployee(Employee employee) {
        if (employee == null) {
            throw new IllegalArgumentException(
                    "Employee data is required");
        }

        if (isBlank(employee.getEmployeeId())
                || isBlank(employee.getFullName())
                || isBlank(employee.getEmail())
                || isBlank(employee.getPhoneNumber())
                || isBlank(employee.getDepartment())
                || isBlank(employee.getDesignation())) {

            throw new IllegalArgumentException(
                    "Required employee fields cannot be blank");
        }

        // Validate the trimmed email so surrounding whitespace is allowed.
        String email = employee.getEmail().trim();

        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException(
                    "Invalid email address");
        }

        if (!employee.getPhoneNumber().matches(
                "^[+]?[0-9]{10,15}$")) {
            throw new IllegalArgumentException(
                    "Invalid phone number");
        }

        if (employee.getDateOfJoining() == null) {
            throw new IllegalArgumentException(
                    "Date of joining is required");
        }

        if (employee.getSalary() == null
                || employee.getSalary().signum() < 0) {
            throw new IllegalArgumentException(
                    "Salary cannot be negative");
        }

        if (employee.getEmploymentStatus() == null) {
            throw new IllegalArgumentException(
                    "Employment status is required");
        }
    }

    // Normalize input to keep stored data consistent.
    private void normalizeEmployee(Employee employee) {
        employee.setEmployeeId(employee.getEmployeeId().trim());
        employee.setFullName(employee.getFullName().trim());
        employee.setEmail(
                employee.getEmail().trim().toLowerCase(Locale.ROOT));
        employee.setPhoneNumber(employee.getPhoneNumber().trim());
        employee.setDepartment(employee.getDepartment().trim());
        employee.setDesignation(employee.getDesignation().trim());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
