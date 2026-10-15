
package com.kloudspot.employeemanagement.repository;

import com.kloudspot.employeemanagement.model.Employee;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface EmployeeRepository
        extends MongoRepository<Employee, String>,
        EmployeeSearchRepository {

    Optional<Employee> findByEmployeeId(String employeeId);

    boolean existsByEmployeeId(String employeeId);

    boolean existsByEmailIgnoreCase(String email);

    Optional<Employee> findByEmailIgnoreCase(String email);
}
