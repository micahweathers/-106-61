const API="https://106api-b0bnggbsgnezbzcz.westus3-01.azurewebsites.net/api/tasks";

// Task constructor
class Task {
    constructor(title, description, color, startDate, status, budget) {
        this.userId = "micah-ch61";
        this.id = Date.now() + Math.random();
        this.title = title;
        this.description = description;
        this.color = color;
        this.startDate = startDate;
        this.status = status;
        this.budget = parseFloat(budget) || 0;
        this.createdAt = new Date().toISOString();
    }
}

function test(){
    $.ajax({
        type: "GET",
        url: API,
        success: function(working){
            console.log(working);
        },
        error: function(err){
            console.log(err);
        }
    });
}