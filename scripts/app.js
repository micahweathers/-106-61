// Global variables
let tasks = [];
let currentEditIndex = -1;
let hideCompleted = false;

// Form validation functions
function validateTitle(title) {
    if (!title || title.trim().length === 0) {
        return "Title is required";
    }
    if (title.trim().length < 3) {
        return "Title must be at least 3 characters";
    }
    if (title.trim().length > 50) {
        return "Title must be less than 50 characters";
    }
    return null;
}

function validateDescription(description) {
    if (!description || description.trim().length === 0) {
        return null;
    }
    if (description.trim().length < 10) {
        return "Description must be at least 10 characters";
    }
    if (description.trim().length > 500) {
        return "Description must be less than 500 characters";
    }
    return null;
}

function validateStartDate(startDate) {
    if (!startDate) {
        return "Start date is required";
    }
    const selectedDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return "Start date cannot be in the past";
    }
    return null;
}

function validateStatus(status) {
    const validStatuses = ["New", "In Progress", "Completed", "Cancelled"];
    if (!status || !validStatuses.includes(status)) {
        return "Please select a valid status";
    }
    return null;
}

function validateBudget(budget) {
    if (!budget || budget.trim() === "") {
        return null;
    }
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum)) {
        return "Budget must be a valid number";
    }
    if (budgetNum <= 0) {
        return "Budget must be greater than 0";
    }
    if (budgetNum > 1000000) {
        return "Budget must be less than $1,000,000";
    }
    return null;
}

function clearValidationErrors() {
    $(".error-message").remove();
    $(".form-control, #inputStatus").removeClass("error");
}

function showValidationError(fieldId, message) {
    const field = $(fieldId);
    field.addClass("error");
    field.after(`<div class="error-message">${message}</div>`);
}

function validateForm() {
    clearValidationErrors();

    const title = $("#inputTitle").val();
    const description = $("#inputDescription").val();
    const startDate = $("#inputDate").val();
    const status = $("#inputStatus").val();
    const budget = $("#inputBudget").val();

    let isValid = true;

    const titleError = validateTitle(title);
    if (titleError) {
        showValidationError("#inputTitle", titleError);
        isValid = false;
    }

    const descError = validateDescription(description);
    if (descError) {
        showValidationError("#inputDescription", descError);
        isValid = false;
    }

    const dateError = validateStartDate(startDate);
    if (dateError) {
        showValidationError("#inputDate", dateError);
        isValid = false;
    }

    const statusError = validateStatus(status);
    if (statusError) {
        showValidationError("#inputStatus", statusError);
        isValid = false;
    }

    const budgetError = validateBudget(budget);
    if (budgetError) {
        showValidationError("#inputBudget", budgetError);
        isValid = false;
    }

    return isValid;
}

function loadTasks() {
    console.log("Loading tasks from server...");
    $.ajax({
        type: "GET",
        url: API,
        success: function (res) {
            console.log("All tasks from server:", res);
            
            const myUserId = "micah-ch61";
            tasks = res
                .filter(taskData => taskData.userId === myUserId)
                .map(taskData => {
                    const task = new Task(
                        taskData.title,
                        taskData.description,
                        taskData.color,
                        taskData.startDate,
                        taskData.status,
                        taskData.budget
                    );
                    if (taskData.id) task.id = taskData.id;
                    if (taskData._id) task._id = taskData._id;
                    return task;
                });
            
            console.log("Micah's filtered tasks:", tasks);
            displayTasks();
            showSuccessMessage(`${tasks.length} of your tasks loaded`);
        },
        error: function (xhr, status, error) {
            console.error("Error loading tasks:", error);
            showErrorMessage("Failed to load tasks from server.");
            tasks = [];
            displayTasks();
        }
    });
}

function saveTaskToServer(task, callback) {
    console.log("Saving task to server:", task);
    $.ajax({
        type: "POST",
        url: API,
        data: JSON.stringify(task),
        contentType: "application/json",
        success: function (res) {
            console.log("Task saved successfully:", res);
            if (res.id) task.id = res.id;
            if (res._id) task._id = res._id;
            callback(true, res);
        },
        error: function (xhr, status, error) {
            console.error("Error saving task:", error);
            callback(false, error);
        }
    });
}

function updateTaskOnServer(task, callback) {
    console.log("Updating task on server:", task);
    const taskId = task._id || task.id;
    $.ajax({
        type: "PUT",
        url: `${API}/${taskId}`,
        data: JSON.stringify(task),
        contentType: "application/json",
        success: function (res) {
            console.log("Task updated successfully:", res);
            callback(true, res);
        },
        error: function (xhr, status, error) {
            console.error("Error updating task:", error);
            callback(false, error);
        }
    });
}

