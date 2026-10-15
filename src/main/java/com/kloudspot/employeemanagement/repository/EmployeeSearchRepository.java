
package com.kloudspot.employeemanagement.repository;

import com.kloudspot.employeemanagement.model.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmployeeSearchRepository {

    Page<Employee> searchEmployees(
            String search,
            String department,
            Employee.EmploymentStatus status,
            Pageable pageable
    );
}
