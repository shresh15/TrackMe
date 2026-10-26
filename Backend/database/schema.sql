CREATE DATABASE IF NOT EXISTS trackme;
USE trackme;

CREATE TABLE IF NOT EXISTS users(
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT NOT NULL,

    company_name VARCHAR(150) NOT NULL,
    position VARCHAR(150),

    career_page VARCHAR(500),
    application_link VARCHAR(500),

    applied_date DATE,

    status ENUM(
        'Interested',
        'Applied',
        'OA/Test',
        'Interview',
        'Selected',
        'Rejected',
        'Withdrawn'
    ) NOT NULL DEFAULT 'Interested',

    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    next_date DATE,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create application history table
CREATE TABLE IF NOT EXISTS application_events (
    id INT PRIMARY KEY AUTO_INCREMENT,

    application_id INT NOT NULL,

    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE
);