function deleteTaskFromServer(task, callback) {
    console.log("Deleting task from server:", task);
    const taskId = task._id || task.id;
    $.ajax({
        type: "DELETE",
        url: `${API}/${taskId}`,
        success: function (res) {
            console.log("Task deleted successfully:", res);
            callback(true, res);
        },
        error: function (xhr, status, error) {
            console.error("Error deleting task:", error);
            callback(false, error);
        }
    });
}

function saveTask() {
    console.log("=== SAVE TASK STARTED ===");
    
    if (!validateForm()) {
        console.log("Form validation failed");
        return;
    }

    const title = $("#inputTitle").val().trim();
    const description = $("#inputDescription").val().trim();
    const color = $("#inputColor").val();
    const startDate = $("#inputDate").val();
    const status = $("#inputStatus").val();
    const budget = $("#inputBudget").val();

    console.log("Form data collected:", {
        title,
        description,
        color,
        startDate,
        status,
        budget
    });

    if (currentEditIndex === -1) {
        const newTask = new Task(title, description, color, startDate, status, budget || 0);
        console.log("New task object created:", newTask);
        console.log("About to send POST request to server...");
        
        saveTaskToServer(newTask, function (success, res) {
            if (success) {
                console.log("✓ SERVER RESPONSE SUCCESS:", res);
                tasks.push(newTask);
                console.log("Task added to local array. Total tasks:", tasks.length);
                showSuccessMessage("Task created and saved to server!");
                displayTasks();
                clearForm();
            } else {
                console.log("✗ SERVER RESPONSE FAILED:", res);
                showErrorMessage("Failed to save task to server. Please try again.");
            }
        });
    } else {
        const existingTask = tasks[currentEditIndex];
        console.log("Updating existing task:", existingTask);
        
        existingTask.title = title;
        existingTask.description = description;
        existingTask.color = color;
        existingTask.startDate = startDate;
        existingTask.status = status;
        existingTask.budget = budget ? parseFloat(budget) : 0;
        
        console.log("About to send PUT request to server...");
        
        updateTaskOnServer(existingTask, function (success, res) {
            if (success) {
                console.log("✓ UPDATE SUCCESS:", res);
                showSuccessMessage("Task updated on server!");
                currentEditIndex = -1;
                $("#btnSave").text("Save Task");
                displayTasks();
                clearForm();
            } else {
                console.log("✗ UPDATE FAILED:", res);
                showErrorMessage("Failed to update task on server. Please try again.");
            }
        });
    }
}

