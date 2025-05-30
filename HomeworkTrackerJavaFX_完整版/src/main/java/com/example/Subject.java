
package com.example;

public class Subject {
    private int id;
    private String name;
    private String dueDate;
    private String dueTime;
    private String reminderDate;
    private String reminderTime;
    private String status; // submitted / unknown / pending
    private String submittedDate;
    private String submittedTime;
    private boolean isNoLimit;

    public Subject(int id, String name, String dueDate, String dueTime, String reminderDate, String reminderTime, boolean isNoLimit) {
        this.id = id;
        this.name = name;
        this.dueDate = dueDate;
        this.dueTime = dueTime;
        this.reminderDate = reminderDate;
        this.reminderTime = reminderTime;
        this.status = "pending";
        this.submittedDate = null;
        this.submittedTime = null;
        this.isNoLimit = isNoLimit;
    }

    // Getter 和 Setter
    public int getId() { return id; }
    public String getName() { return name; }
    public String getDueDate() { return dueDate; }
    public String getDueTime() { return dueTime; }
    public String getReminderDate() { return reminderDate; }
    public String getReminderTime() { return reminderTime; }
    public String getStatus() { return status; }
    public String getSubmittedDate() { return submittedDate; }
    public String getSubmittedTime() { return submittedTime; }
    public boolean isNoLimit() { return isNoLimit; }

    public void setId(int id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public void setDueTime(String dueTime) { this.dueTime = dueTime; }
    public void setReminderDate(String reminderDate) { this.reminderDate = reminderDate; }
    public void setReminderTime(String reminderTime) { this.reminderTime = reminderTime; }
    public void setStatus(String status) { this.status = status; }
    public void setSubmittedDate(String submittedDate) { this.submittedDate = submittedDate; }
    public void setSubmittedTime(String submittedTime) { this.submittedTime = submittedTime; }
    public void setNoLimit(boolean noLimit) { isNoLimit = noLimit; }
}