function displayTasks() {
    const listSection = $("#list");
    
    const visibleTasks = hideCompleted 
        ? tasks.filter(task => task.status !== "Completed")
        : tasks;

    if (visibleTasks.length === 0) {
        const message = hideCompleted && tasks.length > 0
            ? "All tasks are completed!"
            : "No Tasks Yet";
        listSection.html(`
            <div class="empty-state">
                <h3>${message}</h3>
                <p>${hideCompleted ? "Show completed tasks to see them" : "Create your first task using the form!"}</p>
                <div class="task-icon">📋</div>
            </div>
            <div class="bubble-extra-1"></div>
            <div class="bubble-extra-2"></div>
            <div style="position: absolute; bottom: 20px; left: 20px;">
                <button class="btn btn-info" id="btnToggleCompletedInList" onclick="toggleCompletedTasks()">${hideCompleted ? "Show Completed" : "Hide Completed"}</button>
            </div>
        `);
        return;
    }

    let html = '<div class="task-header"><h3>Your Tasks</h3></div><div class="task-container">';

    visibleTasks.forEach((task) => {
        const originalIndex = tasks.indexOf(task);
        
        const formattedDate = new Date(task.startDate).toLocaleDateString();
        const formattedBudget = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(task.budget);

        html += `
            <div class="task-card task-border-color" data-color="${task.color}">
                <div class="task-header-row">
                    <h4 class="task-title">${task.title}</h4>
                    <span class="task-status status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                </div>
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                <div class="task-details">
                    <div class="task-detail">
                        <strong>Start:</strong> ${formattedDate}
                    </div>
                    ${task.budget > 0 ? `<div class="task-detail"><strong>Budget:</strong> ${formattedBudget}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn-edit" onclick="editTask(${originalIndex})">✏️ Edit</button>
                    <button class="btn-delete" onclick="deleteTask(${originalIndex})">🗑️ Delete</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += '<div class="bubble-extra-1"></div><div class="bubble-extra-2"></div>';
    html += `<div style="position: absolute; bottom: 20px; left: 20px;">
                <button class="btn btn-info" id="btnToggleCompletedInList" onclick="toggleCompletedTasks()">${hideCompleted ? "Show Completed" : "Hide Completed"}</button>
             </div>`;
    
    listSection.html(html);

    $('.task-border-color').each(function () {
        const color = $(this).data('color');
        $(this).css('border-left', `5px solid ${color}`);
    });
}

function editTask(index) {
    const task = tasks[index];
    currentEditIndex = index;

    $("#inputTitle").val(task.title);
    $("#inputDescription").val(task.description);
    $("#inputColor").val(task.color);
    $("#inputDate").val(task.startDate);
    $("#inputStatus").val(task.status);
    $("#inputBudget").val(task.budget > 0 ? task.budget : "");

    $("#btnSave").text("Update Task");
    $("#form")[0].scrollTop = 0;

    showSuccessMessage("Task loaded for editing");
}

function deleteTask(index) {
    if (confirm("Are you sure you want to delete this task?")) {
        const taskToDelete = tasks[index];

        deleteTaskFromServer(taskToDelete, function (success, res) {
            if (success) {
                const deletedTask = tasks.splice(index, 1)[0];
                console.log("Task deleted:", deletedTask);
                displayTasks();
                showSuccessMessage("Task deleted from server!");

                if (currentEditIndex === index) {
                    currentEditIndex = -1;
                    $("#btnSave").text("Save Task");
                    clearForm();
                } else if (currentEditIndex > index) {
                    currentEditIndex--;
                }
            } else {
                showErrorMessage("Failed to delete task from server. Please try again.");
            }
        });
    }
}

function clearForm() {
    $("#inputTitle").val("");
    $("#inputDescription").val("");
    $("#inputColor").val("#563d7c");
    $("#inputDate").val("");
    $("#inputStatus").val("");
    $("#inputBudget").val("");
    clearValidationErrors();
    currentEditIndex = -1;
    $("#btnSave").text("Save Task");
}

function showSuccessMessage(message) {
    $(".success-message, .error-message").remove();
    const successDiv = `<div class="success-message">${message}</div>`;
    $("#form").prepend(successDiv);
    setTimeout(() => {
        $(".success-message").fadeOut(500, function () {
            $(this).remove();
        });
    }, 3000);
}

function showErrorMessage(message) {
    $(".success-message, .error-message").remove();
    const errorDiv = `<div class="error-message-main">${message}</div>`;
    $("#form").prepend(errorDiv);
    setTimeout(() => {
        $(".error-message-main").fadeOut(500, function () {
            $(this).remove();
        });
    }, 5000);
}

function toggleCompletedTasks() {
    hideCompleted = !hideCompleted;
    displayTasks();
}

function deleteAllTasks() {
    if (tasks.length === 0) {
        showErrorMessage("No tasks to delete!");
        return;
    }

    if (confirm(`Are you sure you want to delete all ${tasks.length} tasks? This action cannot be undone.`)) {
        const deletePromises = tasks.map(task => {
            return new Promise((resolve, reject) => {
                deleteTaskFromServer(task, function (success) {
                    if (success) {
                        resolve();
                    } else {
                        reject();
                    }
                });
            });
        });

        Promise.all(deletePromises)
            .then(() => {
                tasks = [];
                displayTasks();
                showSuccessMessage("All tasks deleted successfully!");
                clearForm();
                currentEditIndex = -1;
            })
            .catch(() => {
                showErrorMessage("Some tasks failed to delete. Please refresh and try again.");
                loadTasks();
            });
    }
}

function init() {
    console.log("Task Manager initialized");

    $("#inputColor").val("#3d3f7cff");

    $("#btnSave").click(saveTask);

    $("#btnSave").after('<button class="btn btn-secondary" type="button" id="btnClear" style="margin-left: 10px;">Clear Form</button>');
    $("#btnClear").click(clearForm);
    $("#btnDeleteAll").click(deleteAllTasks);

    $("#inputTitle").blur(() => {
        const error = validateTitle($("#inputTitle").val());
        if (error) {
            $("#inputTitle").addClass("error");
        } else {
            $("#inputTitle").removeClass("error");
        }
    });

    $("#inputDescription").blur(() => {
        const error = validateDescription($("#inputDescription").val());
        if (error) {
            $("#inputDescription").addClass("error");
        } else {
            $("#inputDescription").removeClass("error");
        }
    });

    loadTasks();
}

window.onload = init;